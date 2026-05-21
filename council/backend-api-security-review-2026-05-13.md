# Backend/API Security & Reliability Review (Principal Engineer)

Date: 2026-05-13  
Scope: Supabase-backed data model, RLS policies, auth/session usage in client routes, and migration posture.

## Executive Risk Snapshot

- **AuthN risk:** Medium
- **AuthZ/IDOR risk:** Medium-High (high impact if RLS regresses)
- **Abuse/Rate-limit risk:** Medium-High
- **Scalability risk:** Medium
- **Operability/Observability risk:** High (insufficient telemetry controls)

---

## 1) Authentication flaws

### Findings

1. App relies on client-side session reads (`supabase.auth.getSession`) in page components; there is limited server-side enforcement in app routes.
2. Magic-link login exists, but there is no explicit anti-automation envelope (IP/email rate limits) at app layer.
3. No explicit session freshness policy (max age/re-auth checks) for sensitive mutations.

### Recommendations

- Enforce sensitive mutations through server-side route handlers or RPC wrappers that validate auth context before write.
- Add rate limits for OTP requests and per-user write operations (token bucket by user+IP).
- Add session risk checks (recent auth for account-sensitive actions).

---

## 2) Authorization flaws / IDOR

### Findings

1. RLS is the primary authorization boundary (`collections`, `wear_logs`, etc.), which is correct but creates a **single-point-of-policy** risk.
2. Client updates/deletes by row id imply IDOR protection entirely depends on RLS predicates.
3. Migration history shows table evolution (`user_collection` vs `collections`) and policy rewrites; schema drift could introduce policy gaps.

### Recommendations

- Add CI policy tests that attempt cross-user access for every write/read path.
- Add database-level ownership assertions in SQL test fixtures.
- Maintain a policy matrix doc per table/verb and verify on each migration.

---

## 3) Injection vulnerabilities

### Findings

1. Supabase query builder reduces classic SQL injection risk.
2. Free-text fields (notes/search) still require output encoding and length constraints.
3. Trigger hardening exists (`search_path` lock-down + execute revoke for `handle_new_user`) which is a good defense-in-depth move.

### Recommendations

- Enforce max lengths and character policies for text columns used in UI rendering.
- Add stored procedure security checklist: fixed `search_path`, least-privilege grants, strict argument validation.

---

## 4) Rate limiting issues

### Findings

- No explicit app-level throttling identified for:
  - reaction upserts,
  - collection mutations,
  - OTP initiation.

### Recommendations

- Add per-endpoint and per-identity rate limiting:
  - `signInWithOtp`: strict IP + email window caps.
  - collection/reaction writes: user-level write QPS caps.
- Log and alert on 429 spikes and burst signatures.

---

## 5) Concurrency / transaction risks

### Findings

1. Multiple client-driven writes (insert/upsert/update) with optimistic UI can race.
2. Multi-step flows (write then refresh) are non-atomic.
3. Toggle-style reaction writes are susceptible to last-write-wins ambiguity under rapid interaction.

### Recommendations

- Move high-contention mutations to RPC functions with explicit transactional behavior.
- Add optimistic concurrency (version/timestamp checks) for frequently edited rows.
- Add idempotency keys for retried write operations.

---

## 6) Scaling bottlenecks

### Findings

1. Broad `select('*')` catalogue reads from client can increase payload and latency.
2. Pagination/search are mostly client-side for catalogue filtering.
3. FK index backfill migration exists, but workload growth still needs read-path tuning.

### Recommendations

- Replace `select('*')` with explicit column projections.
- Move search/filter to indexed server-side queries with pagination.
- Track slow query classes and add targeted indexes from production traces.

---

## 7) Retry, timeout, and fallback handling

### Findings

- Retry/timeout behavior is inconsistent at UI call sites; most failures only surface as generic messages.

### Recommendations

- Standardize request wrapper with:
  - timeout budget,
  - bounded retries on transient classes,
  - no retry for authz/validation failures,
  - consistent fallback result shape.

---

## 8) Logging/monitoring and distributed weaknesses

### Findings

1. No end-to-end correlation id strategy is visible in app-level flows.
2. Limited structured event taxonomy for mutation success/failure.
3. No explicit SLO/SLI definitions for API reliability and security signals.

### Recommendations

- Emit structured logs with `request_id`, `user_hash`, `table`, `operation`, `latency_ms`, `error_code`.
- Define SLOs: write success %, p95 latency, auth error rates, cross-tenant deny events.
- Add anomaly detection for abuse patterns and retry storms.

---

## 9) Message queue/eventual consistency risks

### Findings

- Current architecture appears request/response-centric with no explicit queue; when async jobs are later introduced, replay/idempotency gaps are likely if not designed early.

### Recommendations

- If introducing queues:
  - enforce idempotent consumers,
  - dead-letter queue policy,
  - deterministic retry backoff,
  - poison-message quarantine and replay tooling.

---

## 10) Schema evolution risks

### Findings

1. Migration history indicates iterative schema shifts and security/perf fixes.
2. Potential mismatch risk between code assumptions and DB shape/policies over time.

### Recommendations

- Enforce migration contract tests before deploy:
  - old client vs new schema compatibility,
  - policy regression checks,
  - rollback rehearsal in staging.
- Adopt expand/contract migration pattern with feature flags.

---

## API Abuse Scenarios (Red Team)

1. **OTP flooding:** attacker repeatedly requests magic links for target emails to degrade trust/usability.
2. **Write amplification:** authenticated user spams reaction/collection writes to trigger cost spikes.
3. **Cross-tenant probing:** attacker iterates UUIDs for update/delete attempts to validate RLS enforcement edges.
4. **Payload abuse:** oversized notes fields to induce latency and storage growth.
5. **Search scraping:** high-volume catalogue reads for data extraction.

---

## Load Testing Scenarios

1. **Read-heavy baseline:** 500 concurrent library reads with realistic payload projections.
2. **Write burst:** 100 concurrent users toggling reactions at 2 req/s for 5 minutes.
3. **Mixed traffic:** 80/20 read/write profile with p95 < target under jitter.
4. **Auth burst:** OTP and session-refresh spikes during peak traffic window.

Metrics: throughput, error rate, p95/p99 latency, DB CPU, lock wait time, row/sec by table.

---

## Chaos Engineering Tests

1. Inject 2–8s latency and 5xx bursts on Supabase calls.
2. Induce partial auth/session refresh failures.
3. Randomly fail 10–20% mutation requests and verify client rollback consistency.
4. Simulate index regression (staging) and observe degraded query alarms.
5. Kill/restart dependent services to verify graceful degradation and retry bounds.

---

## Contract Testing Ideas

1. JSON schema contracts for each API response shape consumed by UI.
2. RLS contract suite:
   - same user allowed,
   - different user denied,
   - anon denied where expected.
3. Nullability/value-range tests (ratings, enums, optional note fields).
4. Migration compatibility contracts (N-1 client vs N schema).

---

## Rollback Strategies

1. **DB expand/contract** with reversible migrations and guarded cutovers.
2. **Feature flags** for new write paths and policy changes.
3. **Canary rollout** for schema + policy updates with automatic halt thresholds.
4. **Runbook:** restore procedure, policy rollback scripts, and verification checklist.

---

## Observability Recommendations (Minimum Production Standard)

1. Centralized structured logging and trace correlation across app + Supabase events.
2. Security dashboards:
   - auth failures,
   - policy-denied operations,
   - potential IDOR probes,
   - rate-limit triggers.
3. Reliability dashboards:
   - operation success by endpoint/table,
   - p95/p99 latency,
   - retry counts and circuit-break opens.
4. Alerting policy with severity tiers and on-call playbooks.

---

## 30-Day Priority Plan

1. Build RLS/IDOR contract test suite and enforce in CI.
2. Add rate limiting for OTP + write endpoints.
3. Introduce request wrapper for timeout/retry/error normalization.
4. Replace broad selects with projected/paginated queries.
5. Add structured logging + dashboard + SLO alerts.
