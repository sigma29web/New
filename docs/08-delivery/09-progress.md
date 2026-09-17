# Progress — durable project state

The single place that records implementation status (ADR-0043). Update it in every checkpoint commit.
Everything else in `docs/` describes design; only this file claims what exists and what has run.

## Current state

| Item | Value |
| --- | --- |
| Project | Yeonjae Studio — English manuscripts in the Korean serialized-webnovel tradition |
| Phase | **Checkpoint 7 — complete and merged upstream** via [PR #10](https://github.com/jsisiwb/New/pull/10) at `59d62752f31261a0c86921603993f37992194dd2`. **Phase 4 — MVP hardening is ACTIVE and incomplete.** Its credential-free DETERMINISTIC portions were **MERGED UPSTREAM** via [PR #12](https://github.com/jsisiwb/New/pull/12) at merge commit `99e6bf5ccf962c2283589745ccbef7983cb682d6`, and the **100-set contrast corpus (B-4-5a)** followed via [PR #13](https://github.com/jsisiwb/New/pull/13) at merge commit `4df7d92ff3d1641da0f0f270940aa31d33c7cc89` (parents `99e6bf5ccf962c2283589745ccbef7983cb682d6` and `bafc9cc23ce632608f38ed3984ea5c0ccc3b72df`). Merged: the deterministic halves of B-4-1, B-4-2, B-4-3, B-4-4 and B-4-6, B-4-5's blinded reviewer tooling, and the B-4-5a corpus expansion. Still **not run** because each needs a paid provider, a deployment environment, repository administration or a human reviewer: the live 20-chapter × five-night validation, the real-provider outage drill, staging/production restore, PITR, live credential rotation and the bilingual human review. **Neither B-4-1, B-4-2, B-4-5 nor Phase 4 is complete.** Checkpoint 6 merged via upstream PR #9 at `6195700`; Checkpoint 5 via PR #8 at `c8cfb59`; Checkpoints 0–4 in PRs #1–#4 |
| Default branch | `hoplite/ainos-1ac771f8` in `jsisiwb/New` — the upstream base/default development branch, **now at the corpus-integration merge commit `4df7d92ff3d1641da0f0f270940aa31d33c7cc89`** (PR #13; parents: the Phase 4 deterministic-integration merge `99e6bf5ccf962c2283589745ccbef7983cb682d6` and the reviewed 100-set corpus head `bafc9cc23ce632608f38ed3984ea5c0ccc3b72df`). The writable fork base `hoplite/ainos-1ac771f8` in `sigma29web/New` is **synchronized at the same SHA** `4df7d92f…`, verified with `git ls-remote` against both remotes |
| Working branch | **Active:** `hoplite/morgantina-64e49616-active-cancellation` in the writable fork `sigma29web/New`, created at exactly the corpus-integration merge commit `4df7d92ff3d1641da0f0f270940aa31d33c7cc89` and carrying the active provider-request cancellation work (B-4-7). Markers: `--corpus-100-merged-4df7d92f` @ `4df7d92f…` and `--active-cancellation-start-4df7d92f` @ `4df7d92f…`. **HISTORICAL PROVENANCE ONLY (no longer written to):** `hoplite/morgantina-64e49616` @ `bafc9cc23ce632608f38ed3984ea5c0ccc3b72df`, the reviewed 100-set corpus head, which is the second parent of the upstream merge; its fork staging PR [sigma29web/New#1](https://github.com/sigma29web/New/pull/1) is **closed without being merged** (the work reached upstream through PR #13 instead). Its ten markers are retained and unmoved: `--phase-4-base-99e6bf5c`, `--recovered-sigma28-pr2-73d3747`, `--contrast-050-e123bbe`, `--contrast-060-db71047`, `--contrast-070-8a2b8cc`, `--contrast-080-240b116`, `--contrast-090-c8fec97`, `--contrast-100-3e56a2c`, `--corpus-100-release-review-start-92993edd`, `--corpus-100-release-review-passed-bafc9cc`. The three recovered commit SHAs (`4eb15e30…`, `f32b8744…`, `73d3747…`) were preserved by fast-forward and are now upstream history; `sigma28web/New#2` remains open, draft and unmerged and was never modified. Also historical: the earlier forks `sigma23web`–`sigma28web/New` and their markers. No published commit was ever rewritten across these continuations. Upstream branch protection remains **unavailable/unconfigured**, so the compensating controls stay procedural: fork-only implementation, no base-branch writes, draft staging PRs, green push and PR CI, immutable markers, no force-push, and no merge without explicit authorization |
| Application code | pnpm workspace: `packages/prose`, `packages/domain`, `packages/db` (migrations 0001–0004 — 0004 adds `workflow_id`/idempotency/`pins` on `jobs`, `workflow_artifacts` content-addressed store, `dependency_edges`; `canon.commit_delta`, `canon.rollback_latest`, bitemporal helpers, `retrieval.ts` accepted-only reads, lexical search, summaries, ACS/pack persistence), `packages/canon` (deterministic verifier + acceptance), `packages/narrative` (profile store, composition, Block compiler), `packages/prompts` (25 immutable prompt families v1.0.0, registry, prompt sets), `packages/gateway` (Guard, routing, budget, repair, output-language path, audit; Mock/Replay providers — Replay gains `activity:<id>` binding), `packages/context` (Active Constraint Set compiler, 4 pack templates, query plan, structured fetch, Postgres FTS retriever + vector interface, T0–T3 assembler with ladder, provenance renderer, manifest + pack hash, validation, `buildPack`), `packages/workflows` (Postgres-checkpointed `runStep` runtime, planning/drafting/evaluation/revision/acceptance stages, `produceChapter` core loop with previous-chapter gate before spend, `workflowStatus`, `exportAccepted`; Replay fixture `examples/fixture/ch01`), `apps/cli` (incl. `chapter:produce` / `chapter:status` / `chapter:resume` / `export:accepted` operator surface over the production workflow, replay-only), `apps/api` (Checkpoint 7: Fastify `/v1` operator API — session/API-key authentication, membership-derived authorization, RLS-scoped connections, RFC 9457 problem details, `Idempotency-Key` handling, cursor pagination, security headers, health/readiness, audit log; migration 0006 adds identity, membership, row-level security on every workspace-owned table, API idempotency keys, job control columns, the append-only `job_events` log and the `exports` table; migration 0007 narrows the request-scoped role's grants to least privilege after the audit; migration 0008 adds fenced target leases; migration 0009 adds `canon.assert_lease_fence`, the in-transaction fence assertion that makes fencing atomic with the write it protects (ADR-0048); migration 0010 adds the operator-editable `/v1` write resource families; job control + SSE, accepted-only TXT/DOCX export, the canon correction/retcon/regeneration-preview/rollback HTTP surface, canon/cost/budget inspector reads, structured-log + trace-correlated observability with redaction, the per-process sliding-window rate limiter and the default-deny CORS allowlist are delivered), `apps/worker` (Checkpoint 7: Temporal worker over the proven chapter loop, ADR-0047 — deterministic workflow ids, fenced target leases, versioned prose-free activity contracts, typed retry classification, pause/resume/cancel signals, progress queries, deterministic history replay; replay-only provider routing with no live-call path), `apps/web` (Checkpoint 7: Next.js 16 / React 19 operator application covering all 11 operator work areas over the real `/v1` API, with journey, accessibility and keyboard-path tests) |
| CI | `planning-validation.yml` (validator) + `ci.yml` (Postgres 16 service; types-fresh, typecheck, lint, format, unit + integration tests, the 120-chapter replay, the chaos drills, the disposable restore drill, the defensive security suite, the deterministic cost suite, the contrast regression, CLI/API/worker/web smoke, web production build, dependency-audit gate, gitleaks) on every push/PR. Each of the five explicit hardening suites is run by its own runner AND verified again from its own durable report (`coverage/chaos-report.json`, `restore-drill-report.json`, `security-report.json`, `cost-report.json`) rather than from `coverage/junit.xml`, which every later vitest invocation overwrites — the defect D-4 repair. `pnpm check` runs the same sequence including all five suites (the defect D-7 repair); gitleaks is the one documented CI-only difference and is **unavailable locally**. **Latest upstream evidence: on the corpus-integration merge commit `4df7d92f`, [planning-validation](https://github.com/jsisiwb/New/actions/runs/35231875291) succeeded and secret scanning (gitleaks) succeeded, but the main [ci](https://github.com/jsisiwb/New/actions/runs/35231875179) run STALLED mid-suite and carries no conclusion — it is recorded as INCOMPLETE EVIDENCE, not a pass.** The same tree was independently revalidated on the continuation branch (68 files / 1,008 tests / 0 skipped against PostgreSQL 16.14), and the exact reviewed corpus head `bafc9cc2…` that formed the merge's second parent had all four of its own workflows green before the merge. On the preceding merge `99e6bf5c`, [ci](https://github.com/jsisiwb/New/actions/runs/35205393002) and [planning-validation](https://github.com/jsisiwb/New/actions/runs/35205392869) both succeeded. A PR with zero check runs is unverified, never "green" |

## Checkpoints

| # | Name | Branch | Status | PR |
| --- | --- | --- | --- | --- |
| 0 | Corrected planning baseline (audit, ADR-0037…0044, validator, schemas, fixture, policies) | `hoplite/prokonnesos-fc9b87c1` | done, awaiting review | [#1](https://github.com/jsisiwb/New/pull/1) |
| 1 | Repository foundation (pnpm workspace, TS strict, lint/format/test, schema→types lockstep, CI, mock provider, CLI skeleton, code-point/length/language primitives, StoryClock + lifecycle machines, policy loader) | `…--build-01-foundation` (stacked on 0) | done, awaiting review | [#2](https://github.com/jsisiwb/New/pull/2) |
| 2 | Domain, database and canon core (migration 0001; immutable versions; code-point evidence trigger; frame × timeline rule; `canon.commit_delta` with change classes + complete `inverse`; `canon.rollback_latest`; quarantine; bitemporal helpers; verifier; CLI DB commands) | `…--build-01-foundation--build-02-domain-canon` (stacked on 1) | done, awaiting review | [#3](https://github.com/jsisiwb/New/pull/3) |
| 3 | Narrative identity (profiles as data, composition, Block compiler with role variants, both contract hashes, shedding, overflow error), prompt registry (24 families, immutable content-hashed versions, strict variables, prompt sets), gateway (fail-closed Guard, routing, budget guard, bounded repair, truncation, output-language discard→regenerate→reroute, idempotent audit; Mock/Replay/fault providers), migration 0002 (append-only `llm_calls` with both contract hashes, immutable `prompt_versions`, `jobs`/`job_steps`) | `…--build-02-domain-canon--build-03-identity-gateway` (stacked on 2) | done, awaiting review | [#4](https://github.com/jsisiwb/New/pull/4) |
| 4 | Context and retrieval (Active Constraint Set compiler with `CONSTRAINTS_OVERFLOW`; templates `pack.scene_writer` / `pack.chapter_planner` / `pack.continuity_checker` / `pack.extractor` v1.0.0; deterministic query plan; structured canon fetch at the pinned canon version on the contract timeline — states with evidence, knower-specific knowledge with secrets and prior-loop/source-story memory labels, directional relationships + register, promises, events, world rules; previous accepted chapter L1 + verbatim tail + hook + committed deltas + elapsed time; migration 0003 `summaries` / `search_documents` (accepted-only triggers, idempotent indexing, de-acceptance cleanup) / `active_constraint_sets` / `context_packs` / `embedding_sets`; Postgres FTS retriever + `VectorRetriever` interface; T0–T3 with `PACK_T0_OVERFLOW` / `PACK_T1_OVERFLOW` and the ladder; provenance-tagged rendering; manifest with sections, sources, versions, rank scores, drop reasons, degradation flags, pack hash; pre-call validation; `pack:build` CLI; ADR-0045) | `…--build-03-identity-gateway--build-04-context-retrieval` (stacked on 3) | done, awaiting review | stacked on #4 |
| 5 | Chapter-production vertical slice (deterministic Postgres-checkpointed core loop: intake → spec → bible → arc → locked contract → scene plan → draft → checks → bounded revision → approval-lock → extraction → verification → atomic commit → L1 summary + accepted-only index + dependency edges; ch.1 → ch.2 carries summary/tail/hook/deltas; `exportAccepted`; migration 0004 `jobs.workflow_id`/idempotency/`pins` + `workflow_artifacts`; Replay `activity:<id>` binding; CLI `chapter:produce` / `chapter:status` / `chapter:resume` / `export:accepted` operator surface with replay-only routing, JSON output, nonzero exit on failure; ADR-0046) | `hoplite/kos-969b8d7e--checkpoint-05-completion` | done, merged | upstream [#8](https://github.com/jsisiwb/New/pull/8) |
| 6 | Quality and long-form validation | merged upstream at `6195700` (developed on `hoplite/megale-polis-83bf1984` in the historical fork `sigma23web/New`) | done, merged | [#9](https://github.com/jsisiwb/New/pull/9) |
| 7 | Interface and hardening (identity/RLS, complete versioned `/v1` API incl. all write families, job control + SSE, accepted-only TXT/DOCX export, durable Temporal orchestration, atomic lease fencing, canon correction/retcon/rollback + HTTP surface, inspectors, observability, rate limiting, CORS allowlist, runbooks, `apps/web` with all 11 operator work areas) | merged into `hoplite/ainos-1ac771f8` at `59d6275` (work branch `hoplite/medma-023f017e` @ `2f51c4e`, historical) | **complete and merged upstream; post-merge CI and planning validation green. See the Checkpoint 7 table for the authoritative per-item state and its open limitations** | [#10](https://github.com/jsisiwb/New/pull/10) (merged) |

PR dependency rule: each checkpoint PR is based on the previous checkpoint branch and states its parent;
merge bottom-up. No PR is merged without explicit user authorization.

## Validation commands and latest results

| Command | Purpose | Last result |
| --- | --- | --- |
| `pip install jsonschema && python3 tools/validate-planning-package.py` | schemas, examples, canon-delta union, evidence offsets against fixture manuscripts, cross-file refs, stale terms, truthfulness | **ALL OK** (33 schemas, all `$ref` resolved; 0 contradiction / stale-term hits) — re-run at Checkpoint 7 closeout |
| `DATABASE_URL=postgres://… CI=true pnpm check` | types-fresh → typecheck → lint → format:check → unit + Postgres integration tests → web build → validator → contrast | **local green at Checkpoint 7 closeout** on the merge commit `59d6275`: generated types fresh (33 schemas), typecheck / lint / format:check clean, **55 test files / 772 tests passed**, planning validation ALL OK, contrast 800 evaluations with 280/280 agreement and 0 false positives / 0 false negatives, `pnpm audit --audit-level=high` no known vulnerabilities, `git diff --check` clean; PostgreSQL 16, Node 22.23.2, pnpm 10.26.0, Python 3.12.3. Local green is not GitHub green: see the PR's Actions runs for CI evidence |
| `pnpm cli identity:compile project/…@1 writer_full 2000` | compiles the fixture identity block: both contracts first, 11 sections, 1,272 est. tokens, deterministic hash | ok |
| `pnpm cli prompts:list` | 25 immutable prompt versions + active prompt set id | ok |
| `pnpm cli verify-evidence examples/fixture/manuscripts/ch09.accepted.txt examples/fixture/canon-delta.ch09.json` | code-point evidence verification via the CLI | ok: 8 spans verified |
| `pnpm cli db:migrate … manuscript:import … manuscript:approve … canon:accept … canon:state-at` | end-to-end: import fixture ch.9, approval-lock, verified atomic commit (version 0 → 1), state query at ch.11 returns the venom injury | ok (see PR #3 body) |
| `pnpm cli db:migrate` (0003) → `project:create` → `entity:create` ×4 → `manuscript:import` ch.9 → `manuscript:approve` → `canon:accept` (fixture delta remapped) → `summary:set 9` → `search:index` → `pack:build <project> 10 scene_writer contract.json spec.json --persist --identity=project/…@1` | Checkpoint 4 smoke: chapter 10 writer pack over the real canon — 10 sections, 4,057 est. tokens of 24,000 (T0 2,751 / T1 1,083 / T2 223), previous chapter 9 pinned (v1, canon v1, 422-word tail, tail hash), 32 included / 53 excluded (`diversity_cap`), all 11 validation checks true, `degradation.vector = not_configured`, manifest persisted (`stored: true`) | ok |
| `pnpm cli constraints:compile 12 examples/fixture/story-spec.v3.json` | Active Constraint Set for ch.12 from the fixture spec (12 hard incl. one merged duplicate, 4 soft, 2 assumptions, 3 excluded by scope/retirement); cap 100 → `CONSTRAINTS_OVERFLOW` | ok |

Tests not run: none skipped locally at closeout — all 55 files / 772 tests executed with `DATABASE_URL` set,
so the Postgres integration suites ran rather than skipping. Without `DATABASE_URL` the integration suites
skip visibly. `gitleaks` is **not installed in the local sandbox and was therefore not run locally**; it runs
in CI, where the "Secret scanning (gitleaks)" check on the merge commit `59d6275` succeeded.
`pnpm audit --audit-level=high` reported no known vulnerabilities.
Live-model tests: **none executed, ever**; nothing in this repository is evidence of live-model prose quality.
Vector retrieval has no implementation (interface + `embedding_sets` registry only, ADR-0045).

Checkpoint 4 test inventory (`packages/context`): unit — constraints (6: scope selection, stable ids, dedupe,
classification, determinism, scope-driven hash change, `CONSTRAINTS_OVERFLOW`, locked facts, non-English
text without paraphrase refused, scope predicate); assembler (21: identical inputs → identical bytes/section
hashes/pack hash + schema-valid manifest; item order irrelevant; canon version / Narrative Identity /
Production Policy changes alter the hash; provenance + source version on every item and line; T0 survives
trimming; `PACK_T0_OVERFLOW`; ladder then `PACK_T1_OVERFLOW`; deterministic T2 ranking, diversity cap, T1
dedupe; T16 rejected draft excluded with reason and phrase absent, mandatory draft → `PROHIBITED_SOURCE`;
untrusted text excluded and never in the system position; other-project items excluded; contract rendered as
PLANNED; k−1 summary/tail/hook/deltas with pins; k > 1 without accepted k−1 fails validation; stale canon
version / other timeline fail the pin check; writer pack passes the gateway Guard; templates ↔ registry roles
and identity variants; checker/extractor job-scoped text; deterministic query plan). Postgres integration
(12): quarantined draft not indexed/summarizable/retrievable and indexing idempotent; k receives k−1 L1 +
tail + hook + committed deltas + pins + elapsed time + evidence-bearing states + locked facts, manifest and
ACS persisted; determinism over the DB + idempotent persistence; knower-specific knowledge, secrets, T0
guards; directional + time-correct relationships (ch.10 vs ch.4); prior-loop isolation with labeled memory;
distant ch.3 event recovered lexically with provenance, nothing ≥ k, nothing non-accepted; lexical/vector
outage degrades with flags; dead DB → `STRUCTURED_RETRIEVAL_UNAVAILABLE`; k−1 working/missing →
`PREVIOUS_CHAPTER_NOT_ACCEPTED`; rollback removes search documents + summary and unbuilds k; checker accepts
`working` job text, extractor only `approved`, quarantined ids refused. Repair regression (`packages/db`):
version numbering across quarantined versions.

## Verification of the inherited stack (this session, 2026-09-14)

- Repository `jsisiwb/New` read via the public API and `git fetch`; default branch `hoplite/ainos-1ac771f8`
  (`2823bb9`). PRs #1–#4 open, none merged, bases chain #1 → #2 → #3 → #4 as recorded; heads `ae11f05`,
  `1ee4a80`, `21e054f`, `0a01e80` match the handoff; nothing was pushed after `0a01e80`. GitHub Actions
  (`ci`, `planning-validation`, gitleaks) succeeded on every head.
- `DATABASE_URL=… CI=true pnpm check` at `0a01e80` (Node 22.23.2, pnpm 10.26.0, Postgres 16.14): 18 files,
  116 tests passed, validator ALL OK — the recorded Checkpoint 3 state is confirmed.
- Defect found and repaired on this branch (not blocking merge of #1–#4, fixed forward): manuscript version
  numbering could reuse a quarantined version's `version_no` (see decisions log).
- Merge verdict: PRs #1–#4 are internally consistent and green; merging remains a user decision (none
  authorized). Merge order #1 → #2 → #3 → #4, retargeting each next PR to the default branch after the
  previous merge.

## Known failures / gaps

- Contrast sets: 100 sets in the repo (5 genres × 8 narrative functions, two or three sets per cell),
  above the ≥ 40 pre-calibration target of B-6-3. The judge calibration run itself is still outstanding:
  the expectations in `contrast-sets.seed.json` are authored starting expectations, not measured judge
  output, and thresholds stay `uncalibrated` until B-4-5 runs them against live judges with bilingual
  reviewers.
- Fixture manuscripts: only ch.9 (accepted) and its rejected draft exist as text; ch.12/ch.14 evidence is
  described, not addressable, until Checkpoint 5 produces them.
- Thresholds in profiles and policies are `uncalibrated`.
- **B-4-5 is PARTIAL.** Its automated portion **B-4-5a is implemented**: the contrast corpus is now
  **100 accepted sets**, expanded from 40 by authoring `cs-041`–`cs-100` in validated five-set batches
  under the deterministic distinctness and coverage gate (`packages/eval/src/distinctness.ts`), which was
  not weakened and whose 0.60 near-duplicate threshold was not moved. See "B-4-5a corpus expansion" below
  for the metrics. **This is not human calibration.** Blinded reviewer tooling exists and is tested, but
  **generated packets are not human review**: no reviewer has seen one, no judgment exists, the bilingual
  reviewer round specified in `docs/07-quality/01-testing-strategy.md` §6 has not run, and calibration
  stays `uncalibrated`. B-4-5 remains incomplete until that reviewer process is executed.
- **Phase 4 external blockers, all still open.** Live 20-chapter × five-night validation (B-4-1b) and the
  real-provider outage drill (B-4-2b) need paid providers. Staging restore, production restore, PITR,
  off-site backup and RTO/RPO (B-4-3c) need a deployment environment. Live credential rotation (B-4-3d)
  needs a secret manager and real credentials. Bilingual human review (B-4-5c) needs human reviewers. Real
  billing calibration (B-4-6c) needs live providers and provider invoices. None of these has been
  simulated, approximated or claimed.
- **Restore evidence is scoped to a local disposable database.** The drill proves a logical
  `pg_dump`/`pg_restore` round trip. It is not PITR, not a staging restore, not a production restore, not
  off-site backup verification, and it measures no RTO/RPO.
- **Cost evidence is synthetic/replay.** Monetary values come from fixtures served by the replay provider.
  No live call, no price table, no invoice — `real_billing_calibrated` is `false` in the durable report.
- **Security coverage is the automated application surface only.** There is no WAF, no network-layer
  control and no external penetration test, and metrics and rate limiting remain per process.
- gitleaks is **unavailable locally** in the development sandbox; it runs in CI only.
- Upstream **branch protection is unavailable/unconfigured**; the compensating controls are procedural.

## Unresolved risks (see `03-risk-analysis.md`)

R1/R2 (translation-like vs Western-pacing drift) remain the top product risks and are not testable until
Checkpoint 3 (gateway + judges) and Checkpoint 6 (contrast-set regression on live models).

## Checkpoint 4 limitations (recorded, not hidden)

- Vector retrieval: interface + `embedding_sets` registry only; no embedder, no pgvector (ADR-0045). Packs
  report `degradation.vector = not_configured`.
- Lexical search uses the `english` FTS configuration without the per-project name thesaurus
  (`05-retrieval-and-indexing.md` §3); entity tagging covers names/short forms/aliases. Thesaurus is B-1-13
  follow-up.
- L1 summaries are stored by `summary:set` (operator/tests); the `factual_summarizer` call that produces them
  belongs to the Checkpoint 5 acceptance workflow. The same workflow will call `canon.index_accepted_version`
  inside the acceptance transaction and write dependency edges from stored packs (ADR-0032).
- Token counts use `english_estimator_v1` (words × 1.3); the manifest records the estimator id so a tokenizer
  can replace it without changing the schema.
- The three Production Policies gained `context.input_budget_tokens` and new content hashes at `version: 1`
  (no project pins them yet).

## Next exact tasks (Checkpoint 5 — chapter-production vertical slice): done in this change

1. ~~`git checkout -b …--build-04-context-retrieval--build-05-chapter-vertical-slice` from the Checkpoint 4 head.~~
   Landed as `hoplite/kos-969b8d7e--checkpoint-05-completion` (repair of
   the WIP slice merged as PR #7 at `4ea8ecd`; fork staging PR `huuuiuh/New#1`, upstream integration PR
   targeting `jsisiwb/New:hoplite/ainos-1ac771f8`).
2. `packages/workflows` (Postgres-checkpointed idempotent steps, ADR-0044/ADR-0046): intake →
   `requirement_interpreter` → Story Spec → assumptions → bible commit → arc → `chapter_planner` with
   `pack.chapter_planner` → Chapter Contract (validated, locked) → `pack.scene_writer` → `scene_planner` →
   `scene_writer` per scene through `ReplayProvider` → assembly → deterministic checks → replayed evaluators
   → targeted revision → approval-lock → `canon_extractor` with `pack.extractor` → `verifyDelta` →
   `acceptChapter` (+ `factual_summarizer` L1, `indexAcceptedVersion`, dependency edges) → Chapter 2 pack
   proving it carries Chapter 1's summary/tail/hook/deltas → export. Done; 22/22 integration tests
   (incl. T19b global-identity collision proof).
3. Replay recordings for every fixture call (no live provider). Done (`examples/fixture/ch01/replay.ch01.json`,
   prompt-hash + `activity:<id>` binding, `misses == []`).
4. CLI operator surface over the production workflow. Done in this change: `chapter:produce <project> <ch>`
   (runs/resumes `produceChapter` with replay-only routing, deterministic workflow id, JSON summary, nonzero
   exit on failure), `chapter:status <workflow-id>`, `chapter:resume <workflow-id>` (same resume entrypoint,
   explicit), `export:accepted <project>` (accepted manuscripts only; `--full` prints text, default prints
   hashes/sizes); 5 CLI chapter-surface tests (success, idempotent repeat, failure, interrupt→resume, export).
   Remaining follow-ups (not in this change): per-project name thesaurus (B-1-13); Checkpoint 6
   quality/long-form scope.

## Checkpoint 7 — interface and hardening (complete, merged upstream at `59d6275`)

Merged into the upstream base/default development branch `hoplite/ainos-1ac771f8` via
[PR #10](https://github.com/jsisiwb/New/pull/10) at merge commit
`59d62752f31261a0c86921603993f37992194dd2` (parents `6195700a068b04108e26f87affd738842f39a15a`, the
Checkpoint 6 merge, and `2f51c4ecef685a28a4ab717934510d9a20a26483`, the Checkpoint 7 head). Post-merge
workflows on the merge commit are green: [ci](https://github.com/jsisiwb/New/actions/runs/35131086126) and
[planning-validation](https://github.com/jsisiwb/New/actions/runs/35131086114), all three check runs —
typecheck/lint/format/generated-types/tests with PostgreSQL 16, planning-package validation, and gitleaks
secret scanning — succeeded.

Every item below is exercised by tests against a real PostgreSQL 16, with no live paid-provider calls. The
limitations in the final row remain open and are recorded rather than closed:

| Item | State |
| --- | --- |
| Identity and membership | **done**: `users` with a salted scrypt verifier whose parameters are stored per row; `sessions` and `api_keys` stored as SHA-256 of a high-entropy secret with expiry and revocation as columns; `workspace_members` as the single source of a principal's role. Constant-time comparisons; a missing account still spends comparable work so it is not detectable by timing. 25 tests |
| App-role least privilege (audit repair) | **done**: a forensic audit of the recovered migration 0006 found its RLS design sound but its grants too wide on the tables that deliberately have no workspace column, where a policy cannot compensate. `users`/`sessions` were fully writable by `yeonjae_app` (every password verifier and session/CSRF hash readable; a verifier overwritable); `schema_migrations` was deletable, proven by probe — all rows removed, after which `migrate()` would replay every migration; `prompt_sets` had no immutability trigger, unlike `prompt_versions`, and was writable, so a pinned role→version mapping could be repointed silently; `api_keys` was insertable and `workspace_members` updatable, letting a request-scoped connection manufacture its own credential or owner role. Migration 0007 revokes what the request path never needs (authentication runs on the unscoped pool before a workspace is proven), adds the missing `prompt_sets` append-only trigger, and narrows `ALTER DEFAULT PRIVILEGES` so a future table cannot be silently writable without a policy. 9 regression tests, each failing against 0006 alone |
| Workspace isolation (RLS) | **done**: row-level security ENABLED **and** FORCED on every workspace-owned table, including the `*_evidence` join tables isolated through their parent. Because a superuser bypasses RLS unconditionally, migration 0006 adds the non-superuser role `yeonjae_app` and `withWorkspace()` switches to it with a transaction-local `app.workspace_id` — otherwise the policies would never bite for the application's own connection. Proved by reads that deliberately omit a `workspace_id` predicate, by naming a foreign row id explicitly, by an unset context returning nothing, and by a refused cross-workspace INSERT. `prompt_sets`/`prompt_versions` are deliberately excluded as the global immutable prompt registry (ADR-0016), not tenant data |
| Versioned `/v1` API — platform foundation and read surfaces | **done**: `apps/api` (Fastify) implements authentication (session cookie + bearer API key), membership-derived authorization with the viewer/editor/owner matrix, RLS-scoped request handling, RFC 9457 problem details over the workflow layer's existing stable code vocabulary, `Idempotency-Key` bound to (workspace, method, route, request hash), cursor pagination, conservative security headers, health/readiness, an append-only audit log, and read surfaces for projects, chapters/versions, canon commits, entities, timeline, jobs, workflow status and an accepted-only export preview. 35 contract tests. (This row covers the foundation only; the write resource families, canon/inspector surfaces, SSE, export, observability, rate limiting and CORS are the separate rows below, all delivered — the API as a whole is complete for Checkpoint 7 scope) |
| Job control and SSE | **done**: migration 0006's `jobs.control` columns and `job_events` have execution semantics. Control is an intent, not an interrupt — `checkpointControl` runs BEFORE a step, so a pause or cancel stops at a checkpoint boundary, no step is torn in half, resumption replays completed steps from `job_steps` without re-spending, and a cancel that lands before acceptance leaves its artifacts noncanonical (asserted: zero `canon_commits`). Terminal jobs accept nothing, a duplicate cancel emits no second event, and a cancelling job is never downgraded to paused. `GET /v1/jobs/{id}/events` streams the append-only log: `Last-Event-ID` replay is exact (the cursor only moves forward), `seq` is allocated inside the INSERT so concurrent emitters cannot collide, heartbeats are comment frames, a terminal event closes the stream, and event payloads are refused if they carry prose, prompt text or a credential. 46 tests (16 durable control, 12 stream, 5 verb dispatch, 13 HTTP) |
| Accepted-only TXT and DOCX export | **done**: `POST /v1/projects/{id}/exports`, status read and authorized download, with artifacts materialized in `exports.content` — a download names an export id, so no filesystem path exists in the request at any point. The accepted-only rule is NOT re-implemented: rendering goes through Checkpoint 5's `exportAccepted`, whose `acceptedChapter` gate requires an accepted chapter AND an accepted manuscript row with an `accepted_commit_id`. Proved against a chapter accepted by the real replay workflow, with a working draft, a quarantined draft and a losing candidate planted alongside: none appears in the TXT, in the DOCX text, or in the raw bytes of either. DOCX is written by `docx` (OOXML) and unzipped and parsed in the test. TXT is byte-identical across runs; the DOCX *content* hash matches TXT's, since ZIP metadata makes container bytes nondeterministic. 13 tests |
| Durable orchestration (Temporal, `apps/worker`) | **done** (ADR-0047): ADR-0003/ADR-0044 placed Temporal at Checkpoint 7 "once the core loop is proven". `apps/worker` runs a Temporal worker whose workflow is deliberately small — acquire lease → observe control → produce → settle → release — and contains no planning, selection, extraction or commit logic. Checkpoint 5's `produceChapter` is wrapped as ONE durable activity and keeps its Postgres checkpoint log, so durability composes rather than duplicating: Postgres gives step-level exactly-once (a restarted run replays `job_steps` and re-spends nothing), Temporal gives run-level durable timers, typed retries, signals, history replay, cancellation scopes and worker-restart recovery. ADR-0047 records why the literal per-step decomposition of ADR-0044 §2 was NOT applied: it would fork the canon invariants into a second, weaker implementation. Activity contracts are versioned and carry no prose (the intake and bible pass as content-addressed artifact ids); an unknown version is rejected, never reinterpreted. Failures are classified by meaning — provider/network retry, validation/policy/budget refusals are non-retryable. Two independent duplicate-start defences: the deterministic workflow id with an allow-duplicate-failed-only reuse policy, and migration 0008's target leases with a TTL (a dead worker cannot block a target) and a monotone fence (a revived zombie cannot act after its lease is stolen). Proved on Temporal's locally downloaded time-skipping test server with replayed model calls — no paid infrastructure, no credentials: acceptance advancing canon exactly once, duplicate start refused with one job and one commit chain, lease contention reported with the holder, zombie fencing, worker restart resuming with model-call count equal to a clean run, cancel-before-commit leaving zero canon commits and artifacts recorded noncanonical, pause honoured before any spend, a permanent failure not retried (max step attempt 1), contract-version refusal, and deterministic workflow-history replay. 11 tests |
| Correction, retcon and rollback | **done** for the canon-service layer: `impactOf` / `regenerationPreview` / `rollbackImpact` compute a read-only impact report (a dry run cannot have a side effect), and ADR-0032's split is honoured from the recorded edge materiality rather than inferred — material dependents become **stale**, contextual dependents become **review suggestions** only. Corrections and retcons commit through `canon.commit_delta` with `source = 'user_correction'` / `'retcon'`, so they inherit every acceptance check (change class, evidence, frame, validity, atomic optimistic version) instead of getting a second, weaker path; evidence-backed canon is not relaxed for operators (a corrected fact with no span is refused as `EVIDENCE_REQUIRED`). Justification is mandatory, a retcon additionally requires explicit human confirmation and carries its exposure in the refusal, and there is no Beta-only automatic patch engine — affected chapters go stale for a human. Nothing is deleted: a correction supersedes and links the prior row, whose evidence stays readable; rollback retracts by version (row counts unchanged) and MVP latest-only is enforced, including refusing to roll back a rollback. An approved report that has gone out of date is a typed `CANON_STALE` conflict, and two concurrent corrections leave exactly one winner with the loser typed. 15 tests |
| Corrective audit of orchestration and job control | **done**: a review of the Checkpoint 7 orchestration found four real defects, each now fixed with a test that failed before the fix. (1) **Lease renewal failure was ignored** — the heartbeat discarded both a `false` result and a thrown error, so a worker could keep drafting, evaluating and committing canon after its lease expired or was stolen at a higher fence. Ownership is now a separate read (`leaseOwnership`) that distinguishes *lost* (released / expired / fenced out, with the current holder named) from *unknown* (database unreachable), because the two demand opposite responses: fail closed on the first, retry on the second. `runStep` re-verifies ownership **before every step**, so a fenced-out run stops before its next durable side effect rather than at an arbitrary point inside one. (2) **Mid-run control was not observed** — `checkpointControl` was called only before and after the whole activity, so a pause or cancel issued during drafting, evaluation or extraction was not seen until the pipeline finished. It is now called inside `runStep`, the only place that knows a unit of work has not begun; replayed steps deliberately skip the check, since replay performs no work and no spend. (3) **A late cancel relabelled accepted canon** — a cancel losing the race with the atomic commit produced a self-contradictory state (job `cancelled`, chapter `accepted`, canon advanced). A late cancel is now reported as `too_late`, the job settles `completed`, and the ignored request is recorded in the job's history. (4) **A completed run emitted no terminal job event**, so an SSE client could not distinguish "finished" from "idle"; `finishJob` now closes every completed run exactly once. Additionally, `produceChapter` no longer relabels a control stop as `failed`. Proved with the control request submitted **while the pipeline is actively running** (the test polls the persisted step and acts mid-flight), not seeded before start: 10 tests |
| Atomic lease fencing (TOCTOU closure) | **done** (ADR-0048, migration 0009): the previous corrective made lease loss *observable* at every step boundary, but a pre-step ownership read and the durable mutation it protects are separate transactions, so a lease could expire or be stolen between the check and the write and the write still landed — a genuine time-of-check/time-of-use gap that no existing test attacked, because the suite revoked leases *between* steps. `canon.assert_lease_fence` now RAISES `LEASE_LOST` and is executed as the first statement of the transaction that performs the protected write, so check and use are one atomic unit; its `FOR SHARE` lock on the lease row serializes against the `FOR UPDATE` a rival's steal takes, so a steal cannot interleave with an open fenced transaction. `withFencedTransaction` is the only sanctioned path for a lease-protected write and covers canon acceptance/commit, the approval lock and chapter status, winner enforcement (the selection decision and loser transitions), L1 summaries and accepted-only indexing, dependency-edge writes, and the job step-begin/running bookkeeping. Separately, a `false` renewal is now treated as **definitive** lease loss immediately (it is the database reporting the holder/fence pair is no longer live, not an ambiguity) while a *thrown* renewal error is still left to the ownership read, since a transport fault is not evidence about ownership. A takeover is always reported `fenced_out` rather than `released`, because telling an operator a target is free while a rival produces it is the more dangerous error. Proved by a deterministic barrier suite that reproduces the race by ordering — pre-step read, then a committed steal from a second connection, then the attempted mutation — with no timing-dependent sleeps standing in for the interleaving: stale worker refused with a typed `LEASE_LOST`/`fenced_out`, nothing written (canon does not advance, no chapter row created), expired/released/missing/stale-fence claims each refused with their own reason, renewal-`false` and the fenced write reaching the same verdict, the rightful holder completing, retries staying idempotent, and the unleased CLI path still working. Mutation-checked: with the assertion body replaced by `RETURN`, 8 of the 10 tests fail — so they detect the gap rather than passing vacuously. 10 tests |
| Canon operator HTTP surface (correction, retcon, regeneration preview, rollback) | **done**: the API plan's "Canon & inspectors" actions now have an authorized HTTP surface over the already-tested `packages/canon` services — `POST /v1/projects/{id}/canon:correct`, `:retcon`, `:rollback` and `GET /v1/projects/{id}/chapters/{n}/regeneration-preview`. The layer is deliberately thin: validation, role policy, an audit record and a safe serialization, with every canon rule (mandatory justification, evidence resolution, change classes, atomic commit against an expected version, latest-only rollback, explicit retcon confirmation, material-vs-contextual consequences) left where it already holds. Registered as ONE Fastify route dispatching through `requireVerb`, because Fastify reads `canon:retcon` as a parameter named `projectId:retcon` and separate registrations make the first handler silently answer all three — a request to `:rollback` running the correction handler would be an authorization hazard, since rollback is owner-only. Role policy: dry run = `viewer` (it is a read of consequences), correction commit = `editor`, retcon and rollback = `owner`. A dry run writes nothing at all — no canon commit, no idempotency record and no audit row claiming a change happened (`planned ≠ happened`). `expected_canon_version` is REQUIRED when committing rather than defaulted to current, because defaulting it would reduce the optimistic check to comparing a value with itself and silently absorb a commit that landed between the operator's report and their decision. A takeover of the `released`/`fenced_out` kind is not involved here; what is surfaced instead is `CANON_STALE` with both versions. 20 tests: unauthenticated refusal on every route, viewer-may-dry-run-but-not-commit, editor refused for retcon and rollback, cross-workspace project hidden behind the SAME 404 code as a nonexistent one (a distinguishable response would confirm the tenant), non-member refused with `NOT_A_MEMBER`, dry runs leaving canon/commits/audit untouched, regeneration preview marking nothing stale, missing and stale `expected_canon_version`, blank justification, unconfirmed retcon reported with `reason: CONFIRMATION_REQUIRED`, five malformed bodies, no SQL/stack/path/prose in any error, `Idempotency-Key` making a retried correction commit exactly once (and replaying rather than re-running, which a naive retry would now fail on), the same key with a changed payload refused `409 IDEMPOTENCY_KEY_REUSED`, two racing corrections yielding exactly one new canon version, a committed correction's audit row attributed to the authenticated user with no corrected value in it, a confirmed retcon recorded with `source = 'retcon'` and the superseded row still readable, and a rollback that refuses to roll back a rollback |
| Canon inspector, cost and budget reads | **done**: `GET /v1/projects/{id}/canon/facts` (entity/attribute filters, cursor pagination), `…/canon/promises` (status filter), `…/canon/facts/{factId}/evidence`, `…/canon/dependencies` (materiality filter), `…/canon/stale`, `…/costs?group_by=role|model|chapter` and `…/budgets`. All `viewer`, all read-only, all through the RLS-scoped connection. Three properties are the point and are tested, not asserted. (1) **Evidence is accepted-only.** Evidence spans quote manuscript text, so this is the one canon inspector that can surface prose; the route joins through to `manuscript_versions.status = 'accepted'`. Attempting to plant a counter-example showed the database is stronger still: `evidence_span_guard` refuses a span on a `working` version outright ("evidence may reference only immutable versions"), and `canon_write_guard` refuses ANY write to `fact_evidence` from outside `canon.commit_delta` — both refusals are now asserted, so the route's join is defence in depth over a database that already rejects the dangerous shapes. (2) **The material/contextual split survives the wire** (ADR-0032): dependents are filterable by materiality and `/canon/stale` states explicitly that contextual dependents are review suggestions, because flattening them would push operators into needless regeneration. (3) **Cost data cannot leak prose** — it is derived from the append-only `llm_calls` audit, which stores hashes, sizes and cents and never bodies; the test asserts the accepted text's opening does not appear in a cost report. Budgets report the PINNED `production_policy_version` rather than a copied threshold, so the API never becomes a second drifting source for policy numbers (ADR-0041). Repairs found while writing the tests: the facts projection named three columns that do not exist (`importance`, `committed_at_version`) and the cost query assumed token columns that live inside the `usage` jsonb; `/canon/stale` read a `stale_since_version` field that does not exist, since staleness is recorded on `chapters.status` and a manuscript version is immutable and therefore has no staleness field at all. 12 tests, incl. unauthenticated refusal on all six routes, cross-workspace 404s, a cursor walk at `limit=1` reproducing the unpaged order exactly, and malformed filters answered 422 rather than as an empty page |
| Observability: structured logs, trace correlation, metrics and redaction | **done** (observability plan §5): one line-delimited JSON record per request carrying `request_id`, an adopted `trace_id`, route pattern, method, status and duration; a `/metrics` endpoint in Prometheus text format covering request counts and latency, auth failures, rate-limit refusals, canon commits, lease loss, job control, SSE connections/replays, exports, budget blocks and provider attempts. The design decision worth recording is that redaction is **default-deny**, not a blocklist: `logFields` accepts only an explicit allowlist of key shapes (ids, `*_hash` digests, counts, closed enums, durations) and DROPS anything else, because a blocklist exposes every new field until somebody remembers to add it — and for logs sitting next to manuscripts, provider keys and session secrets the first forgotten field is a leak, not a cosmetic bug. Two narrow carve-outs are load-bearing and reasoned: a `*_hash` digest is permitted (a digest of prose is not prose; `content_hash`/`prompt_hash` are the plan's required span attributes) **except** for credential digests, since a password hash is the verifier an attacker cracks offline and a session/key hash is the stored form the server compares against; and `*_tokens`/`*_count`/`*_cents`/`*_ms`/`*_bytes`/`*_size` measures are permitted (a count cannot reconstruct prose) while the bare `input`/`output`/`text`/`prose` keys stay refused. Getting the plural/singular distinction right required stripping the measure suffix before applying the credential fragments — naive substring matching rejects `input_tokens` because it contains `token`. Nested objects and arrays are never rendered (an array becomes its length), strings are length-bounded, and `msg` is a fixed developer string never interpolated with request data. An inbound W3C `traceparent` is adopted ONLY if it strictly parses, so a client cannot inject text into logs or the `llm_calls` audit through the header; an all-zero or malformed id yields no trace id rather than a fabricated one. Metric labels use the route PATTERN (`/v1/projects/:projectId`), never the resolved path, so tenant ids never become label values — a leak and a cardinality explosion at once. `/metrics` is deliberately unauthenticated and safe to be so: it renders names, allowlisted labels and numbers only. **Honest scope: these are per-process counters that reset on restart and are scraped per instance; aggregation is the scraper's job and nothing here is a distributed counter.** 25 tests (15 unit + 10 integration): every unallowlisted field dropped incl. one on no blocklist, credential names refused despite safe identifier shapes, the login password / issued CSRF token / session cookie / email all absent from that request's log line, a bogus `Authorization` header refused (which is also correct fail-closed precedence over the session cookie) and never logged, accepted manuscript prose returned to the client by an export download and absent from the log, no stack/SQL/path in an error line, an injected `traceparent` ignored, and the metrics endpoint free of project, workspace, email and token values |
| Deployment and incident runbooks | **done**: `docs/08-delivery/11-deployment-and-incident-runbooks.md` covers prerequisites and pinned versions, PostgreSQL 16 setup, the `yeonjae_app` non-superuser/`NOBYPASSRLS` role and why both attributes matter (a superuser silently bypasses every RLS policy while leaving it visibly "enabled"), the 0001–0009 migration inventory with clean-database verification, Temporal for development (the SDK's time-skipping test server — no server and no credentials needed for `pnpm test`) and what a deployment would require, the environment variables the code actually reads, the replay/mock/**not-implemented-live** provider modes, startup and shutdown ordering, the liveness/readiness/metrics probes and why `/health` deliberately does not touch the database, local reproducible development, a production outline marked *not exercised*, backup/restore with post-restore integrity queries, application rollback and forward-only migration recovery, and twelve incident runbooks (provider outage, Temporal outage and worker restart, lost/fenced lease with the four reasons and their distinct actions, stuck/paused/cancelled job incl. `too_late`, stale canon conflict, canon repair, budget exhaustion, SSE disconnect/replay, credential compromise, export incident, logs and metrics triage). Truthfulness is enforced rather than asserted: every command was run against this repository, every undemonstrated procedure is labelled *not exercised*, §9.8 states that rate limiting is **not implemented** instead of describing a procedure for an absent control, §11 lists what does not exist (`apps/web`, object storage, KMS, OAuth, live providers, secret rotation with no key path to rotate), and §12 records the per-process metric scope, the absence of live-provider validation, uncalibrated evaluators, that fencing does not abort in-flight spend, and that vector retrieval is an interface only. Factual claims were checked against the code and schema rather than written from memory |
| Rate limiting and spoof-resistant client identity | **done** (security plan §2): a sliding-window limiter with per-scope limits (auth 10/min, job 20/min, mutation 60/min, stream 30/min, read 300/min), enforced in an `onRequest` hook. Three decisions are the substance. (1) **The limit runs BEFORE authentication.** A limiter placed after the auth check still pays for a scrypt verification on every guess, so it cannot stop credential stuffing; the test proves two wrong passwords exhaust the allowance and the *correct* password is then refused too, because the limit is on attempts rather than failures. (2) **`X-Forwarded-For` is ignored unless a proxy is explicitly trusted**, and `trustedProxies` is empty by default. A limiter keyed on a client-controlled header is not a limiter — an attacker rotates it and every request looks new, so the control silently does nothing while appearing configured — and it additionally lets an attacker impersonate a victim's address to exhaust their budget. When a proxy IS trusted, the rightmost *untrusted* hop is taken, because a client can prepend entries but cannot append after what the trusted proxies added. (3) **Sliding, not fixed-bucket**: a fixed bucket permits 4 requests in 3 seconds across a boundary while nominally honouring "2 per minute", which for an auth limit is the entire point. Refusals are not counted, so a limited client is not locked out beyond the window by its own retries; idle windows are swept so rotating identities cannot grow the map without bound; health, readiness and metrics are exempt, because throttling a probe would make a load balancer eject a healthy instance under exactly the load the limiter exists to survive. Refusals are RFC 9457 documents with `Retry-After` and a `retry_after_seconds` hint, carry the standard security headers, and increment `yeonjae_rate_limited_total{scope}`. **Honest limitation, also recorded in the runbooks: the window store is in-memory and per-process.** It resets on restart and is not shared, so N instances permit roughly N× the configured rate; the interface is narrow enough that a shared store can replace the map without touching call sites. This is deliberately NOT described as distributed rate limiting. 22 tests (16 unit with an injected clock — no sleeps — plus 6 integration). The integration suites construct `RateLimiter.disabled()` because they legitimately authenticate dozens of times from one identity; the limiter's own behaviour is proved in its two dedicated suites, so nothing is left uncovered |
| Configurable CORS allowlist | **done** (security plan §2): exact-origin allowlist, default deny. The browser's same-origin policy is what stops a malicious page reading an authenticated response, so every rule here is about relaxing it narrowly and never by accident. (1) **Default deny** — with no configured origins no CORS header is emitted at all, leaving same-origin traffic untouched, so an unconfigured deployment is strict rather than broken. (2) **Never reflect an arbitrary `Origin`** — echoing the request's origin back plus `Allow-Credentials: true` is functionally equivalent to having no same-origin policy, and is the most common "just make it work" fix. (3) **No wildcard with credentials** — `*` is refused at startup rather than silently downgraded, because this API authenticates with cookies. (4) **Exact match on the parsed origin**, comparing scheme/host/port as components: `startsWith`/`endsWith`/`includes` matching is precisely how `https://studio.example.com.evil.net` and `https://evil-studio.example.com` get admitted. The `null` origin (sandboxed iframes) cannot even be configured. `Vary: Origin` is set even when denying, so a shared cache cannot serve an allowed-origin response to a denied one. A denied request is **not** failed server-side — it is answered without a grant and the browser refuses it, because a 403 would be indistinguishable from an authorization failure and would confirm the origin was evaluated; only a denied *preflight* gets an explicit 403, since a preflight has no other purpose. Preflight is answered **without authentication** (a browser sends no credentials on one, so requiring auth would make every cross-origin write impossible) with an explicit method/header list rather than a reflection of `Access-Control-Request-Headers`. Configured by `YEONJAE_CORS_ORIGINS` (comma-separated) with **startup validation** naming an invalid value, because a silently dropped typo yields a deployment that looks configured and denies everything. 26 tests (15 unit + 11 integration) covering allowed/denied/absent/malformed origins, lookalike, subdomain, wrong-scheme and wrong-port attacks, multiple origins, the empty allowlist, preflight methods/headers, credential behaviour, security headers intact on preflight, same-origin untouched, a CORS grant *not* substituting for authentication, and startup refusal of `*` and of a malformed entry |
| Dependency-audit CI gate | **done**: the step named "high+ fails" ended in `|| (echo … && exit 0)`, so every finding became a success and the gate never existed. `tools/audit-gate.mjs` replaces it: high and critical advisories fail the build, an advisory that must be tolerated needs an entry in `.audit-allowlist.json` carrying a justification, scope and expiry, and an expired or incomplete entry suppresses nothing. Verified by injecting a synthetic high advisory — the gate fails, a current allowlist entry lets it pass, and an expired entry does not |
| Remaining `/v1` write families | **done**: migration 0010 adds the operator-editable resource families the API plan names — story specification versions, assumption decisions, directions, concept candidates and selections, register profiles, narrative-identity / naming-registry / terminology-policy documents, planning documents (series blueprint, arcs, chapter contracts, scene plans) and chapter review decisions. The design decision that shapes the migration: `workflow_artifacts` is content-addressed and `putArtifact` refuses a retry that produces different bytes, which is exactly the determinism guarantee the production loop depends on and exactly why an operator EDIT cannot live there. Operator state therefore sits beside the artifacts, versioned, recording the artifact it descends from as provenance; nothing the workflow produced is mutated. The invariants are enforced by the DATABASE, not by route handlers, because a rule that lives in one handler is bypassable by the CLI, a worker, or the next route: optimistic concurrency is a `UNIQUE (project, …, version)` key so two writers racing the same version cannot both win (the test drives the real race and asserts one refusal); triggers refuse to rewrite or unpin a pinned identity version and to rewrite a locked plan version, through any caller including raw SQL; concept selection commits the selection row and every winner/loser transition in one transaction, mirroring `candidate_selections` (0005), so no reader can observe two selected concepts and nothing can promote a rejected one. Two boundaries are stated in the responses rather than implied: a chapter review decision answers `canon_accepted: false` (approval is the operator SIGNAL that feeds the Checkpoint 2–6 acceptance path, never a shortcut around evidence verification, winner-only propagation and the atomic commit), and an assumption decision answers `spec_updated: false` and names the follow-up (promotion is a new spec version with its own concurrency check — never a silent rewrite of the spec downstream planning already read). An operator-authored spec is validated with the SAME `story-spec.schema.json` validator the production loop uses on its own output. The chapter trace is redacted BY SHAPE: it selects artifact metadata and excludes `llm_output` in the query itself, so prompts, provider payloads and raw model text have no path into the response rather than being stripped from one. All new tables get the same FORCE RLS workspace policy and 0007's least-privilege grants, with no DELETE (these families are append-only history). 35 tests (9 database invariant + 26 API contract) covering unauthenticated access, the viewer/editor/owner matrix, a forged workspace header, cross-workspace id parity with a nonexistent one, stale `expected_version`, a genuine concurrent-edit race, duplicate `Idempotency-Key` replay and changed-payload refusal, pinned/locked refusal, concept winner-only propagation with retained losers, non-NFC normalization, deterministic cursor pagination and trace redaction |
| `apps/web` — the operator application | **done**: a Next.js 16 / React 19 app in the pnpm workspace with all 11 operator work areas — authentication; workspace and project selection; story specification and assumption review; directions and concept comparison; bible and register profiles; narrative identity and terminology; planning; chapters and production; candidate and scorecard review; canon and change operations; operations (jobs, SSE, costs, budgets, export). It calls the REAL `/v1` API: there is no mock, fixture or local store behind the client, because a UI backed by a static success path proves nothing about whether the product works. Security: the session secret is the server's HttpOnly cookie and is never readable by this code, so it cannot be written to browser storage; only the CSRF token lives in memory, is attached to unsafe methods automatically, and dies with a reload (re-read via `/v1/me`); a 401 revokes local authenticated state immediately while a 403 deliberately does NOT, since signing an operator out for lacking a role would be a bug; roles are presentation-only and every action is re-authorized server-side; an unrecognised error body is never rendered. SSE follows the persisted `job_events` log rather than the transport: reconnect sends the last APPLIED id (not the last received), duplicates are suppressed by sequence, a replayed non-terminal event can never relabel a terminal status (the bug that makes an operator cancel a finished run), a terminal event closes the stream, heartbeats reach neither the UI nor assistive technology, and disconnected/reconnecting is shown in words. Accessibility is centralized in shared primitives: status is always a WORD with colour as decoration, error summaries take focus and link to their fields, live regions are polite and carry only meaningful transitions, destructive canon operations confirm with a MATERIAL-versus-CONTEXTUAL impact summary from the server's own dry run, retcon and rollback additionally require typing the operation name, focus moves into a dialog and returns to its trigger, focus is never suppressed, and layouts are responsive with `prefers-reduced-motion` honoured. 63 tests: 19 unit (SSE replay semantics and API client contract) and 44 journey tests rendering the real screens against a transport that speaks the real `/v1` contract, including an axe pass on every work area and two keyboard-only critical paths. CI gains the web production build, a startup smoke test that asserts the shell and its landmarks actually render, and explicit guards that fail the build if the web journey or accessibility suites silently did not run |
| Remaining Checkpoint 7 scope | **none — Checkpoint 7 is complete and merged upstream** (PR #10 at `59d6275`, post-merge CI and planning validation green). The following limitations are **open, not closed**: rate limiting and metrics are **per process**; fencing prevents a stale result from committing but does **not** abort an already-running provider request; **no live-provider validation has occurred**; evaluator thresholds remain **uncalibrated** (deterministic replay agreement only, ADR-0029); vector retrieval remains an interface; **no production deployment has occurred**; gitleaks is **unavailable locally** (CI-only); upstream **branch protection is unavailable/unconfigured**. Closing these is Phase 4 — MVP hardening, which is ACTIVE. Phase 4's four implemented tranches close only the credential-free deterministic halves of B-4-1, B-4-2, B-4-3, B-4-4 and B-4-6; they do not close any limitation in this row except that restore is no longer "not exercised" **for a local disposable database only**, and that tenant-isolation coverage is now derived from the live schema. Every other limitation listed here remains open |

Honest scope note (ADR-0043): Checkpoint 7 is the largest checkpoint in the roadmap. Its platform and API
foundation, job control, SSE, accepted-only export, durable orchestration, atomic lease fencing, the canon
correction/retcon/rollback services and their HTTP surface, inspectors, observability, rate limiting, the CORS
allowlist, the runbooks, the `/v1` write families and `apps/web` with all 11 operator work areas are
delivered to the same evidence bar as earlier checkpoints — real PostgreSQL tests, real journeys against the
real API contract, no suppressions, no placeholder routes — and are merged upstream with green post-merge
checks. The table above is the authoritative statement of what does and does not exist, including the
limitations that remain open. What merging does **not** establish: nothing has been deployed to production,
no live provider call has ever been made, and evaluator thresholds are uncalibrated, so none of this is
evidence of live-model prose quality or of production operability.

Final Checkpoint 7 validation (recorded at closeout, re-run locally on the merge commit
`59d62752f31261a0c86921603993f37992194dd2`): **55 test files / 772 tests passing** — the 674 recovered tests
reproduced plus **98 tests added during the final continuation** — contrast **800 evaluations with 280/280
agreement, 0 false positives and 0 false negatives**, against **PostgreSQL 16**, with **no live paid-provider
calls** at any point.

### Checkpoint 7 provenance (historical)

The paragraphs below record how the Checkpoint 7 work was recovered and continued across writable forks. They
are **historical provenance**, not current work: the branches and staging PRs they name are no longer written
to, and the authoritative current state is the Current state table at the top of this file.

Continuation provenance (fourth session, 2026-09-16). Work moved again to the writable fork
`sigma26web/New`. The partial head `0880de679ab453de2080fc1058c9a70014a68449` was recovered **unchanged** —
same commit objects, same SHAs, no cherry-pick, rebase, squash or force-push — and verified before any new
work: `upstream/hoplite/ainos-1ac771f8` resolved at that time to `6195700a068b04108e26f87affd738842f39a15a`,
that base is
an ancestor of `0880de6`, the comparison is exactly **16 commits ahead and 0 behind** on a single linear
parent chain, and `a3072ae` → `4680520` → `0880de6` appear in that ancestry in order. Immutable markers in
`sigma26web/New`: `hoplite/medma-023f017e--checkpoint-07-base-6195700` @ `6195700` and
`hoplite/medma-023f017e--checkpoint-07-recovery-0880de6` @ `0880de6`, both verified by `git ls-remote` after
publication. Continuation branch `hoplite/medma-023f017e`, created at exactly `0880de6`; the platform's Git
broker publishes only to this thread's branch and branches derived from it, so the markers carry that prefix
rather than the bare names in the brief — their SHAs are exactly as specified. GitHub Actions were confirmed
ENABLED in the new fork (two active workflows, with a green `ci` and `planning-validation` run observed on
the branch) before any branch was treated as CI-verified. That branch's head
`2f51c4ecef685a28a4ab717934510d9a20a26483` became the second parent of the upstream Checkpoint 7 merge.

The recovered baseline was reproduced in full before being extended: **50 test files / 674 tests**, contrast
800 evaluations with 280/280 agreement and zero false positives or negatives, corpus hash
`sha256:ba75bf8e46386375c988eeea202dd3466c004d6edfeef5b5a7d91ca84ce63ef0` unchanged, planning validation
ALL OK (33 schemas), types-fresh / typecheck / lint / format:check / dependency-audit gate all green,
PostgreSQL 16.14, Node 22, pnpm 10.26.0. (One worker control-and-fencing assertion failed once under full-suite
ordering and passed in isolation and on re-run; it is timing-sensitive, not a regression, and CI has been green
on it.) After the remaining `/v1` write families and `apps/web`: **55 files / 772 tests** (674 inherited + 98
new), with every other gate re-run green. No live paid-provider calls occurred.

Tool limitation, recorded once (not an implementation blocker): the continuation brief asks for a comment on
`sigma25web/New#1` pointing at the replacement. The available source-control tools are bound to this thread's
repository (`sigma26web/New`) and the local `gh` CLI is unauthenticated, so a cross-repository comment could
not be posted. `sigma25web/New#1` remains **open and unmerged**, and this file plus the sigma26 staging PR
body carry the pointer instead: the continuation moved without history rewriting to `sigma26web/New` from
exact source commit `0880de679ab453de2080fc1058c9a70014a68449`.

Earlier continuation provenance (third session, 2026-09-16). Work moved to the writable fork
`sigma25web/New` after the previous fork's credits were exhausted. The partial head
`a3072ae40e6944462d598fe27409ef57f3d9fa43` was recovered **unchanged** — same commit objects, same SHAs, no
cherry-pick, rebase, squash or force-push — and verified before any new work: `upstream/hoplite/ainos-1ac771f8`
resolves to `6195700a068b04108e26f87affd738842f39a15a`, that base is an ancestor of `a3072ae`, and the
comparison is exactly nine commits ahead and zero behind on a single linear parent chain. Immutable markers
in `sigma25web/New`: `hoplite/kydonia-32097fa9--checkpoint-07-base-6195700` @ `6195700` and
`hoplite/kydonia-32097fa9--checkpoint-07-recovery-a3072ae` @ `a3072ae`. Continuation branch
`hoplite/kydonia-32097fa9`, created at exactly `a3072ae` (historical: superseded by the sigma26 continuation
above; sigma25web/New#1 remains open and unmerged). The platform's Git broker only publishes to this
thread's branch and branches derived from it, so the markers carry that prefix rather than the bare names in
the continuation brief; their SHAs are exactly as specified. The recovered baseline was reproduced in full
before being extended: **41 test files / 559 tests passing**, contrast 800 evaluations with 280/280
agreement and zero false positives or negatives, planning validation ALL OK, types-fresh / typecheck / lint
/ format:check / dependency-audit gate all green, `git diff --check` clean, PostgreSQL 16.14, Node 22,
pnpm 10.26.0, Python 3.12.3. After the atomic lease-fencing correction: **42 files / 569 tests** (559
inherited + 10 new). After the canon operator HTTP surface: **43 files / 589 tests** (569 inherited + 20
new). After the canon inspector, cost and budget reads: **44 files / 601 tests** (589 inherited + 12 new).
After observability and redaction: **46 files / 626 tests** (601 inherited + 25 new).
After rate limiting and client identity: **48 files / 648 tests** (626 inherited + 22 new).
After the CORS allowlist: **50 files / 674 tests** (648 inherited + 26 new), with every other gate re-run
green. No live paid-provider calls occurred.

Earlier continuation provenance (second session). The partial head `d5362d2` was recovered unchanged into the fork `sigma24web/New` and
preserved on the immutable branch `hoplite/klazomenai-1ae11ab0--checkpoint-07-recovery-d5362d2`, with the
Checkpoint 6 baseline on `hoplite/klazomenai-1ae11ab0--checkpoint-07-base-6195700` @ `6195700`. Work
continues on `hoplite/klazomenai-1ae11ab0`, which descends from `d5362d2` with none of its three commits
rewritten. The recovered baseline was reproduced before being extended: 32 files / 455 tests passing,
contrast 800 evaluations with 280/280 agreement and zero false positives or negatives, planning validation
green. Branch naming note: the platform's Git broker only publishes to this thread's branch and branches
derived from it, so the recovery and base markers carry that prefix rather than the bare names in the
continuation brief; their SHAs are exactly as specified.

## Phase 4 — MVP hardening (active; incomplete)

**Status: active and incomplete — deterministic portions MERGED UPSTREAM.** The credential-free deterministic work reached the upstream base branch through [PR #12](https://github.com/jsisiwb/New/pull/12) at merge commit `99e6bf5ccf962c2283589745ccbef7983cb682d6` (parents `d63e05de…` and `fecd79ede…`), with post-merge CI, planning validation and secret scanning all successful. Baseline evidence at that merge: **67 test files / 985 tests / 0 skipped** against PostgreSQL 16; 40 contrast sets, 800 evaluations, 280/280 agreement, 0 false positives, 0 false negatives, thresholds **`uncalibrated`**; no live-provider calls; no credentials. Every item that needs a paid provider, a deployment environment, repository administration or a human reviewer remains **not run**, so **Phase 4 is NOT complete** and neither is B-4-1, B-4-2 or B-4-5. The fork staging PR #1 of that tranche was **closed without being merged** — the work reached upstream through PR #12 — and its branch is retained as historical provenance only. The later 100-set corpus work reached upstream through [PR #13](https://github.com/jsisiwb/New/pull/13) at `4df7d92ff3d1641da0f0f270940aa31d33c7cc89`, and its fork staging PR [sigma29web/New#1](https://github.com/sigma29web/New/pull/1) is likewise **closed without being merged**.

| # | Scope item | Status | Closes which open limitation |
| --- | --- | --- | --- |
| 1a | 120-chapter compressed continuity validation, **deterministic** | **done** (evidence below) | long-form continuity was previously proven only to chapter 3 |
| 1b | Live 20-chapter validation, five consecutive nights | **not run** — needs paid providers | no live-provider validation has occurred |
| 2a | Deterministic chaos and provider-fallback drills (B-4-2) | **done** (evidence below) | fallback was previously untested and unclassified |
| 2b | Chaos/fallback under a REAL provider outage | **not run** — needs paid providers | requires live provider access |
| 3a | **Local disposable** logical backup/restore drill (B-4-3) | **done** (evidence below) | restore was previously "not exercised" |
| 3b | Secret-configuration boundary tests + rotation runbooks (B-4-3) | **done** (evidence below) | rotation had no tests and no procedure |
| 3c | Staging restore, production restore, PITR, off-site backup, RTO/RPO | **not run** — no staging/production exists | unchanged |
| 3d | Live credential rotation | **not run** — no secret manager or credentials | unchanged |
| 4 | Defensive security suite and CI security gates (B-4-4) | **done for the automated surfaces** (evidence below) | tenant/operator boundaries were covered only where suites happened to touch them |
| 5a | Contrast corpus expansion toward 100 sets (B-4-5) | **done for the automated scope** — corpus expanded 40 → **100 accepted sets**, 2,000 evaluations, 700/700 agreement, thresholds unmoved (evidence below); **not** human calibration | the corpus no longer falls short of its pre-calibration target |
| 5b | Blinded reviewer tooling (B-4-5) | **done** (evidence below) — tooling only, **not** human-review evidence | unchanged |
| 5c | Bilingual human review and threshold calibration | **not run** — needs human reviewers | thresholds remain `uncalibrated` |
| 6a | Deterministic cost/attempt accounting (B-4-6) | **done** (evidence below) | attempt-level spend was recorded but never read |
| 6b | Attempt-level cost API surface (B-4-6) | **done** (evidence below) | retry/fallback visibility had no API |
| 6c | Real billing calibration against provider invoices | **not run** — needs live providers and invoices | unchanged |

### B-4-5a corpus expansion — 100 accepted sets (automated scope complete; NOT calibration)

**Status: B-4-5a automated corpus expansion is implemented.** The corpus is **100 accepted sets**
(`cs-001`–`cs-100`); the target was 100. `cs-041`–`cs-100` were authored as continuation work in the
writable fork `sigma29web/New` on `hoplite/morgantina-64e49616`, in twelve validated five-set batches,
each committed and pushed only after passing the full gate.

**This is not human calibration and does not complete B-4-5.** No bilingual reviewer has seen a packet,
no human judgment exists, no threshold was changed, and evaluator calibration remains `uncalibrated`
(ADR-0029). The distinctness report continues to state `proves_literary_diversity: false` about itself: a
surface-similarity score is a necessary condition for corpus quality and never a sufficient one.

**Final metrics, measured at the accepted state.**

| Measure | Before | After |
| --- | --- | --- |
| Accepted sets | 40 | **100** |
| Evaluations (sets × 5 variants × 4 dimensions) | 800 | **2,000** |
| Expected-dimension assertions | 280 | **700** |
| Agreement | 280/280 | **700/700** |
| False positives / false negatives | 0 / 0 | **0 / 0** |
| Highest same-class similarity between two sets | 0.341 (`cs-020`/`cs-022`) | **0.419** (`cs-083`/`cs-088`) |
| Near-duplicate threshold | 0.60 | **0.60 (unchanged)** |
| Corpus hash | `sha256:ba75bf8e…3ef0` | `sha256:4c9ef2225e0e72ada566401183c453b19b7383c29cfac1a5617958aaeadbb97b` |
| Evaluator calibration | `uncalibrated` | `uncalibrated` |

**Coverage is balanced by construction, not by accident:** 20 sets per genre; 12 or 13 per narrative
function; all 40 genre × function cells occupied by two or three sets each; 40 distinct lint codes
expected across the corpus; the coverage audit reports no concentrated genre.

**What was authored.** Each set is five parallel renderings of one passage (`kwn_english`,
`western_english`, `translation_like`, `literary`, `weak_serial`) in original English prose composed
directly in the Korean serialized-webnovel tradition (ADR-0026), with authored `prose_rank`,
`structure_rank`, `min_gap_*` and expected lint codes. The frozen replay fixtures were regenerated from
the enlarged corpus at every batch (800 → 2,000 entries) and reviewed as a diff before acceptance, so
generation and validation stayed separate programs.

**Adversarial review beyond the automated gate.** All 60 new sets were audited for the failure modes a
similarity score cannot see, with **zero findings**: no variant's prose contains a class name, rank word
or other answer-leaking token; no two classes inside a set exceed 0.85 similarity; `kwn_english` is
tighter than both long registers in every set; `weak_serial` is an undivided block and `western_english`
a single paragraph in every set; no variant is shorter than 60 words; and every set's authored ranks obey
the corpus contract (kwn_english first on both dimensions, translation_like last on prose, weak_serial
last on structure). Two batches raised the corpus-wide maximum similarity — `cs-047`/`cs-060` to 0.414 and
`cs-083`/`cs-088` to 0.419 — and both pairs were inspected individually rather than accepted on their
number. Each is a deliberate cross-set continuity pair sharing a cast and a device vocabulary while
differing in narrative function, conflict progression and outcome, which is the same device the original
corpus already uses for Do-yoon across `cs-001`, `cs-009` and `cs-016`. No set was quarantined and none
was rejected after authoring.

**Defect found and repaired (D-8).** Two distinctness tests asserted a literal corpus size of 40, so the
first legitimate addition converted them from checks into stale evidence. They now derive the count from
the loaded corpus and pin the property that actually matters — that every same-class pair was compared —
and a regression test was added pinning that additions land in new genre × function cells rather than
piling into existing ones. Documentation counts are kept synchronized with the corpus file, and three
documents that hardcoded "40 sets exist today" now reference the corpus instead.

**Reviewer tooling was exercised at the new scale rather than assumed.** Packet generation over all 100
sets produces three packets covering every set exactly once, with independent item order and independent
A/B side assignment per reviewer, status `generated`, and zero variant-class or provenance tokens in the
blinded payload.

### Phase 4 tranche 5 — blinded reviewer tooling (B-4-5, automation portion only)

**The protocol is not invented here.** `docs/07-quality/01-testing-strategy.md` §6 specifies it exactly:
30 chapters, 3 bilingual reviewers, blind 1–5 on TWO scales ("natural English" and "reads as a Korean
webnovel of this genre") plus free comments, Spearman ≥ 0.8 between each judge and its scale, feeding
threshold calibration (ADR-0029). `packages/eval/src/review-packet.ts` implements that shape and refuses
to generate a short packet rather than silently weakening it.

**Blinding.** A packet carries no model id, provider, route, variant class or prompt version — asserted by
test. The A/B side assignment lives only in the manifest, hashed into the packet so the key provably
existed at generation without being shipped. Ordering and side assignment come from a seeded PRNG, so a
run is reproducible for the operator and unguessable from the packet alone, and each reviewer gets an
independent order so nobody can copy a neighbour's positional habit.

**Intake fails closed.** `importResponses` rejects an incomplete set, a duplicate response, a response
from another packet, merged reviewer identities, a missing reviewer identity, a rating outside 1–5 or
non-integer, and a packet whose content hash no longer matches — returning nothing accepted rather than
importing part of a set, because an agreement figure computed over partially-reviewed data would be worse
than none.

**What it CANNOT do, by construction.** It never invents a reviewer name or a judgment; a generated packet
is `status: 'generated'` and nothing in the module can advance that; `reviewReport` returns
`calibration: 'uncalibrated'` and `requires_human_approval: true` unconditionally; and
`recommendThresholds` returns a RECOMMENDATION with its blockers, never a threshold and never
`contrast_calibrated`. One test exists solely to pin that a packet with no responses yields zero reviewers
and NaN agreement.

**Evidence.** 28 tests. Also included: Spearman with average-rank tie handling (a reviewer who used only
part of the scale must not get an order-dependent correlation) returning NaN rather than a fabricated
number when a series has no variance.

**What this is NOT.** **Not human-review evidence.** No reviewer has been contacted, no packet has been
reviewed, no judgment exists. Thresholds remain `uncalibrated` and B-4-5 remains **partial** — the corpus
is now 100 sets, but that is an automated expansion under a deterministic gate — the bilingual review has not run.

### Phase 4 tranche 6 — deterministic cost and attempt accounting (B-4-6, deterministic portion)

**What exists.** `packages/db/src/cost-accounting.ts` reads `llm_calls` together with migration 0011's
`attempt_records`, which nothing previously did — so "how many ACTUAL provider attempts was this spend"
and "did a retry or a fallback happen" had no implementation. `/v1/projects/:id/cost-attempts` exposes it,
grouped by role, model, provider, model class, job, policy version or outcome.

**The arithmetic rule it enforces.** `llm_calls.cost_cents` is the authoritative total;
`attempt_records[].cost_cents` attributes that total and is never added to it. An attribution that does
not reconstruct the total is a reported violation.

**Money is exact integer MILLICENTS internally, cents at the boundary.** The gateway computes
`(tokens × pricePerMTokCents) / 1_000_000`, which is **fractional** — a replay-priced call costs `0.3`
cents — and `cost_cents` is an unconstrained `numeric` that stores it exactly. The release-gate review
found that the first implementation parsed only the integral part, so **every sub-cent call reported as
zero** (defect D-6, repaired). Values are now scaled to integer millicents before any arithmetic, summed
as integers so no float drift accumulates, and exposed in both forms: `*_millicents` is the exact integer
for comparison and summation, `*_cents` is the human-facing decimal derived from it. Every summary states
its currency and unit.

**Truthfulness.** Summaries state their BASIS. `billed` is deliberately not a representable value — a
provider invoice is not something this system observes — and the only basis reachable today is
`recorded_replay`. Usage a provider never reported stays **unknown** rather than becoming zero.

**Evidence.** `pnpm test:costs` → 13 scenarios, all passed, durable report at
`coverage/cost-report.json` declaring `basis: synthetic_replay`, `real_billing_calibrated: false`,
`live_provider_calls: 0`. Scenarios: first-attempt success; retry then success (two attempts, one model —
not a fallback); fallback then success; all routes fail; cancellation and pre-dispatch budget denial;
replay unable to double-charge (the audit's unique idempotency key refuses the second write);
partial vs absent usage; aggregation across all seven dimensions with attempts exceeding calls where
retried; time-window filtering; tenant isolation through an RLS-scoped connection; 1000 one-cent calls
totalling exactly 1000; **a sub-cent cost preserved rather than truncated, and 1000 calls of 0.3 cents
summing to exactly 300 000 millicents**; a deliberately broken attribution detected; no prose or
credentials in any dimension key. Plus 9 API tests (totals reconciled against a direct SQL sum on the
exact integer field, sub-cent cost reported exactly, malformed window refused with 422, cross-tenant read
indistinguishable from absent).

**What this is NOT.** Synthetic/replay evidence. No live provider call, no price table consulted, no
invoice reconciled. **Real billing calibration has not occurred.** Metrics and rate limiting remain
**per process** — that limitation is unchanged by this tranche.

### Phase 4 tranche 4 — defensive security suite and CI gates (B-4-4, automated portion)

**Defensive only.** Every case drives the application's own local test client with inert inputs and
asserts refusal. No scanner, no brute-force, no credential harvesting, no command-execution
demonstration, and no offensive tooling was created.

**The substantive gap it closed was an inventory problem, not a missing assertion.** RLS coverage is now
DERIVED FROM THE LIVE SCHEMA: every table carrying a `workspace_id` must have RLS enabled, forced and
policied; every other public table must be explicitly classified as isolated through a parent row,
self-scoped on its own id (`workspaces`), or intentionally global with a stated reason (the immutable
prompt registry, identity, schema metadata). **A new tenant-owned table shipping without a policy now
fails CI** — which no test naming tables by hand would catch. The inventory also pins that attempt
provenance is a jsonb column on `llm_calls`, not an `attempt_records` table, so it inherits that table's
policy.

**Also covered:** SELECT/INSERT/UPDATE/DELETE isolation, isolation through joins, isolation for a query
carrying no workspace predicate at all, nothing visible without a workspace context, no tenant residue on
a pooled connection; manuscript text staying data (a story paragraph cannot override the identity,
language or tradition contract, because the Guard hashes the rendered system prompt rather than trusting
it); export filenames that cannot traverse or inject a header; telemetry carrying no prose or prompts,
with bounded label cardinality and causal error chains reduced to classes and codes; and forwarded headers
unable to mint a rate-limit identity without an explicit trusted proxy.

**Evidence.** `pnpm test:security` → **178 tests, 16 declared scenarios** across the `rls`,
`input_output`, `telemetry` and `rate_limit` surfaces; durable report at `coverage/security-report.json`
declaring `defensive_only: true`, `live_provider_calls: 0`. CI runs it and verifies the report separately.

**Open limitations, unchanged:** rate limiting and metrics are **per process**; there is no WAF, no
network-layer control and no external penetration test; no production deployment exists to test against.

### Phase 4 tranche 3 — disposable backup/restore drill and secret boundaries (B-4-3, credential-free portion)

**Evidence classification — the distinction matters more than the result.**

| Procedure | Status |
| --- | --- |
| Local **disposable** logical restore drill | **executed**, automated, verified in CI |
| Staging restore | **not executed** — no staging environment exists |
| Production restore | **not executed** — no production environment exists |
| Point-in-time recovery (PITR) | **not executed** — no WAL archive configured |
| Off-site backup verification | **not executed** |
| RTO/RPO measurement | **not measured** |
| Live credential rotation | **not executed** — no secret manager, no credentials |

**What the drill does.** `pnpm drill:restore` creates its own disposable PostgreSQL 16 databases, applies
migrations 0001–0011, seeds two workspaces of representative data through the **real** lifecycle
(`createManuscriptVersion` → `approveManuscriptVersion` → `commitDelta`, plus a quarantined rejected
draft), captures a custom-format `pg_dump`, restores it with `pg_restore`, and verifies **22 invariants**:
migration count/version, tables/indexes/triggers, RLS policy count and `FORCE ROW LEVEL SECURITY` still
set, per-workspace row counts, canon version contiguity, manuscript content hashes, evidence code-point
offsets and quote hashes, accepted-only pointers, quarantine preserved and excluded, exactly one terminal
job event, job checkpoints, attempt-level provider provenance, per-workspace cost totals, derived-row
orphans, sequence non-collision, **cross-workspace RLS still enforced in the restored database**,
whole-database logical checksum equality, and the source database verified unchanged.

The fixture goes through the real lifecycle because the schema refuses the shortcut
(`ILLEGAL_TRANSITION`, `CANON_WRITE_OUTSIDE_COMMIT`). A drill whose fixture bypassed the invariants would
verify data the product can never produce.

**Safety.** `packages/db/src/restore-safety.ts` defaults every guard to refusal: the host must be local,
the database NAME must carry a word-delimited disposable marker, a protected word
(`prod`/`staging`/`live`/`customer`/…) refuses even alongside a marker, destruction needs an
acknowledgement independent of supplying the URL, and only databases the drill created are dropped.
**`NODE_ENV` is never consulted** — it says what a process believes about itself, not what database it is
pointed at. Passwords and complete connection URLs never reach a log, an error or the report. 33 guard
tests.

**Secret boundaries (rotation validation, not rotation).** 15 tests prove a missing or malformed secret
fails closed, no path defaults a secret into existence, CORS is default-deny and rejects a credentialed
wildcard, the worker refuses to start without an explicit provider mode, no secret reaches a log field or
a rendered log line, a database error carries a redacted target rather than a URL, and the provider
failure classifier returns a fixed enum member without echoing key material. The observability layer is
an ALLOWLIST, so the test that matters is the one proving an *unanticipated* field name is not logged
verbatim. Runbooks (§8.2, §8A of `11-deployment-and-incident-runbooks.md`) carry prerequisites, target
verification, abort conditions, post-restore verification, cleanup, evidence retention, redaction and
escalation, and state plainly that no live rotation occurred.

**Evidence.** 62 tests via `pnpm drill:restore` (33 guards + 29 drill assertions), durable report at
`coverage/restore-drill-report.json` whose `scope` block records `pitr_tested: false`,
`staging_restore_tested: false`, `production_restore_tested: false`, `offsite_backup_tested: false`,
`rto_rpo_measured: false`. The runner fails if the report ever starts claiming otherwise.


### Phase 4 tranche 2 — deterministic chaos and provider-fallback drills (B-4-2, deterministic portion)

**Two production defects were found and fixed** (this is why the tranche exists rather than only adding
tests):

1. **Fallback was unauthorized.** `Gateway.call` treated EVERY thrown provider error as a reason to move to
   the next route. A rejected request, an authentication failure, a content refusal and an unrecognized
   fault were all rerouted — re-sending the same bytes to a second paid model to reach the same refusal, and
   turning one deterministic failure into N. Fixed by `packages/gateway/src/failures.ts`: a provider adapter
   states its own verdict by throwing `ProviderFailure`, anything else is classified from its shape, and an
   UNRECOGNIZED failure defaults to **non-retryable** so an unknown fault cannot multiply spend. Only
   `retryable_transport`, `retryable_throttled` and `retryable_provider` authorize a reroute. Regression
   tests: `failures.test.ts` (9) and scenarios GW-05…GW-08, which assert the second provider's call count is
   **0**.
2. **Fallback had no attempt-level provenance.** `llm_calls` recorded one row per CALL, so a call that fell
   back named the winning model and `fallback_from_model_id` but recorded neither why route 1 was abandoned
   nor what each attempt cost. Migration **0011** adds `attempt_records` (validated by a trigger, because a
   CHECK constraint cannot contain a subquery) and the gateway now emits one entry per ACTUAL attempt. The
   row's summed `cost_cents` remains the authoritative total; attempt entries attribute it and must not be
   added to it. Regression tests: GW-09, GW-11, GW-17, GW-22.

**What exists.** `packages/gateway/src/fallback.chaos.test.ts` (22 gateway scenarios, `GW-nn`) and
`packages/workflows/src/chaos.integration.test.ts` (11 workflow/control-plane scenarios, `WF-nn`) run
against the REAL `Gateway`, the REAL `produceChapter` loop and real PostgreSQL 16, with faults injected only
at the provider boundary. `packages/gateway/src/chaos-report.ts` merges a machine-readable report
(`coverage/chaos-report.json`) carrying scenario ids, outcomes and short invariant labels — never prose,
prompts, provider payloads or credentials, which the report writer and the runner both assert.
`pnpm test:chaos` (`tools/run-chaos-drills.mjs`) is the explicit command: it refuses to start without
`DATABASE_URL`, deletes any stale report first, and fails unless every declared scenario reported `passed`
with no duplicate ids, no live provider call and no secret-shaped content. `ci.yml` runs it and additionally
greps `coverage/junit.xml` for both matrix names, so a skipped or filtered suite fails the build.

**Invariants proved (33 scenarios).** Fallback only for policy-retryable failures (GW-01…GW-04) and never
for a rejected request, auth failure, content refusal or unknown fault (GW-05…GW-08); every route
unavailable and an unconfigured fallback both fail closed (GW-09, GW-10); malformed output exhausts its
bounded repair budget on its own route before rerouting and fails closed when every route is invalid
(GW-11, GW-12); non-English output is regenerated once, rerouted once, then fails closed (GW-13); budget
denial precedes dispatch and a fallback cannot spend past the reservation (GW-14, GW-15); a missing identity
contract never reaches a provider (GW-16); each actual attempt has its own audit entry with its own verdict
(GW-17); a fallback call retains every pinned policy/prompt/identity/contract value and still runs the
output-language check (GW-18); a lost response followed by a retry reads the recorded call instead of
spending again (GW-19); usage is stored verbatim rather than guessed (GW-20); the surfaced error names its
`failure_class` without prose, prompts or secrets (GW-21); fallback order follows configured priority
deterministically (GW-22). On the workflow side: a crash after extraction leaves canon untouched and resumes
to exactly one commit (WF-01, WF-02); two concurrent runs of one chapter produce one acceptance and one
canon transition (WF-03); pause and cancel requested before dispatch stop the run at a step boundary with
no canon, no manuscript and no spend (WF-04, WF-05); a completed run emits exactly one terminal event and a
late cancel cannot rewrite it (WF-06, WF-07); a genuine replay miss fails closed without substituting a
draft (WF-08); a rerun re-reads recorded spend and refuses a second canon transition (WF-09, WF-10); and
control requested on an already-terminal job is refused rather than reopening it (WF-11).

**Measured (this session, local).** `pnpm test:chaos` — 33 scenarios, 64 tests, **20.5 s**, 0 live provider
calls. Repository test counts moved from **56 files / 790 tests** to **59 files / 824 tests**.

**What this tranche explicitly does NOT claim.**

- **No real provider outage was exercised.** Every fault is injected deterministically at the provider
  boundary. A mock/replay fallback drill is valid evidence about this system's decision logic and is **not**
  evidence that a vendor failed over successfully in production.
- Fencing still does **not** abort an already-running provider request. The lease fence prevents a stale
  result from committing; it does not cancel an in-flight HTTP call. Unchanged by this tranche.
- No provider credential, paid scheduled workflow or live call was added.
- B-4-2's live half and Phase 4 as a whole remain **incomplete**.

### Phase 4 tranche 1 — deterministic 120-chapter continuity replay (B-4-1, deterministic portion)

**What exists.** `packages/workflows/src/longform-replay.integration.test.ts` produces exactly 120
sequential chapters to acceptance in one project on real PostgreSQL 16 migrations, through the SAME
`produceChapter` the CLI and the Temporal worker run — real context packs, real deterministic checks, all
six replayed evaluators, the real approval lock, the real extraction, the real atomic acceptance commit, the
real L1 summary, the real accepted-only index and the real dependency edges. Only the model responses are
replaced. `packages/workflows/src/longform-fixture.ts` generates every chapter-scoped recording as a pure
function of the chapter number over the existing `examples/fixture/` story bible, so no manuscripts are
added to Git; `longform-harness.ts` wires the generated seed to the production `Gateway` (Guard, budget,
Postgres audit store, English output-language check) with the `ReplayProvider`.
`pnpm test:replay-120` (`tools/run-longform-replay.mjs`) is the explicit command; it refuses to start
without `DATABASE_URL` and fails unless the suite's own completion evidence records a full 120-chapter run
with zero replay misses and zero live provider calls. `ci.yml` runs it and additionally greps
`coverage/junit.xml` for the suite's completion marker, so a skipped or filtered suite fails the build.

**What it proves (18 tests).** Exactly 120 chapters, each accepted exactly once, with 120 accepted
manuscript versions and a final canon version of 122; every accepted manuscript passes the English
output-language check at confidence ≥ 0.99 and every scene passed the gateway's own check; canon advances
monotonically by exactly 1 per acceptance with no gaps or repeats and each acceptance commit's
`base_canon_version` is its predecessor's output; chapter k's pack carries chapter k−1's L1 summary,
verbatim tail, exact ending hook and committed canon deltas — asserted at the boundaries 1→2, 59→60 and
119→120, and asserted to be the immediate predecessor rather than an older chapter. Long-range continuity is
structural, not decorative: a porter-share fact asserted in chapter 1 is superseded at chapters 21, 41, 61,
81 and 101, each supersede citing the canon id the previous one created and each superseded row closed and
pointing at its replacement; three promises opened in chapter 1 are paid at chapters 3, 60 and **120** (119
chapters after setup); a relationship state changed at chapter 2 is superseded at chapter 119. Idempotency:
re-running chapters 1, 2, 59, 60, 119 and 120 replays every step from its checkpoint and changes no counter
(model-spend records, accepted versions, canon commits, summaries, search documents, dependency edges,
terminal job events), with zero duplicate `llm_calls` idempotency keys and no second terminal job event; a
chapter interrupted after extraction leaves canon untouched and, on resume, commits exactly once. Isolation:
a quarantined non-accepted candidate appears in no canon evidence, no accepted corpus, no summary, no search
document, no dependency edge and no export. Determinism: an independent run of the same seed against a clean
schema reproduces identical active-constraint-set, manuscript-content and L1-summary hashes and identical
context-pack content (normalized for the UUIDs the database allocates, which legitimately differ between
independent runs; byte-exact pack stability WITHIN a run is what replay depends on and is proved by the
rerun test requiring every step to replay from its checkpoint).

**Measured (this session, local).** 120 chapters accepted in **25.2–27.2 s** across runs (≈ 210–227 ms per
chapter), **0 replay misses**, **0 live provider calls**. Suite total 18 tests. Repository test counts moved
from **55 files / 772 tests** (baseline at `d63e05de`) to **56 files / 790 tests**.

**What this tranche explicitly does NOT claim.**

- The live 20-chapter nightly validation for five consecutive nights **has not run**. No live model was
  called, no provider credential was added, and no scheduled paid workflow exists. A deterministic replay is
  **not** a substitute for live evidence and is not offered as one.
- **B-4-1 is not complete** and **Phase 4 is not complete**.
- Evaluator thresholds remain **`uncalibrated`** (ADR-0029); this tranche changed no calibration status.
- **No production deployment has occurred.**
- Branch protection on the upstream base branch remains **unavailable/unconfigured**.
- Metrics and rate limiting remain **per process**; this tranche changed neither.
- Fencing still does **not** abort an already-running provider request.
- Vector retrieval remains an **interface** only (ADR-0045).

**Prerequisites for the live half (documented, not executed).** A funded provider credential held in the
secret manager and never in the repository; an explicit per-night budget ceiling enforced by the existing
`Gateway` budget; a nightly schedule that is opt-in and separate from normal CI (normal CI must stay
credential-free); recording of each night's run id, chapter count, spend and evaluator scores; and five
consecutive successful nights before any claim of B-4-1 completion. None of this is authorized or
implemented in this tranche.

| # | Scope item | Closes which open limitation |
| --- | --- | --- |
| 1 | 120-chapter compressed continuity validation | **deterministic half done in tranche 1** (above); long-form continuity is now exercised to chapter 120 deterministically |
| 2 | Live 20-chapter nightly validation for five consecutive nights | no live-provider validation has occurred; every model call to date is replayed |
| 3 | Provider fallback and chaos drills | **deterministic half done in tranche 2** (above): fallback is now classified and authorized, and 33 deterministic scenarios run in CI. Still open: fencing does not abort an already-running provider request, and fallback under a REAL provider failure is untested |
| 4 | Backup/restore and recovery drills | no production deployment has occurred and no restore has ever been exercised |
| 5 | Security test expansion | the RLS/least-privilege/rate-limit surfaces are tested but not adversarially exercised at MVP scale |
| 6 | Bilingual reviewer evaluation and threshold calibration | evaluator thresholds remain `uncalibrated` (ADR-0029); contrast agreement is deterministic replay agreement, not measured judge quality |
| 7 | Cost calibration and operational dashboards | metrics and rate limiting are per process; no aggregated or multi-process view and no calibrated cost model exist |

Vector retrieval also remains an interface only (no embedder, no pgvector; ADR-0045) and is not in the seven
items above; it is scheduled by ADR-0045 rather than by this phase.

## Checkpoint 6 — quality and long-form validation (merged upstream at `6195700`)

| Item | State |
| --- | --- |
| B-6-1 multi-chapter continuity | **done for chapters 1 → 2 → 3 (three consecutive accepted chapters)**: `examples/fixture/ch02` and `examples/fixture/ch03` (authored scenes + generated recordings) and 28 Postgres/Replay tests. One canon bump per accepted chapter (v3, v4, v5) with chapter 3's delta based on v4; chapter 3's pack carries chapter 2's summary, hook and verbatim tail and **not** chapter 1's; concrete carry-over asserted by content (the eighteen-percent share, the saved leg, the flagged gate) rather than row counts; the gate fact chapter 2 committed is superseded by chapter 3, not duplicated; StoryClock monotone across D+0/D+1/D+2; the promise chain opened(ch.1) → paid(ch.2) → advanced(ch.3); export returns 1, 2, 3 in order, accepted text only; a rerun adds nothing. Predecessor gate: chapter 3 requested while chapter 2 is absent, working or rejected fails with exactly `PREVIOUS_CHAPTER_NOT_ACCEPTED` at step `chapter_contract` with **zero** model calls and no manuscript, canon, summary, index or dependency edge. Resume: chapter 3 interrupted after `scene_plan`, `scene_draft`, `assemble`, `evaluate`, `approve` and `extract` resumes to exactly one accepted chapter 3, one canon advancement, one summary and no duplicate successful call by idempotency key. The compressed 120-chapter long-form run remains B-4-1 |
| B-6-2 failure-recovery tests (commit fault, stale canon, provider fault, resume) | **done**: 30 Postgres/Replay tests. Failure after each of 8 pre-commit steps leaves no chapter commit/accepted version/summary/index; resume replays every completed step and a third run adds no spend; a racing canon commit fails `CANON_STALE` with nothing half-committed; a provider fault fails closed without substituting a draft; a blocked gate reports `needs_attention` rather than `failed`. Added in this change: budget exhaustion refused **before** the provider and audited as `budget_blocked`, with the resumed run completing and no duplicate successful call by idempotency key; malformed, truncated and empty structured output each failing closed at the drafting boundary; a non-English draft failing the output-language boundary; in-transaction canon rejection (unsupported claim, planned frame) leaving only the bible commits with canon exactly at their version and no fact from a chapter acceptance; the **ambiguous post-commit** case — acceptance committed, process died before the checkpoint — where the retry reuses the same commit id and canon version with no second commit, acceptance, summary or index; and cross-project isolation. **This suite found and fixed a real defect** (see decisions log) |
| B-6-3 contrast corpus 4 → ≥ 40 original sets with expectations | **done in this change**: 40 sets in `examples/fixture/contrast-sets.seed.json` (5 genres × 8 narrative functions; 36 authored here), validator count/structure checks green; the judge calibration *run* is B-4-5 and has not happened |
| B-6-4 candidate comparison, selection and patch regression on replay | **done**: `chapter_comparator` prompt family (25th), `packages/workflows/src/comparison.ts` (position-swapped pairwise judging, shuffled-rubric retry, deterministic tie ladder — ADR-0015; per-dimension patch regression and smoke checks — ADR-0014) and `selection.ts` (N-candidate selection). 41 unit + 47 Postgres/Replay integration tests. **Enforcement is at the production boundary**: `requireSelectedWinner` runs inside `approveVersion` and, independently, inside `acceptDelta`, so a direct call to either with a loser fails closed; whether selection is required is decided from the pinned policy and durable candidate rows, never a caller flag. Eligibility reads the **persisted** scorecard artifact for the exact manuscript version and refuses fabricated, foreign, stale-canon, missing and malformed evidence. A committed decision answers exactly one request: the fingerprint pins workspace, project, chapter, contract, candidate slots and content hashes, canon base, identity, policy, prompt set, scorecard artifacts and evaluator provenance, and a changed request is refused rather than silently answered. Finalization is atomic — migration 0005 `candidate_selections` commits the decision and every loser transition in one transaction — and a lost concurrency race surfaces as a typed retriable `SELECTION_CONFLICT`, never a raw database error. Tie fallback requires the explicit policy field `candidates.tie_fallback_ladder_authorized`. Cyclic comparator preferences return `needs_attention` instead of a schedule artifact presented as a winner |

Known mismatch surfaced by B-6-4 (recorded, not fixed here): `standard.v1` gates four dimensions
(`prose`, `structure`, `genre`, `voice`) but the Checkpoint 5 evaluator scores only the first two, so no
candidate can satisfy the ADR-0015 early stop under that policy. `earlyStopDecision` therefore refuses to
stop and names the missing dimensions rather than treating an absent judge as a silent pass; a test asserts
exactly that. Wiring the genre and voice judges (or narrowing the policy) is a separate decision.

B-6-1 scope note (truthfulness, ADR-0043): what exists is a **three-chapter** chain, proved end to end on
replayed fixtures. Three chapters rather than two because a two-chapter chain cannot distinguish "reads the
previous chapter" from "reads chapter 1"; chapter 3 is written to be consumed — its premise is chapter 2's
ending hook, it carries chapter 2's committed state, and it supersedes the fact chapter 2 committed. The
compressed 120-chapter long-form run remains B-4-1. Nothing here is evidence about live-model prose over
many chapters.

N-candidate scope note (truthfulness, ADR-0043): `standard.v1` sets `chapter_candidates: 1`, so **default
production still generates one candidate** and `produceChapter` does not fan out into N candidates. That is
deliberate and unchanged in this checkpoint. What the checkpoint guarantees is that selection is
*enforceable* whenever it applies: when the pinned policy asks for more than one candidate, or when more
than one live candidate version exists on a chapter, approval and canon acceptance both require the
committed winner and fail closed otherwise. The selection ordering claim is equally narrow: the outcome is
deterministic for the pinned `stable_slot_single_elimination` schedule, which is persisted with the
decision as provenance — it is **not** a claim of a schedule-independent global winner, because a pairwise
comparator is not guaranteed transitive (ADR-0015). Observed cycles return `needs_attention`.

B-6-3 scope note (truthfulness, ADR-0043): the corpus is now large enough for the calibration round, but
nothing in this change measures judge behavior. Every `expected` block is an authored starting expectation
(rank orders, illustrative lint ids from the EP-*/ST-*/RG-*/TRN-* catalog, two gap thresholds); profile and
policy thresholds remain `uncalibrated`. Deterministic replay in CI is not evidence of live-model prose
quality, and synthetic contrast sets are not a substitute for the bilingual reviewer panel (B-4-5).

## Important decisions log

| 2026-09-15 | Known fixture-tooling drift (recorded, not fixed here): `tools/build-ch01-fixture.py` does not emit the `variant:*` recordings that were added to `examples/fixture/ch01/replay.ch01.json` later for fault-injection tests, so re-running that builder would drop them. The chapter-2 and chapter-3 builders reproduce their outputs exactly. Re-running the ch.1 builder is therefore currently safe only for `ids.ch01.json`; reconciling the variants into the builder is a separate change | `tools/build-ch01-fixture.py`, `examples/fixture/ch01/replay.ch01.json` |
| 2026-09-15 | Concurrency repair found by the strengthened B-6-4 assertion (CI caught it first, then reproduced locally on ~half of eight runs): a caller that lost a concurrent race received `INTERNAL` carrying a raw PostgreSQL duplicate-key message. Two paths, both fixed at the source — `llm_calls_idempotency_succeeded` now raises a typed `DuplicateCallError` mapped to the retriable `CONCURRENT_CALL`, and the content-addressed `workflow_artifacts` insert absorbs either conflict target and re-reads the committed row. Neither constraint was weakened; the conflicts are still refused, just reported as the typed retriable conditions they are | `packages/db/src/audit.ts`, `packages/db/src/workflow.ts`, `packages/workflows/src/errors.ts` |
| 2026-09-15 | N-candidate repairs (B-6-4): winner enforcement moved from an optional helper into `approveVersion` and `acceptDelta` themselves; eligibility switched to persisted scorecard artifacts; a complete request fingerprint added; finalization made atomic in `candidate_selections` (migration 0005) with a typed `SELECTION_CONFLICT` instead of a raw duplicate-key error; tie fallback given a real policy field (`candidates.tie_fallback_ladder_authorized`) in place of inferring authorization from an unrelated field's existence; and the schedule-independence claim withdrawn in favour of persisted-schedule determinism with cycle detection | `packages/workflows/src/selection.ts`, `packages/workflows/src/acceptance.ts`, `packages/db/src/selection.ts`, `packages/db/migrations/0005_candidate_selection.sql`, `schemas/production-policy.schema.json` |
| 2026-09-15 | Acceptance repair found by B-6-2: `acceptChapter` passed the project's *current* `canon_version` as the commit's parent, so the optimistic check compared a value with itself and a commit landing between extraction and acceptance was absorbed silently instead of raising `STALE_CANON`. The parent is now the delta's own `base_canon_version` (the version extraction was performed against), and a delta without an integer `base_canon_version` is rejected rather than committed unpinned | `packages/canon/src/accept.ts`, `packages/workflows/src/recovery.integration.test.ts` |

| Date | Decision | Where |
| --- | --- | --- |
| 2026-09-13 | Lifecycle: `origin` + `status`; approval-locked extraction; accepted on commit | ADR-0037 |
| 2026-09-13 | Five bitemporal change classes; extraction emits transitions only | ADR-0038 |
| 2026-09-13 | `source_story` = fact-bearing timeline kind reached through knowledge; reincarnation reuses prior-loop timelines | ADR-0039 |
| 2026-09-13 | StoryClock: narrative order authoritative; world order partial; calendars; `narrated_at` | ADR-0040 |
| 2026-09-13 | Production Policy = single versioned source of limits/gates; per-dimension gates only | ADR-0041 |
| 2026-09-13 | Issue-override matrix (never / canon_workflow / reviewer / advisory) | ADR-0042 |
| 2026-09-13 | Truthful baseline: starter labels, one progress doc | ADR-0043 |
| 2026-09-13 | Modular monolith first; CLI before API/UI; Temporal after the core loop | ADR-0044 |
| 2026-09-14 | Prompt families live in the repo (`packages/prompts/families/<family>/vX.Y.Z/`) as the review surface; the DB mirror (`prompt_versions`) is hash-verified and immutable; `tools/seed-prompt-families.py` authored v1.0.0 and is idempotent | `packages/prompts` |
| 2026-09-14 | Gateway audit rows never contain prompt or output text (hashes + sizes only; outputs live in the artifact store the workflow owns) | `packages/gateway/src/gateway.ts`, migration 0002 |
| 2026-09-14 | Canon boundary is the SQL function: all canon tables carry BEFORE triggers that refuse writes unless `canon.in_commit` is set by `canon.commit_delta`/`rollback_latest`, and refuse DELETE/TRUNCATE outright; `btree_gist` exclusion constraints make overlapping validity impossible; evidence trigger uses Postgres code-point `substring` on NFC text | `packages/db/migrations/0001_canon_core.sql` |
| 2026-09-14 | Toolchain: TypeScript 5.9 (typescript-eslint peer range), Vitest 4, ESLint 10 flat config, Prettier 3, `json-schema-to-typescript` for types with a freshness check in CI, Ajv 2020-12 at runtime; UUIDv7 implemented in-house (no dependency); deterministic script/lexicon output-language check (no statistical language-id dependency) | README.dev.md |
| 2026-09-14 | Context packs are pure functions of pinned inputs (pack id = UUIDv8 of the pack hash; ACS id = UUIDv8 of its content hash); lexical index is accepted-only by SQL trigger, synchronous with acceptance, removed on de-acceptance; vector retrieval is an interface until an embedder exists; structured failure blocks, optional failure degrades with flags; per-template input budgets live in the Production Policy | ADR-0045 |
| 2026-09-14 | Repair: `createManuscriptVersion` numbers versions across `manuscript_versions ∪ quarantine_versions` so a quarantined draft and its replacement never share a `version_no` (found while seeding the fixture; regression test in `canon.integration.test.ts`) | `packages/db/src/repo.ts` |
| 2026-09-15 | Chapter-production repair: previous-chapter gate runs before any model spend or canon write (T17); Replay `activity:<id>` binding with prompt-hash priority (no live calls); canon identity stays global, failure-paths tests isolate per-test via DB reset (T19/T19b); T11 extract-variant fixture carries schema-valid plan-frame + future-dated items | ADR-0046, `packages/workflows`, `examples/fixture/ch01/replay.ch01.json` |
| 2026-09-15 | CLI chapter surface over the production workflow (no parallel orchestration): `chapter:produce` runs/resumes `produceChapter` with replay-only routing and deterministic workflow ids, `chapter:status` reads the persisted job, `chapter:resume` re-runs the same workflow id explicitly, `export:accepted` exports accepted text only; nonzero exit on failure; T19b proves two live projects cannot share deterministic fixture UUIDs | `apps/cli`, `apps/cli/src/chapter.test.ts` |
