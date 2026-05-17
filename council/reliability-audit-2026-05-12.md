# Reliability, Frontend QA, and Backend/API Security Review

Date: 2026-05-12  
System reviewed: AI Council operating docs + Next.js/Supabase app implementation.

---

## A) AI Agent Reliability Engineering Review

### Scores
- **Reliability score:** 7.1 / 10
- **Security score:** 6.2 / 10
- **Scalability score:** 6.4 / 10
- **Estimated monthly operational risk:** Medium (2–6 notable incidents/month at moderate usage)

### 1) Agent architecture
**Findings**
- Role boundaries are clear in council docs, which lowers random scope drift.
- Hand-offs are narrative, not stateful; there is no enforced max-hop or lock owner.

**Risks mapped to request list**
- Recursive loops / orchestration deadlocks from repeated hand-offs.
- Incorrect tool routing when role boundaries are ambiguous during failures.

**Improvements**
- Add execution state schema (`task_id`, `owner`, `step`, `retry_count`, `max_hops`, `terminal_reason`).
- Add deadlock breaker: if same pair hand off >2 times, escalate to human.

### 2) Memory strategy
**Findings**
- Reflection is encouraged, but memory lifecycle is unspecified.

**Risks**
- Memory corruption via contradictory rule accumulation.
- Context window failures from unbounded historical carry-over.

**Improvements**
- Three-tier memory (ephemeral/session, durable/project, immutable/policy).
- Conflict detector + checksum/validation before promoting to durable memory.

### 3) Prompt design
**Findings**
- Good educational language; weak adversarial hardening.

**Risks**
- Prompt injection, hallucinations, unsafe autonomous actions.

**Improvements**
- Prefix every run with untrusted-input rule and precedence ladder.
- Require evidence tags for high-impact claims (`source`, `confidence`, `checked_at`).

### 4) Tool permissions
**Findings**
- No explicit least-privilege table by role.

**Risks**
- Tool misuse, hidden unsafe actions, missing human approval gates.

**Improvements**
- Role-based allowlists (reviewer read-only, builder scoped write).
- Tier-2 actions (destructive/irreversible) require explicit human approval.

### 5) Security boundaries
**Findings**
- Trust boundaries are implied but not codified.

**Risks**
- Prompt/data exfiltration, policy override by injected content.

**Improvements**
- Define trust zones (policy, repo, external).
- Enforce sanitization and provenance labels before tool execution.

### 6) Cost efficiency
**Findings**
- No hard token budget or adaptive model-routing policy.

**Risks**
- Excess token consumption and context overrun.

**Improvements**
- Token budget per task + auto-summarization threshold.
- Two-pass strategy: cheap model for triage, higher model for final synthesis.

### 7) Failure recovery
**Findings**
- Retry behavior is not standardized.

**Risks**
- Infinite retry loops, poor fallback handling, bad error handling.

**Improvements**
- Retry matrix (retryable vs terminal errors), exponential backoff, circuit breaker.
- Required fallback tree: cached result -> degraded answer -> human escalation.

### 8) Observability/logging
**Findings**
- No structured telemetry contract in council docs.

**Risks**
- Hidden failure modes and weak incident diagnosis.

**Improvements**
- Structured events: `run_start`, `handoff`, `tool_call`, `tool_fail`, `guardrail_block`, `run_end`.
- SLOs: hallucination rate, tool failure rate, mean retries, guardrail trigger rate.

### 9) Human-in-the-loop controls
**Findings**
- Safety language exists but lacks a formal approval protocol.

**Risks**
- Missing approval checkpoints for risky operations.

**Improvements**
- Risk tier policy (Tier 0 autonomous read, Tier 1 reversible write, Tier 2 human approval required).

### 10) Scalability
**Findings**
- Role modularity is scalable in concept; runtime coordination is under-specified.

**Risks**
- Deadlocks, routing mistakes, throughput drops at higher parallelism.

**Improvements**
- Task queue with priority, leases/locks, idempotency keys, global retry budget.

### Adversarial and failure simulations
1. **Adversarial user prompt injection**: Paste hostile instruction in user content; expected block + provenance tag.
2. **Malformed data**: Corrupt JSON memory artifact; expected schema failure + safe fallback.
3. **Unavailable APIs**: Simulate timeout/5xx; expected bounded retries then degraded response.
4. **Token exhaustion**: Inflate context to threshold; expected summarization + retained policy context.
5. **Hallucinated tool output**: Force missing exit status; expected verification fail + abort synthesis.

### Estimated monthly operational risks
- 1–2 injection/policy-conflict events.
- 1–2 retry/fallback misbehavior events.
- 0–2 tool routing or deadlock events under complex multi-agent tasks.
- 0–1 high-severity incident requiring human rollback.

### Recommended architecture improvements (priority)
1. Policy precedence engine + untrusted-content guardrails.
2. Risk-tier human approval gates.
3. Structured telemetry + reliability dashboard.
4. Retry/circuit-breaker/fallback framework.
5. Memory tiering + validation/conflict resolution.
6. Role-based tool permissions.
7. Token budget + context compaction.
8. Queue/lock/idempotency orchestration controls.

---

## B) Staff Frontend QA Review (Next.js app)

### High-risk findings
1. **Potential hydration/consistency drift** from client-only session fetching and data-dependent UI text in `app/page.tsx` and `app/library/page.tsx` (no server-rendered fallback state parity).
2. **Navigation UX inconsistency**: `<a>` tags used instead of `next/link` in layout and home cards; can cause full page loads and weaker app-shell behavior.
3. **Dark mode gaps**: hardcoded light palette (`background: white`, gray text) with no theme adaptation.
4. **Accessibility gaps**: icon-only reaction buttons rely on title/emoji; missing explicit accessible names and pressed state semantics.
5. **Error/empty/loading state coverage** incomplete in library flows (no dedicated network error banners for fetch failures).

### Component-level test cases
- `app/layout.tsx`
  - Verify all nav links are keyboard focusable and visible focus ring appears.
  - Verify heading hierarchy and landmark usage (`header`, `nav`, main content separation).
- `app/page.tsx`
  - Session absent: subtitle renders generic copy.
  - Session present + count fetch success: username and count render.
  - Count fetch failure: fallback message remains stable and non-crashing.
- `app/login/page.tsx`
  - Email validation for invalid formats.
  - Status message transitions: idle -> sending -> success/error.
  - Sign-out path clears session UI without stale state.
- `app/library/page.tsx`
  - Filtering + search combinations with empty results.
  - Add/remove/update collection optimistic state and rollback on API errors.
  - Reaction toggle idempotency and restoration when upsert fails.

### E2E scenarios
1. Magic-link login flow end-to-end (mock callback/session cookie).
2. Add fragrance to owned/wishlist, then verify persistence after reload.
3. Toggle reaction rapidly; verify final state correctness and no duplicate records.
4. Offline/network-failure simulation during collection load with visible recoverable error state.
5. Mobile viewport navigation and tap-target verification.

### Cypress / Playwright ideas
- Intercept Supabase calls (`collections`, `fragrances`) for deterministic fixtures.
- Add visual regression snapshots for home/library/login at 320px, 768px, 1280px.
- Accessibility assertions via axe integration for each route.
- Performance budget assertion: TTI and hydration warnings should remain under threshold.

### Accessibility audit checklist (WCAG-focused)
- Buttons have programmatic names (not emoji-only).
- `aria-pressed` on toggle-like reaction controls.
- Color contrast >= 4.5:1 for body text and controls.
- Focus indicators visible for all interactive elements.
- Form input has associated label (not placeholder-only).
- Loading and error states announced appropriately (live region for status).

### Mobile-first concerns
- Small-screen tap targets for reaction buttons and nav links.
- Overflow handling for long fragrance names and note chips.
- Input keyboard behavior in login and search fields.

### Browser compatibility concerns
- Verify Safari/iOS for font and focus rendering.
- Verify reduced-motion behavior where transitions/animations exist.
- Validate PWA manifest and service worker interactions in Chromium vs Safari.

### SEO findings
- Core metadata exists in layout, but route-level metadata appears minimal.
- Need per-page `title/description`, social tags, and canonical handling.

---

## C) Principal Backend Engineer & API Security Review (Supabase-backed)

### High-risk findings
1. **Client-side broad data fetches** (`select('*')` on fragrances) can become scale and cost bottlenecks.
2. **Authorization assumptions depend on RLS correctness**; app logic often trusts client session state.
3. **Upsert/insert race and retry behavior** not normalized in UI and API paths.
4. **Limited explicit timeout/cancellation handling** for long-running requests.
5. **Observability gaps**: no clear request correlation IDs in app-level logs.

### Security review checklist mapping
- **Authentication flaws:** magic-link flow present; verify redirect and token handling hardening.
- **Authorization flaws / IDOR:** ensure every `collections` access is constrained by `user_id` in RLS policy and tested against cross-user IDs.
- **Injection risks:** Supabase query builder helps, but validate user-provided text fields and search terms for abuse patterns.
- **Rate limiting:** no explicit per-user throttles visible for write-heavy actions (reactions, updates).
- **Concurrency:** rapid toggles/updates can produce last-write ambiguity without versioning.
- **Transaction risks:** multi-step operations (insert then reload) are non-atomic.
- **Schema evolution:** migration sequence exists; backward compatibility and rollout checks should be formalized.

### API abuse scenarios
1. Credentialed user spams reaction upserts at high QPS.
2. User attempts direct record ID updates across tenants (IDOR probes).
3. Oversized `personal_notes` payload to test storage/latency boundaries.
4. Enumeration attempts via search endpoints and broad `select('*')` scans.

### Load testing scenarios
- Steady-state: 100–500 concurrent reads on library load.
- Burst writes: 50 users toggling reactions every second for 2 minutes.
- Mixed profile: 80% reads / 20% writes with network jitter.

### Chaos engineering tests
- Inject 2–5s latency on `collections` reads.
- Return intermittent 500/429 from Supabase endpoints.
- Drop auth refresh responses to validate session resilience.
- Randomly fail 10% of upserts and verify client rollback consistency.

### Contract testing ideas
- Define response contracts for collection/fragrance payloads and enforce with schema tests.
- Validate migration compatibility against previous client versions.
- Assert nullability invariants for optional fields (`inspired_by`, notes, reaction).

### Rollback strategies
- Blue/green migration rollout for schema changes.
- Feature-flag new write paths (reaction logic variants).
- Maintain reversible migrations and documented rollback runbooks.

### Observability recommendations
- Add structured API event logs with correlation ID and user ID hash.
- Track p95/p99 latency per query class.
- Alert on 401/403 spikes, 429 rates, retry storms, and failed upsert rollback events.
- Add audit log for high-impact state changes in collection records.
