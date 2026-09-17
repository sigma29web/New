/**
 * Gateway contract (docs/06-system/07-model-gateway.md §2). Single-turn, reproducible: a request carries the
 * rendered prompt, the prompt version, the pack reference and — for style-sensitive roles — the Narrative
 * Identity reference with BOTH contract hashes. Nothing here depends on a conversation.
 */
import { type Uuid } from '@yeonjae/domain';

export type ModelClass = 'R' | 'P' | 'M' | 'C' | 'E';

export interface NarrativeIdentityRef {
  readonly blockHash: string;
  readonly identityVersionId: Uuid;
  readonly roleVariant: string;
  readonly outputLanguage: 'en';
  readonly outputLanguageContractHash: string;
  readonly traditionContractHash: string;
}

export interface GatewayRequest {
  readonly workspaceId: Uuid;
  readonly projectId: Uuid;
  readonly jobId: Uuid;
  readonly activityId: string;
  readonly idempotencyKey: string;
  readonly role: string;
  readonly styleSensitive: boolean;
  readonly manuscriptProducing: boolean;
  readonly promptVersionId: Uuid;
  readonly promptHash: string;
  readonly productionPolicyVersion: string;
  readonly pack: {
    readonly id: Uuid;
    readonly hash: string;
    readonly renderedSystem: string;
    readonly renderedUser: string;
    readonly tokenEstimate: number;
  };
  readonly narrativeIdentityRef?: NarrativeIdentityRef | undefined;
  readonly outputSchemaRef?: string | undefined;
  readonly params?: Partial<ModelParams> | undefined;
  readonly modelClass: ModelClass;
  /**
   * Cancellation for THIS call (B-4-7). When it aborts, the in-flight provider request is abandoned and
   * the call settles `CANCELLED` — it is never retried, rerouted or repaired, because operator
   * cancellation is an intent rather than a transient outage. Optional so every existing caller and
   * adapter keeps working unchanged.
   */
  readonly signal?: AbortSignal | undefined;
}

export interface ModelParams {
  readonly temperature: number;
  readonly max_tokens: number;
  readonly top_p: number;
  readonly seed: number;
  readonly json_schema_mode: boolean;
}

export type FinishReason = 'stop' | 'length' | 'content_filter' | 'error';

export interface ProviderResponse {
  readonly modelId: string;
  readonly provider: string;
  readonly providerRequestId?: string | undefined;
  readonly text?: string | undefined;
  readonly json?: unknown;
  readonly finishReason: FinishReason;
  readonly usage: { readonly input: number; readonly output: number; readonly cached: number };
  readonly latencyMs: number;
}

export interface ProviderRequest {
  readonly modelId: string;
  readonly system: string;
  readonly user: string;
  readonly params: ModelParams;
  readonly outputSchema?: Record<string, unknown> | undefined;
  /** Workflow trace (role + activity + idempotency key); replay providers may key recordings by it. */
  readonly trace?:
    | { readonly role: string; readonly activityId: string; readonly idempotencyKey: string }
    | undefined;
}

/**
 * Every provider adapter implements exactly this; SDK types never leave the adapter.
 *
 * `signal` is the caller's cancellation (B-4-7). An adapter that can pass it to its transport SHOULD, and
 * should reject with `ProviderFailure('cancelled_local_abort', …)`. An adapter that cannot prove the
 * remote side stopped must not claim it did: the gateway records `remote_state: 'unknown'` unless the
 * adapter reports `remoteCancelConfirmed`.
 */
export interface Provider {
  readonly name: string;
  complete(req: ProviderRequest, signal?: AbortSignal): Promise<ProviderResponse>;
}

export interface GatewayResponse {
  readonly llmCallId: Uuid;
  readonly modelId: string;
  readonly provider: string;
  readonly output: { readonly text?: string | undefined; readonly json?: unknown };
  readonly finishReason: FinishReason;
  readonly usage: ProviderResponse['usage'];
  readonly costCents: number;
  readonly latencyMs: number;
  readonly schemaValid: boolean;
  readonly attempts: number;
  readonly outputLanguageCheck?:
    | { readonly performed: true; readonly passed: boolean; readonly englishConfidence: number }
    | { readonly performed: false }
    | undefined;
  readonly replayed: boolean;
}

export class GatewayError extends Error {
  constructor(
    readonly code:
      | 'NARRATIVE_IDENTITY_MISSING'
      | 'OUTPUT_LANGUAGE_CONTRACT_MISSING'
      | 'TRADITION_CONTRACT_MISSING'
      | 'NARRATIVE_IDENTITY_STALE'
      | 'NARRATIVE_IDENTITY_NOT_EMBEDDED'
      | 'OUTPUT_LANGUAGE_UNSUPPORTED'
      | 'OUTPUT_LANGUAGE_FAILED'
      | 'BUDGET_EXHAUSTED'
      | 'PROVIDER_FAILED'
      | 'SCHEMA_INVALID'
      | 'TRUNCATED'
      /** The operator cancelled the job while this call was pending or in flight (B-4-7). */
      | 'CANCELLED'
      /** Cancellation arrived after the work had already been atomically committed. */
      | 'CANCELLED_TOO_LATE',
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = 'GatewayError';
  }
}
