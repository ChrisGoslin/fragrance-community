# Frontend QA Gate (Run Every Time)

Date: 2026-05-13  
Applies to: all UI-impacting changes in this repository.

## How to use this gate
1. Run the commands in `scripts/run-frontend-qa-checklist.sh`.
2. Execute component/E2E/accessibility checks below.
3. Document pass/fail per section in PR description.
4. Do not mark UI work done until P0/P1 issues are resolved or explicitly waived.

---

## Production QA Review (Current State)

### 1) Broken UX flows
- **Risk:** library and login flows depend heavily on async auth/session calls; intermittent network failures can strand users between states.
- **Risk:** reaction toggles are optimistic; repeated fast taps can confuse final state without clear pending indicator on all surfaces.
- **Risk:** search/add flow has minimal failure feedback for catalogue fetch errors.

### 2) Visual inconsistencies
- Inline style system is mixed with utility classes in different areas of app, creating inconsistent spacing/typography behavior.
- Button styles and card patterns are duplicated rather than centralized into design tokens/components.

### 3) Hydration issues
- Home and library pages are client-first and session-dependent; server/client state mismatch risk exists for first render copy and counts.
- No explicit hydration warning capture/testing in CI.

### 4) Rendering inefficiencies
- Large list render in library/search can re-render frequently during typing/filtering.
- Derived search results are recomputed on every query change without memoization thresholds.

### 5) Accessibility failures (WCAG)
- Some controls still rely on visual context and need robust screen reader validation.
- Form error/help semantics remain basic; live region strategy is partial.

### 6) Responsiveness
- Narrow viewports need stronger verification for long text wrapping and action button compression.
- Dense cards can become vertically heavy on mobile with multiple metadata rows.

### 7) Keyboard navigation
- Need explicit tab order audit through tabs, filter chips, and per-card controls.
- Need escape/enter behavior checks for fast keyboard-only usage.

### 8) State synchronization
- Auth session changes trigger local state updates; race windows can occur around concurrent data fetches.
- Collection list and reaction map can temporarily diverge after partial errors.

### 9) Dark mode failures
- No robust dark theme tokenization; many hardcoded light colors can fail contrast in dark environments.

### 10) Animation/performance
- No reduced-motion specific coverage for transitions.
- No route-level performance budget checks in CI currently.

### 11) Form validation problems
- Login input has native type validation but no custom message normalization.
- No anti-spam UX guard for repeated submit attempts beyond basic button disable.

### 12) Empty/loading/error states
- Several empty/loading states are present, but some API errors still collapse into generic messages.
- Missing consistent retry CTA pattern for all async widgets.

### 13) Memory leaks / cleanup
- Auth subscriptions generally unsubscribe, which is good; confirm all future listeners/timeouts follow cleanup pattern.

### 14) Excessive rerenders
- Page-level state shape in library is broad; many controls share parent component state.
- Candidate split: filters/search/results/cards into memoized child components.

### 15) SEO issues
- Global metadata exists, but route-level metadata and social tags need stronger coverage.
- Canonical tags and structured data strategy are currently minimal.

---

## Component-level test cases

### `app/layout.tsx`
- Nav links render and are keyboard focusable in sequence.
- Active route indication is visible and screen-reader meaningful.

### `app/page.tsx`
- Anonymous user sees default subtitle.
- Authenticated user sees username and count.
- Count API failure shows status message and does not break nav cards.

### `app/login/page.tsx`
- Email field has label association and required validation.
- Submit button enters disabled/loading state until response.
- Success and error statuses are announced via live region semantics.

### `app/library/page.tsx`
- Unauthenticated view shows sign-in CTA.
- Loading -> loaded -> empty transitions are correct.
- Error state renders retry and retry re-attempts fetch.
- Filter/tier controls update list deterministically.
- Reaction toggle updates pressed state and handles rollback on error.

---

## E2E test scenarios
1. **Magic-link login journey** (mock callback/session).
2. **Library bootstrap**: sign in, load collection, verify counts and cards.
3. **Search and add**: query fragrance, add owned/wishlist, verify persistence after reload.
4. **Reaction stress**: rapid toggling with network delay/failure injection.
5. **Offline recovery**: fail collection fetch, show retry, recover when network restored.
6. **Accessibility smoke**: keyboard-only traversal on home, login, library.

---

## Cypress/Playwright test ideas
- Intercept Supabase network calls with deterministic fixtures and error variants.
- Run visual snapshots across breakpoints: 320, 390, 768, 1024, 1280.
- Add axe checks per route and fail build on critical violations.
- Add hydration warning capture in browser console and fail test on mismatch.
- Add user-timing metrics and regression threshold checks for TTI and interaction delay.

---

## Accessibility audit checklist (WCAG)
- [ ] All interactive controls have accessible names.
- [ ] Toggle controls expose accurate `aria-pressed` states.
- [ ] Focus indicators visible and high-contrast.
- [ ] Body/control text contrast meets 4.5:1 minimum.
- [ ] Form inputs include labels and descriptive errors.
- [ ] Live region announcements for async success/error states.
- [ ] Logical heading structure and landmark usage.
- [ ] Keyboard-only operation for every critical flow.

---

## Mobile-first concerns
- Validate tap target sizes for filter chips, stamp buttons, and nav links.
- Verify long fragrance names and metadata wrap without overlap.
- Ensure sticky/fixed elements (toast) do not obscure key controls.
- Validate virtual keyboard overlap behavior on login/search fields.

---

## Browser compatibility concerns
- Safari/iOS focus styling and form behavior.
- Android Chrome font rendering and viewport shifts.
- Firefox keyboard focus and contrast behavior.
- Reduced-motion and prefers-color-scheme compatibility.

---

## Definition of Done for UI PRs
- ✅ Component-level tests updated/passing.
- ✅ E2E critical path coverage for changed flows.
- ✅ Accessibility checks pass (no critical issues).
- ✅ Mobile + desktop visual review completed.
- ✅ Error/empty/loading states explicitly validated.
- ✅ QA gate checklist attached in PR notes.
