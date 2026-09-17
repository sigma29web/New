-- 0012 — cancelled provider attempts (B-4-7)
--
-- WHY. Migration 0011 added `llm_calls.attempt_records` with a fail-closed trigger that accepts only
-- `outcome IN ('succeeded','failed')`. Active provider-request cancellation introduces a third real
-- outcome: an attempt the OPERATOR stopped. Recording that as `failed` would be untrue in a way that
-- matters — it would make a deliberate stop indistinguishable from a provider fault in every cost and
-- reliability read, and `failed` attempts are the ones the fallback policy treats as reroutable.
--
-- FORWARD-ONLY AND NON-DESTRUCTIVE. This widens an accepted-value set and adds optional keys. Existing
-- rows stay valid and are not rewritten; nothing is dropped; no column is removed or retyped. There is
-- deliberately NO down migration: reverting would have to reject rows that are already stored, which is
-- how a "rollback" turns into data loss. Restore compatibility is therefore preserved in the only
-- direction that is safe, and the disposable restore drill covers the upgraded schema.
--
-- TRUTHFUL ACCOUNTING. Three optional keys are permitted on an attempt record, and each exists because
-- inferring it would be a lie:
--   * `usage_known`   — false when we never saw a response. Without it, an aborted attempt is stored with
--                       zero usage and reads as a PROVEN-free call, when in fact billing is UNKNOWN.
--   * `cancellation`  — `local_aborted` is what we can prove; `remote_state` is `confirmed` only when the
--                       vendor acknowledged it, otherwise `unknown`. Abandoning our request is not
--                       evidence that the model stopped computing.
--   * `discarded_response` — a response that arrived after cancellation became authoritative and was
--                       therefore thrown away rather than promoted into an artifact.
--
-- LEAST PRIVILEGE AND RLS. Unchanged by design. This migration replaces one validation function in the
-- `canon` schema and re-grants EXECUTE to the same single role (`yeonjae_app`) that 0011 granted it to.
-- No new table, column, policy, role or grant is introduced, so the RLS surface of `llm_calls` is
-- identical to the one migration 0006 established and 0011 left alone.

CREATE OR REPLACE FUNCTION canon.assert_attempt_records() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  a jsonb;
  c jsonb;
BEGIN
  IF jsonb_typeof(NEW.attempt_records) <> 'array' THEN
    PERFORM canon.raise_code('ATTEMPT_RECORDS_INVALID', 'attempt_records must be a JSON array');
  END IF;
  FOR a IN SELECT value FROM jsonb_array_elements(NEW.attempt_records) LOOP
    IF jsonb_typeof(a) <> 'object'
       OR a->>'attempt' IS NULL
       OR a->>'model_id' IS NULL
       OR a->>'provider' IS NULL
       OR coalesce(a->>'outcome', '') NOT IN ('succeeded', 'failed', 'cancelled') THEN
      PERFORM canon.raise_code(
        'ATTEMPT_RECORDS_INVALID',
        'each attempt record needs attempt, model_id, provider and outcome in (succeeded, failed, cancelled)');
    END IF;

    -- `usage_known` is a boolean when present. A string "false" would read as truthy in most consumers,
    -- so the shape is enforced here rather than trusted.
    IF a ? 'usage_known' AND jsonb_typeof(a->'usage_known') <> 'boolean' THEN
      PERFORM canon.raise_code(
        'ATTEMPT_RECORDS_INVALID', 'usage_known must be a boolean when present');
    END IF;

    IF a ? 'discarded_response' AND jsonb_typeof(a->'discarded_response') <> 'boolean' THEN
      PERFORM canon.raise_code(
        'ATTEMPT_RECORDS_INVALID', 'discarded_response must be a boolean when present');
    END IF;

    -- A cancelled attempt must carry its cancellation provenance, and `remote_state` must be one of the
    -- two honest values. An attempt that claimed cancellation without saying what we actually know about
    -- the remote side would be exactly the overclaim this migration exists to prevent.
    IF a->>'outcome' = 'cancelled' THEN
      IF NOT (a ? 'cancellation') OR jsonb_typeof(a->'cancellation') <> 'object' THEN
        PERFORM canon.raise_code(
          'ATTEMPT_RECORDS_INVALID', 'a cancelled attempt needs a cancellation object');
      END IF;
      c := a->'cancellation';
      IF jsonb_typeof(c->'local_aborted') <> 'boolean'
         OR coalesce(c->>'remote_state', '') NOT IN ('confirmed', 'unknown') THEN
        PERFORM canon.raise_code(
          'ATTEMPT_RECORDS_INVALID',
          'cancellation needs boolean local_aborted and remote_state in (confirmed, unknown)');
      END IF;
    ELSIF a ? 'cancellation' THEN
      -- Only a cancelled attempt may carry it; otherwise the field would be decorative and misleading.
      PERFORM canon.raise_code(
        'ATTEMPT_RECORDS_INVALID', 'cancellation is only valid on a cancelled attempt');
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

GRANT EXECUTE ON FUNCTION canon.assert_attempt_records() TO yeonjae_app;

COMMENT ON COLUMN llm_calls.attempt_records IS
  'One entry per ACTUAL provider attempt for this call (B-4-2, B-4-7): attempt, model_id, provider, '
  'outcome in (succeeded, failed, cancelled), failure_class, error_class, cost_cents, usage, '
  'usage_known, latency_ms, and on a cancelled attempt a cancellation object recording local_aborted and '
  'remote_state in (confirmed, unknown) plus optional possibly_completed and discarded_response. '
  'cost_cents on the parent row stays the authoritative total. Never prompts, prose or credentials.';
