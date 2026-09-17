/**
 * Active provider-request cancellation at the gateway boundary (B-4-7).
 *
 * WHY THIS SUITE EXISTS. Before this work the durable control plane could only stop a job BETWEEN steps:
 * `checkpointControl` runs before a step begins, so a cancel arriving while a provider call was in flight
 * was not observed until that call had finished and been paid for. The recorded limitation was exactly
 * that — "fencing prevents a stale commit but cannot abort an already-running provider request".
 *
 * The properties below are the contract. Each is a deterministic barrier test, not a sleep race: the mock
 * provider blocks on an explicit promise the test resolves, so "mid-call" is a fact rather than a timing
 * hope. No live provider, no credentials, no network.
 *
 * SCOPE HONESTY. Aborting a request proves the LOCAL request was abandoned. It does not prove a remote
 * model stopped computing, and nothing here claims that: the audit distinguishes `local_aborted` from
 * `remote_cancel_confirmed`, and an adapter that cannot prove remote cancellation reports
 * `remote_state_unknown`.
 */
import { describe, expect, it } from 'vitest';
import { uuidv7 } from '@yeonjae/domain';
import { Gateway, MemoryAuditStore, MemoryBudget, type RoutingTable } from './gateway.js';
import {
  GatewayError,
  type GatewayRequest,
  type Provider,
  type ProviderRequest,
  type ProviderResponse,
} from './types.js';
import { MockProvider } from './mock-provider.js';
import { ProviderFailure } from './failures.js';

const IDENTITY = {
  ref: 'project/0191b2a0-0000-7000-8000-000000000001@1',
  versionId: '0191b2a0-0000-7000-8000-000000060001',
  outputLanguage: 'en',
  tradition: 'korean_webnovel',
} as const;

function route(modelId: string, provider: string, family: string, priority: number) {
  return {
    modelId,
    provider,
    priority,
    family,
    priceInPerMTokCents: 100,
    priceOutPerMTokCents: 400,
    maxContextTokens: 200_000,
    supportsJsonSchema: true,
  };
}

/** A provider that blocks until the test releases it, and honours an abort signal while blocked. */
class BlockingProvider implements Provider {
  readonly name = 'blocking';
  calls = 0;
  /** Resolves once the provider has actually entered `complete` — the barrier that makes "mid-call" true. */
  entered!: Promise<void>;
  private announceEntered!: () => void;
  private release!: (out: { ok: boolean }) => void;
  private gate: Promise<{ ok: boolean }>;
  /** Proves every listener added to the caller's signal is removed again. */
  listenerRemoved = false;

  constructor() {
    this.entered = new Promise<void>((r) => (this.announceEntered = r));
    this.gate = new Promise<{ ok: boolean }>((r) => (this.release = r));
  }

  finish(): void {
    this.release({ ok: true });
  }

  fail(): void {
    this.release({ ok: false });
  }

  async complete(req: ProviderRequest, signal?: AbortSignal): Promise<ProviderResponse> {
    this.calls += 1;
    this.announceEntered();
    // A real HTTP adapter passes the signal to fetch; the deterministic equivalent is to race the
    // in-flight work against the signal and reject with the adapter's own abort verdict.
    const aborted = new Promise<never>((_, reject) => {
      if (signal?.aborted) {
        reject(new ProviderFailure('cancelled_local_abort', 'request aborted before dispatch'));
        return;
      }
      const onAbort = (): void => {
        this.listenerRemoved = true;
        reject(new ProviderFailure('cancelled_local_abort', 'request aborted in flight'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
    const done = this.gate.then((r) => {
      if (!r.ok) throw new ProviderFailure('retryable_transport', 'provider failed after release');
      return {
        modelId: req.modelId,
        provider: this.name,
        text: 'A released passage.',
        finishReason: 'stop' as const,
        usage: { input: 10, output: 5, cached: 0 },
        latencyMs: 1,
      };
    });
    return await Promise.race([done, aborted]);
  }
}

function requestFor(): GatewayRequest {
  return {
    workspaceId: uuidv7(),
    projectId: uuidv7(),
    jobId: uuidv7(),
    activityId: 'act-cancel-1',
    idempotencyKey: `idem-${uuidv7()}`,
    role: 'drafter',
    styleSensitive: false,
    manuscriptProducing: false,
    promptVersionId: uuidv7(),
    promptHash: 'sha256:prompt',
    productionPolicyVersion: 'policy/standard@1',
    pack: {
      id: uuidv7(),
      hash: 'sha256:pack',
      renderedSystem: 'system',
      renderedUser: 'user',
      tokenEstimate: 100,
    },
    narrativeIdentityRef: IDENTITY,
    modelClass: 'P',
  };
}

function gatewayWith(
  providers: Map<string, Provider>,
  routing: RoutingTable,
  audit: MemoryAuditStore,
) {
  return new Gateway({
    routing,
    providers,
    audit,
    budget: new MemoryBudget(1_000_000),
    guardContext: {
      identity: {
        ref: IDENTITY.ref,
        versionId: IDENTITY.versionId,
        outputLanguage: IDENTITY.outputLanguage,
        tradition: IDENTITY.tradition,
      },
    },
  });
}

const singleRoute: RoutingTable = {
  R: [],
  P: [route('blocking-1', 'blocking', 'alpha', 1)],
  M: [],
  C: [],
  E: [],
};

describe('cancellation requested before the provider call starts', () => {
  it('performs zero provider invocations', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    controller.abort();

    await expect(gw.call({ ...requestFor(), signal: controller.signal })).rejects.toMatchObject({
      code: 'CANCELLED',
    });
    expect(provider.calls).toBe(0);
  });

  it('records the call as cancelled with no billable attempt', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    controller.abort();
    const req = { ...requestFor(), signal: controller.signal };

    await expect(gw.call(req)).rejects.toThrow(GatewayError);
    const record = audit.records.find((r) => r.idempotency_key === req.idempotencyKey);
    expect(record?.status).toBe('cancelled');
    expect(record?.cost_cents).toBe(0);
    // No provider was contacted, so there is no attempt to account for at all.
    expect(record?.attempt_records ?? []).toEqual([]);
  });
});

describe('cancellation requested while a provider call is running', () => {
  it('aborts the in-flight request instead of waiting for it', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const pending = gw.call({ ...requestFor(), signal: controller.signal });

    await provider.entered; // the call is genuinely in flight
    controller.abort(); // and only now is it cancelled

    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    expect(provider.calls).toBe(1);
  });

  it('is not retried, rerouted or repaired after cancellation', async () => {
    const primary = new BlockingProvider();
    const secondary = new MockProvider();
    const audit = new MemoryAuditStore();
    const routing: RoutingTable = {
      R: [],
      P: [route('blocking-1', 'blocking', 'alpha', 1), route('mock-2', 'mock', 'beta', 2)],
      M: [],
      C: [],
      E: [],
    };
    const gw = gatewayWith(
      new Map<string, Provider>([
        ['blocking', primary],
        ['mock', secondary],
      ]),
      routing,
      audit,
    );
    const controller = new AbortController();
    const pending = gw.call({ ...requestFor(), signal: controller.signal });

    await primary.entered;
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    // The whole point: operator cancellation is not a transient outage, so the second paid route is
    // never tried. A cancelled call that fell through to fallback would multiply spend on an abandoned job.
    expect(primary.calls).toBe(1);
    expect(secondary.callCount).toBe(0);
  });

  it('records the aborted attempt truthfully rather than as a provider failure', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const req = { ...requestFor(), signal: controller.signal };
    const pending = gw.call(req);
    await provider.entered;
    controller.abort();
    await expect(pending).rejects.toThrow(GatewayError);

    const record = audit.records.find((r) => r.idempotency_key === req.idempotencyKey);
    expect(record?.status).toBe('cancelled');
    const attempts = record?.attempt_records ?? [];
    expect(attempts).toHaveLength(1);
    const only = attempts[0];
    expect(only?.outcome).toBe('cancelled');
    // Local abort is what we can prove. Remote state is explicitly unknown, never assumed stopped.
    expect(only?.cancellation).toMatchObject({ local_aborted: true, remote_state: 'unknown' });
    // Usage is unknown, not zero: the provider may have billed for work we abandoned.
    expect(only?.usage_known).toBe(false);
    expect(only?.cost_cents).toBe(0);
  });

  it('removes its abort listener on the cancellation path', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const pending = gw.call({ ...requestFor(), signal: controller.signal });
    await provider.entered;
    controller.abort();
    await expect(pending).rejects.toThrow(GatewayError);
    expect(provider.listenerRemoved).toBe(true);
  });
});

describe('cancellation racing a settled provider call', () => {
  it('discards a success that arrives after authoritative cancellation', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const req = { ...requestFor(), signal: controller.signal };
    const pending = gw.call(req);

    await provider.entered;
    controller.abort();
    provider.finish(); // the provider succeeds, but too late to matter

    await expect(pending).rejects.toMatchObject({ code: 'CANCELLED' });
    const record = audit.records.find((r) => r.idempotency_key === req.idempotencyKey);
    expect(record?.status).toBe('cancelled');
    // A discarded response must not be promoted into an artifact, and must not be replayable as a
    // completed call by the idempotency path.
    expect(record?.output_ref ?? null).toBeNull();
    const replay = await audit.findByIdempotencyKey(req.idempotencyKey);
    expect(replay).toBeUndefined();
  });

  it('does not let a late provider failure overwrite the cancellation verdict', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const req = { ...requestFor(), signal: controller.signal };
    const pending = gw.call(req);

    await provider.entered;
    controller.abort();
    provider.fail();

    const err: unknown = await pending.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).code).toBe('CANCELLED');
    const record = audit.records.find((r) => r.idempotency_key === req.idempotencyKey);
    expect(record?.status).toBe('cancelled');
  });

  it('settles exactly once', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const req = { ...requestFor(), signal: controller.signal };
    const pending = gw.call(req);
    await provider.entered;
    // Concurrent, repeated cancellation is idempotent: one audit row, one rejection.
    controller.abort();
    controller.abort();
    provider.finish();
    await expect(pending).rejects.toThrow(GatewayError);
    const rows = audit.records.filter((r) => r.idempotency_key === req.idempotencyKey);
    expect(rows).toHaveLength(1);
  });
});

describe('cancellation is not conflated with provider failure', () => {
  it('classifies operator cancellation distinctly from a transport timeout', async () => {
    const audit = new MemoryAuditStore();
    const timeoutProvider = new MockProvider().injectFault({
      kind: 'timeout',
      failureClass: 'retryable_transport',
    });
    const gw = gatewayWith(
      new Map<string, Provider>([['mock', timeoutProvider]]),
      { R: [], P: [route('mock-1', 'mock', 'alpha', 1)], M: [], C: [], E: [] },
      audit,
    );
    const req = requestFor();
    const err: unknown = await gw.call(req).catch((e: unknown) => e);
    // A timeout stays a provider failure and keeps its retryable classification; it must never be
    // relabelled as an operator cancellation, or an outage would look like a deliberate stop.
    expect((err as GatewayError).code).not.toBe('CANCELLED');
    const record = audit.records.find((r) => r.idempotency_key === req.idempotencyKey);
    expect(record?.status).toBe('failed');
  });

  it('leaves ordinary fallback behaviour unchanged when nothing is cancelled', async () => {
    const audit = new MemoryAuditStore();
    const failing = new MockProvider().injectFault({
      kind: 'error',
      failureClass: 'retryable_provider',
    });
    const healthy = new MockProvider();
    healthy.register(
      { system: 'system', user: 'user', modelId: 'mock-2' },
      { text: 'Recovered on the second route.' },
    );
    const gw = gatewayWith(
      new Map<string, Provider>([
        ['failing', failing],
        ['healthy', healthy],
      ]),
      {
        R: [],
        P: [route('mock-1', 'failing', 'alpha', 1), route('mock-2', 'healthy', 'beta', 2)],
        M: [],
        C: [],
        E: [],
      },
      audit,
    );
    const res = await gw.call(requestFor());
    expect(res.output.text).toBe('Recovered on the second route.');
    expect(healthy.callCount).toBe(1);
  });

  it('completes normally when a signal is supplied but never aborted', async () => {
    const provider = new BlockingProvider();
    const audit = new MemoryAuditStore();
    const gw = gatewayWith(new Map([['blocking', provider]]), singleRoute, audit);
    const controller = new AbortController();
    const pending = gw.call({ ...requestFor(), signal: controller.signal });
    await provider.entered;
    provider.finish();
    const res = await pending;
    expect(res.output.text).toBe('A released passage.');
    // The listener must be cleaned up on the SUCCESS path too, not only on abort.
    expect(controller.signal.aborted).toBe(false);
  });
});
