# CLAUDE.md — Fragrance Community App

> **Base principles:** See `~/.claude/CLAUDE.md`.  
> **Source of truth:** See `~/projects/Foresight/PROJECTS.md` (all three projects).

## Status

Parked while Scentral is prioritised. Will resume after Household Finance MVP stabilizes.

## One Priority (When Resumed)

[TO BE DETERMINED WHEN RESUMING: Is the priority MVP launch, community features, discovery algorithm, moderation system, etc.?]

## Christopher

Christopher is a non-technical engineering manager in Dublin learning AI product engineering by shipping real apps. Explain changes in plain language, define necessary terms, and connect repeated patterns back to the shared Next.js + Supabase + Vercel stack.

## Decision Checklist (Before You Code)

For any change to Fragrance Community, before writing code, answer these six questions. If any answer is unclear, stop and ask Christopher.

1. **Does it align with the one priority?** [INSERT PRIORITY WHEN RESUMED]
2. **Is it reversible?** (Can we roll back without cascading breaks?)
3. **Does it touch locked decisions?** (See "Locked" sections below)
4. **Are assumptions explicit?** (What are we assuming about the data, user, or API?)
5. **Is it the simplest version?** (Do we need it today, or are we future-proofing?)
6. **Who needs to know?** (Check AGENTS.md for who to involve)

Time: ~30 seconds. Do this every time. It prevents mistakes.

## Locked: Product Decisions

These are non-negotiable for Fragrance Community. Do not change without stopping and flagging Christopher.

[CRITICAL: These must be established BEFORE active development resumes. Current assumptions:]

- **User-defined prestige.** Users define what "prestige" means in their context, not hardcoded. (Shared pattern with Scentral.)
- **[Other decision to be established when resuming]**

## Locked: Architecture

These patterns are proven for Next.js 16 + Supabase. Do not override without flagging.

- **Use `proxy.ts`, never `middleware.ts`.** (Shared pattern across all projects)
- **Use `--webpack` flag for dev and build.** Turbopack is not compatible with this project.
- **No RLS policy changes** without flagging Christopher first.
- **Rate limiting mandatory.** Upstash Redis for API protection. Never allow unprotected calls to Anthropic SDK.

## Data Model

[TO BE ESTABLISHED WHEN RESUMING: Document the core entities:
- Fragrances table — what makes a unique fragrance?
- Users/Community features — is this multi-user? Authentication required?
- Reviews/ratings — how is user feedback stored?
- Collections — can users save/organize fragrances?
]

## Built Surface

- [TO BE FILLED when MVP scope is defined]

## Working Rules (Operational)

- **Prefer small, reversible fixes.** Don't refactor whole modules to add one feature.
- **No stale PR merges.** Check branch freshness against main before merging.
- **No lint suppression.** Fix root causes; don't silence warnings.
- **List all dependencies.** When adding a package, mention it in your final summary.
- **Keep explanations direct.** Avoid jargon. Define terms. Connect back to the stack.

## Examples: Surgical Changes in Context

[TO BE ADDED WHEN RESUMING: Include 2–3 examples specific to Fragrance Community:
- Error handling pattern (don't leak sensitive data)
- Schema change (what's safe to add?)
- New rate-limited API endpoint
]

## Stack
- **Framework:** Next.js (App Router) — uses `--webpack` flag, not Turbopack
- **Database/Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`)
- **Rate limiting:** Upstash Redis + Ratelimit (`@upstash/ratelimit`, `@upstash/redis`)
- **PWA:** next-pwa
- **Testing:** Jest

## Commands
```bash
npm run dev          # Start dev server (uses --webpack, required)
npm run build        # Production build (also --webpack)
npm run start        # Start production server
npm run test         # Run Jest tests
npm run lint         # ESLint
npm run type-check   # TypeScript check (no emit)
npm run format       # Prettier write
```

⚠️ Always use `--webpack` for dev and build — Turbopack is not compatible with this project.

## Key directories
```
app/          # Next.js App Router pages and API routes
lib/          # Shared utilities, Supabase client, helpers
scripts/      # Data seeding and migration scripts
__tests__/    # Jest test files
public/       # Static assets
```

## Key files
- `next.config.ts` — Next.js config (check before touching bundler settings)
- `lib/supabase/` — Supabase client setup (server + client)
- `FRAGRANCE_SEEDING_GUIDE.md` — How to seed fragrance data

## Gotchas
- **Prestige benchmark is user-defined**, not hardcoded. Do not hardcode prestige logic.
- The `--webpack` flag is non-negotiable; removing it breaks the build.
- Rate limiting via Upstash — requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.

## Environment
Required env vars (check `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
