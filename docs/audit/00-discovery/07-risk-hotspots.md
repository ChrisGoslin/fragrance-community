# 07 - Risk Hotspots

## 1. Database Schema Drift

Severity: high.

Evidence:

- `supabase/migrations/20260507_initial_schema.sql` creates `user_collection`.
- App code uses `collections` in `app/page.tsx`, `app/library/page.tsx`, and `app/library/FragranceGrid.tsx`.
- Later migrations reference tables such as `collections`, `profiles`, `layering_combinations`, `spritz_schedules`, and `learning_notes`, but those table definitions are not visible in the audited migration set.

Why this matters:

The app may depend on database changes that happened outside the tracked migrations. That makes local setup, CI validation, and future debugging harder.

## 2. Large UI Components Own Too Much Behaviour

Severity: medium-high.

Evidence:

- `app/library/page.tsx` owns auth lookup, data loading, filtering, mutation calls, optimistic-ish state updates, toast behaviour, style definitions, and rendering.
- `app/layering/LayeringClient.tsx` owns search, compatibility logic, form state, protocol highlighting, and rendering.

Why this matters:

This is workable for an MVP, but changes will get riskier as features grow. Bugs will be harder to isolate because product rules and UI presentation live together.

## 3. Direct UI-To-Database Coupling

Severity: medium-high.

Evidence:

- Client components directly call `supabase.from(...).insert/update/delete/upsert`.
- Table and column names are embedded in UI files.
- Manual TypeScript interfaces are declared per component.

Why this matters:

Any database rename or policy change can break screens directly. Without generated database types or a small data-access layer, TypeScript cannot fully protect the app from schema drift.

## 4. Auth And Environment Failure Modes Are Thin

Severity: medium.

Evidence:

- Supabase helpers use non-null assertions for environment variables.
- Missing env vars are not validated early with clear messages.
- Some routes assume Supabase calls succeed or only partially handle errors.

Why this matters:

For a non-technical operator, unclear auth/env failures can feel like the app is "just broken" rather than pointing to a fixable setup issue.

## 5. PWA Caching Complexity

Severity: medium.

Evidence:

- `next-pwa` is enabled for production.
- Generated service worker files are committed under `public/`.
- No PWA behaviour or cache invalidation documentation was found.

Why this matters:

PWA caching can make stale UI or data issues confusing during MVP testing, especially on mobile.

## 6. Placeholder Or Unfinished Product Surfaces

Severity: medium.

Evidence:

- `/community` is a placeholder.
- `/todos` appears to be a sample/development route.
- `/layering` has a "Formulation engine coming soon" placeholder.
- `/learning` stores notes in local browser storage rather than account-backed persistence.

Why this matters:

These may be acceptable during learning, but they should be intentionally included or hidden before an MVP user visit.

## 7. Limited Test Coverage Around Core Flows

Severity: medium.

Evidence:

- Automated tests cover only `filter-fragrances`.
- No tests cover Supabase data access, auth, library mutations, layering compatibility route, or route rendering.

Why this matters:

The most important user flows can regress while CI remains green.

## 8. Privileged Image Update Script

Severity: medium.

Evidence:

- `scripts/verify-fragrance-images.js` requires `SUPABASE_SERVICE_ROLE_KEY`.
- The script launches a headed browser, scrapes Fragrantica search results, and updates `fragrances.image_url`.

Why this matters:

Service-role scripts bypass normal user protections. This script should remain manual and carefully guarded.

