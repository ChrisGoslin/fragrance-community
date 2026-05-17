# 08 - Unknowns And Gaps

## Major Unknowns

| Unknown | Why it matters | Evidence / current state |
| --- | --- | --- |
| Production URL | Needed to compare deployed behaviour against code. | Not documented in repo. |
| Actual Supabase project and schema state | Migrations appear incomplete or drifted from app table usage. | App uses `collections`; initial migration creates `user_collection`. |
| Vercel project settings | Required env vars and deployment ownership are not documented. | No `vercel.json`; `.vercel/` not tracked. |
| MVP route list | Some routes look real and some look placeholder/dev. | `/community`, `/todos`, and formulation placeholder need product decisions. |
| AI roadmap | User plan mentions AI, but audited `origin/main` has no provider integration. | No AI SDK or formulate API route on clean main. |
| Analytics/monitoring expectations | Needed before public MVP testing. | No monitoring or analytics found. |
| Data ownership model | Public catalogue vs user-generated catalogue needs validation. | Migrations say authenticated users can add fragrances; current UI mainly reads seeded catalogue. |

## Missing Documentation

- Environment setup guide.
- `.env.example`.
- Deployed URL and Vercel project notes.
- Supabase migration/setup instructions.
- Database table relationship diagram.
- Auth flow explanation.
- PWA/service worker behaviour.
- MVP definition and route readiness list.
- Known manual scripts and safety notes, especially for service-role scripts.

## Architectural Gaps

- No generated Supabase TypeScript types.
- No central data-access layer for tables such as `fragrances` and `collections`.
- No explicit app-level error boundary found.
- No route protection helper found; screens handle auth individually.
- No formal E2E test suite despite Playwright being installed.
- No monitoring or analytics layer.

## Dangerous Coupling To Validate

```text
Component state and UI
  |
  +-- hardcoded table names
  +-- hardcoded column names
  +-- manual TypeScript interfaces
  +-- direct Supabase mutations
  |
  v
Supabase schema and RLS policies
```

This coupling is not automatically bad for a learning MVP. It is a speed tradeoff. The risk is that schema changes will break user flows in places that are hard to spot.

## Assumptions Requiring Validation

- The intended collection table is `collections`, not `user_collection`.
- `/todos` is not intended to ship in the MVP.
- `/community` can remain placeholder or should be hidden before MVP.
- `learning` notes are allowed to be local-only for now.
- Layering compatibility by phase is the intended first version.
- The current PWA setup is intentional and not leftover boilerplate.
- Production is hosted on Vercel.

## Suggested Next Discovery Questions

These are not recommendations yet; they are the questions that should be answered before architecture decisions:

1. Which routes should a real MVP user be allowed to see?
2. Which Supabase tables exist in production that are missing or renamed in migrations?
3. Should the fragrance catalogue be user-editable, admin-managed, or both?
4. Should learning notes move from local browser storage into Supabase?
5. Should AI formulation live in this app now, or remain behind a feature branch until the core library flow is stable?

