/**
 * Provider-failure classification for policy-authorized fallback (B-4-2).
 *
 * The gateway used to treat EVERY thrown provider error as a reason to move to the next route. That is the
 * wrong default: a transport hiccup and a rejected request are not the same event. Rerouting a rejected
 * request re-sends the same bytes to a second paid model and turns one deterministic refusal into N, while
 * rerouting a throttle or a 5xx is exactly the behaviour fallback exists for.
 *
 * Classification is therefore explicit and data-driven, and the default for an UNRECOGNIZED failure is
 * `non_retryable` — fail closed. A provider adapter states its own verdict by throwing a
 * `ProviderFailure`; anything else is classified from its shape, and a shape we do not recognize stops the
 * call rather than spending again on a guess.
 */

export type FailureClass =
  /** Transport/availability fault: the request may not have been seen. Fallback is authorized. */
  | 'retryable_transport'
  /** Provider asked us to slow down (429 / rate limit). Fallback is authorized. */
  | 'retryable_throttled'
  /** Provider-side fault (5xx / overloaded / unavailable). Fallback is authorized. */
  | 'retryable_provider'
  /** The request itself is wrong (4xx, bad schema, content refusal, auth). Fallback is NOT authorized. */
  | 'non_retryable_request'
  /** Anything unrecognized. Treated as non-retryable so an unknown fault cannot multiply spend. */
  | 'non_retryable_unknown'
  /**
   * The caller abandoned the request (B-4-7). NOT a provider fault and never retryable: an operator who
   * cancelled a job has not asked for the same bytes to be sent to a second paid model. Kept separate
   * from every `non_retryable_*` class so accounting and operator surfaces can tell a deliberate stop
   * from a refusal.
   */
  | 'cancelled_local_abort';

export const RETRYABLE_CLASSES: readonly FailureClass[] = [
  'retryable_transport',
  'retryable_throttled',
  'retryable_provider',
];

export function isRetryable(cls: FailureClass): boolean {
  return RETRYABLE_CLASSES.includes(cls);
}

/**
 * The typed error a provider adapter raises when it knows what happened. Adapters are the only code with
 * the vendor's status codes in hand, so they get to state the verdict rather than have it guessed from a
 * message string.
 */
export class ProviderFailure extends Error {
  constructor(
    readonly failureClass: FailureClass,
    message: string,
    readonly detail: {
      readonly status?: number | undefined;
      readonly providerRequestId?: string | undefined;
      /** True when the provider may have completed the work even though we never saw the response. */
      readonly possiblyCompleted?: boolean | undefined;
      /**
       * Set ONLY when the vendor affirmatively acknowledged cancellation. Absent or false means the
       * remote state is unknown: we abandoned our request, which is not evidence the model stopped.
       */
      readonly remoteCancelConfirmed?: boolean | undefined;
      /** Usage the provider reported despite the abort, when it reports any. Absent = unknown, not zero. */
      readonly usage?:
        { readonly input: number; readonly output: number; readonly cached: number } | undefined;
    } = {},
  ) {
    super(message);
    this.name = 'ProviderFailure';
  }
}

/** True for the one class that means "the caller stopped this", not "the provider misbehaved". */
export function isCancellation(cls: FailureClass): boolean {
  return cls === 'cancelled_local_abort';
}

/**
 * Whether a thrown error is a cancellation from any source: our own typed verdict, or the platform's
 * `AbortError` shape that a `fetch`-based adapter produces when its signal aborts.
 */
export function isCancellationError(err: unknown): boolean {
  if (err instanceof ProviderFailure) return isCancellation(err.failureClass);
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}

// NOTE: "aborted" is deliberately NOT a transport marker. An aborted request is a cancellation (B-4-7),
// and classifying it as `retryable_transport` would authorize fallback — re-sending the bytes of a job the
// operator just cancelled to a second paid model.
const TRANSPORT =
  /\b(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|EAI_AGAIN|ENOTFOUND|socket hang up|network|fetch failed)\b/i;
const CANCELLED = /\b(abort|aborted|aborterror|canceled|cancelled|operation was aborted)\b/i;
const TIMEOUT = /\b(timeout|timed out|deadline exceeded)\b/i;
const THROTTLE = /\b(rate.?limit|too many requests|429|quota exceeded|overloaded)\b/i;
const SERVER =
  /\b(50[0234]|internal server error|bad gateway|service unavailable|gateway timeout|server_error)\b/i;
const REQUEST =
  /\b(40[0134]|invalid.?request|unauthorized|forbidden|authentication|api.?key|content.?filter|content.?policy|unsupported|not.?found|context.?length)\b/i;

/**
 * Classify a thrown provider error. `ProviderFailure` is authoritative; otherwise the shape is inspected,
 * and an unrecognized shape is `non_retryable_unknown` — never a silent retry.
 */
export function classifyProviderFailure(err: unknown): FailureClass {
  if (err instanceof ProviderFailure) return err.failureClass;
  // A platform AbortError is a cancellation whatever else its message resembles. Checked before status
  // and shape so no later rule can promote it into a retryable class.
  if (err instanceof Error && err.name === 'AbortError') return 'cancelled_local_abort';

  const status = numericStatus(err);
  if (status !== undefined) {
    if (status === 429) return 'retryable_throttled';
    if (status >= 500) return 'retryable_provider';
    if (status >= 400) return 'non_retryable_request';
  }

  const code =
    typeof err === 'object' && err !== null && typeof (err as { code?: unknown }).code === 'string'
      ? (err as { code: string }).code
      : '';
  const message = err instanceof Error ? err.message : String(err);
  const text = `${code} ${message}`;

  // A rejected request is checked FIRST: "invalid request" must not be rerouted just because the vendor's
  // message happens to contain a word that also appears in a transport fault.
  if (CANCELLED.test(text)) return 'cancelled_local_abort';
  if (REQUEST.test(text)) return 'non_retryable_request';
  if (THROTTLE.test(text)) return 'retryable_throttled';
  if (SERVER.test(text)) return 'retryable_provider';
  if (TRANSPORT.test(text) || TIMEOUT.test(text)) return 'retryable_transport';
  return 'non_retryable_unknown';
}

function numericStatus(err: unknown): number | undefined {
  // `err` may be anything a provider threw, including `undefined` or a string, so the property read is
  // guarded rather than assumed.
  if (typeof err !== 'object' || err === null) return undefined;
  for (const key of ['status', 'statusCode', 'httpStatus']) {
    const v = (err as Record<string, unknown>)[key];
    if (typeof v === 'number' && Number.isInteger(v) && v >= 100 && v < 600) return v;
  }
  return undefined;
}
