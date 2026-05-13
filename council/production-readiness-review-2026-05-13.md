# Production Readiness Review (Launch Tomorrow @ 100,000 Users)

Date: 2026-05-13  
Primary repo: `fragrance-community`  
Assumption: launch target = 100k users with meaningful concurrent read/write traffic.

> Note: I could not locate a local `Finance Planner` repository in this workspace. A dedicated repo-specific audit for that system is blocked until code/infrastructure access is provided.

---

## A) Fragrance Community — Full Production Readiness Audit

### Architecture
- Current architecture is frontend-heavy with direct client->Supabase access patterns.
- At 100k users, this increases exposure to:
  - inconsistent client behavior,
  - harder abuse controls,
  - limited centralized policy enforcement.
- Recommendation: move critical mutation paths behind server routes/RPC contracts with consistent retries, rate limits, and telemetry.

### Security
- RLS exists and is the core tenant boundary.
- Main risks:
  - over-reliance on RLS without automated regression tests,
  - missing rate-limiting controls for OTP and write-heavy actions,
  - limited visible security event monitoring.

### Deployment
- No evidence of hardened progressive rollout strategy (canary, feature flags, staged traffic ramp).
- `next/font` dependence on external font fetch can break builds in constrained environments.

### Monitoring / Observability
- No demonstrated end-to-end trace IDs, structured logs, SLO dashboards, or on-call runbooks.
- Current incident diagnosis would be slow and manual.

### CI/CD
- Baseline lint/build is unstable in current environment history.
- No clear gated pipeline covering unit/e2e/a11y/perf/security/policy checks.

### Rollback capability
- SQL migrations exist, but rollback readiness is unclear.
- Need explicit rollback scripts, tested restore flow, and change freeze criteria.

### Testing coverage
- Useful QA guidance exists in docs, but execution automation and pass criteria are incomplete for launch-critical confidence.

### Cost optimization
- Broad client selects and read-heavy patterns can increase Supabase and egress cost at scale.
- Need projection, pagination, caching, and hot path optimization.

### Incident recovery
- Missing explicit incident commander workflow, severity policy, and communication templates.

### Backups
- No clear documented RPO/RTO, backup verification cadence, or restoration drills.

### Secrets management
- Need explicit secret rotation policy, environment segregation, and access audit.

### Infrastructure risks
- Third-party dependency concentration (Supabase + hosted build/runtime) without rehearsed failover/degraded mode.

### Compliance concerns
- PII handling (email auth) requires retention/deletion policy clarity, access controls, and audit logs.

### Documentation quality
- Strong strategic docs exist; operational docs are improving but still missing executable runbooks.

---

## 1) Launch Blockers (Must fix before tomorrow)

1. **No proven production CI gate** that must pass lint/build/tests/security checks.
2. **No formal OTP + mutation rate limiting** visible for abuse prevention.
3. **No RLS regression test suite** proving cross-tenant denial guarantees.
4. **No incident runbook + on-call alerting baseline** for first 24–72h after launch.
5. **No verified backup/restore drill evidence** with stated RPO/RTO.
6. **No staged rollout/rollback protocol** (canary + feature flags + kill switches).

---

## 2) High-risk concerns

- Auth automation abuse (magic-link flooding).
- Write amplification/cost spikes via repeated reaction/collection writes.
- Performance degradation from broad data fetches and client-side heavy filtering.
- Visibility gap: delayed detection of failures, auth anomalies, or policy regressions.
- Schema-policy drift risk across future migrations.

---

## 3) Medium-risk concerns

- Inconsistent UX under transient network failures.
- Accessibility regressions without automated a11y gates.
- Hydration/state sync inconsistencies across client-only paths.
- SEO limitations from minimal route-level metadata strategy.

---

## 4) Quick wins (24–72 hours)

1. Add OTP + write endpoint throttling with explicit 429 behavior.
2. Add projected selects + pagination on highest-volume reads.
3. Add structured logs (`request_id`, operation, latency, error code).
4. Add mandatory CI checks: lint, build, smoke E2E, policy tests.
5. Add launch-day dashboard + pager alerts for auth errors, 5xx, latency.
6. Add rollback checklist and one dry-run restore rehearsal.

---

## 5) 30-day stabilization roadmap

### Week 1
- Lock launch baseline: CI gates, alerting, on-call rotation, incident templates.
- Implement rate limits + abuse telemetry.

### Week 2
- Build RLS/IDOR contract test suite and enforce on all migrations.
- Introduce server-side wrappers/RPC for critical writes.

### Week 3
- Performance pass: query projection, pagination, caching, index tuning from traces.
- Add front-end perf and hydration regression checks.

### Week 4
- Disaster recovery rehearsal: restore drill, rollback drill, postmortem simulation.
- Compliance hardening: retention/deletion and access auditing docs.

---

## 6) Suggested monitoring dashboards

1. **Auth & Access Dashboard**
   - OTP requests/min
   - login success/failure ratio
   - 401/403 rates
   - policy-denied operations
2. **API Reliability Dashboard**
   - request volume by endpoint/table
   - p50/p95/p99 latency
   - error rate by class (4xx/5xx)
   - retry volume and circuit-break events
3. **Database Health Dashboard**
   - active connections
   - CPU/IO
   - slow query counts
   - lock wait times
4. **Product UX Health Dashboard**
   - page load times
   - hydration warnings
   - frontend error rate
   - key flow completion (login -> add -> react)
5. **Cost Dashboard**
   - egress by route
   - DB read/write units
   - auth/email send volume

---

## 7) Suggested alerts

- P1: 5xx error rate > 2% for 5 min.
- P1: OTP request spike > baseline x3 for 10 min.
- P1: DB p95 latency > 1.5s for 10 min.
- P1: RLS-denied anomaly spike (possible probing).
- P2: frontend JS error rate > threshold.
- P2: build/deploy failure on main branch.
- P2: backup job failure or stale backup age > policy.

---

## 8) Missing operational procedures

1. Launch war-room checklist with owner assignments.
2. Incident severity matrix and escalation tree.
3. Public status communication template.
4. Security incident playbook (credential leak/abuse response).
5. Backup restore runbook with verification steps.
6. Rollback playbook for app + DB migrations.
7. On-call handoff process and daily health review template.
8. Postmortem template with action tracking SLA.

---

## B) Finance Planner Repo — Production Readiness (Blocked pending repo access)

I cannot perform a true repo-specific audit yet because no `Finance Planner` codebase is present in this workspace.

### Immediate next step required
- Provide local path or repository checkout for Finance Planner.

### Until then, use this provisional checklist
Apply the exact same framework above, with extra focus on financial-domain controls:
- strong auth + MFA optionality,
- stricter audit logging and immutable event trails,
- PII encryption and retention controls,
- regulatory/privacy mapping,
- reconciliation integrity checks,
- anti-fraud abuse monitoring,
- deterministic backup/restore + reporting verification.

### Deliverables ready once repo is available
When you provide the repo path, I will generate the same 8 outputs:
1. Launch blockers
2. High-risk concerns
3. Medium-risk concerns
4. Quick wins
5. 30-day stabilization roadmap
6. Suggested dashboards
7. Suggested alerts
8. Missing operational procedures
