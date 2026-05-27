# CLAUDE.md — Fragrance Community App

> **Base principles:** See `~/.claude/CLAUDE.md`.  
> **Agent council matrix:** See `AGENTS.md`.  
> **Project overview (all projects):** See `PROJECTS.md`.

---

## What This App Is

**Fragrance Community** is a PWA for fragrance enthusiasts. Users can:

- **Library** — Personal scent journal: add fragrances, rate them, write tasting notes, mark as public/private.
- **Community** — Read-only feed of publicly shared fragrances from all members.
- **Learning** — Local notes (localStorage) on olfactory families, layering technique, projection, longevity.
- **Layering** — AI-powered fragrance pairing via the **Formulate** engine: pick two fragrances, provide context (time/weather/occasion), receive a named combo with application steps and expert narrative.
- **DNA Match** — Score similarity between any two fragrances (0–100) across five categories (Virtually Twin → Distant Relatives), with an AI-generated narrative.
- **Scan** — Claude Vision bottle recognition: send a base64 image, receive brand/name/concentration/confidence.
- **Schedule** — Spritz schedule planner (stub — coming soon).
- **Profile** — Account management (auth-gated stub).

Authentication is **magic-link only** (no passwords). Supabase handles auth; sessions are cookie-based via `@supabase/ssr`.

---

## Status

Parked while Scentral is prioritised. Will resume after Household Finance MVP stabilises.

## One Priority (When Resumed)

[TO BE DETERMINED WHEN RESUMING: Is the priority MVP launch, community features, discovery algorithm, moderation system, etc.?]

---

## Christopher

Christopher is a non-technical engineering manager in Dublin learning AI product engineering by shipping real apps. Explain changes in plain language, define necessary terms, and connect repeated patterns back to the shared Next.js + Supabase + Vercel stack.

---

## Decision Checklist (Before You Code)

For any change, answer these six questions before writing a line of code. If any answer is unclear, stop and ask Christopher.

1. **Does it align with the one priority?** [INSERT PRIORITY WHEN RESUMED]
2. **Is it reversible?** (Can we roll back without cascading breaks?)
3. **Does it touch locked decisions?** (See "Locked" sections below)
4. **Are assumptions explicit?** (What are we assuming about the data, user, or API?)
5. **Is it the simplest version?** (Do we need it today, or are we future-proofing?)
6. **Who needs to know?** (Check `AGENTS.md` for who to involve)

Time: ~30 seconds. Do this every time.

---

## Locked: Product Decisions

Do not change these without stopping and flagging Christopher.

- **User-defined prestige.** Users define what "prestige" means in their context — never hardcode it. (Shared pattern with Scentral.)
- **Magic-link auth only.** No password flows. Supabase OTP via email.
- **Phase system is non-negotiable.** Fragrances have layering phases (1 = Anchor, 2 = Bridge, 3 = Top). Phase ordering drives Formulate logic. Do not change the phase semantics.

---

## Locked: Architecture

These patterns are proven for Next.js 16 + Supabase. Do not override without flagging.

- **Use `proxy.ts`, never `middleware.ts`.** Session refresh lives in `proxy.ts` → `utils/supabase/middleware.ts`. The Next.js `middleware.ts` file does not exist in this project.
- **Use `--webpack` flag for dev and build.** Turbopack is incompatible. The `package.json` scripts encode this; do not remove the flag.
- **No RLS policy changes** without flagging Christopher first.
- **Rate limiting mandatory on all AI/external endpoints.** Upstash Redis (`@upstash/ratelimit`) is already wired in `/api/formulate`. Every new endpoint that calls Anthropic or any paid external service must add the same pattern.
- **Auth guard on every API route that mutates data.** Call `supabase.auth.getUser()` at the top of every route handler and return `401` if no user.
- **Prompt caching on repeated system prompts.** The `cache_control: { type: 'ephemeral' }` block in `/api/formulate` reduces cost by ~90% on the system prompt. Use the same pattern whenever a large, stable system prompt is sent.

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| Runtime | React | 19.2.4 |
| Language | TypeScript (strict) | ^5 |
| Database/Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | ^0.10.2 / ^2.105.1 |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) | ^0.96.0 |
| AI model used | `claude-haiku-4-5` | — |
| Rate limiting | Upstash Redis + Ratelimit | `@upstash/ratelimit` ^2.0.8 |
| PWA | next-pwa | ^5.6.0 |
| Styling | Tailwind CSS | v4 |
| Fonts | Geist / Geist Mono (Google Fonts via Next.js) | — |
| Testing | Jest + next/jest | ^30.4.2 |
| E2E | Playwright | ^1.60.0 (installed, no active test files yet) |
| Linting | ESLint + eslint-config-next | ^9 |
| Formatting | Prettier | ^3.8.3 |
| Git hooks | Husky | ^8 |
| Deployment | Vercel (native Git integration) | — |

---

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

⚠️ **Always use `--webpack` for dev and build — Turbopack is not compatible with this project.**

---

## Environment Variables

Set all of these in `.env.local`. See `.env.example` for the template.

| Variable | Purpose | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key | ✅ |
| `ANTHROPIC_API_KEY` | Anthropic API — used by `/api/formulate`, `/api/dna-match`, `/api/scan` | ✅ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | ✅ for prod |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | ✅ for prod |

> ⚠️ The Supabase key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, **not** `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Using the wrong name silently breaks auth.

If `UPSTASH_*` vars are absent, `/api/formulate` falls back to allowing requests through (safe for local dev, not for production).

---

## Directory Structure

```
app/                    # Next.js App Router
  api/
    dna-match/          # POST — similarity scoring + AI narrative
    formulate/          # POST — AI layering recipe (rate-limited)
    layering/           # GET  — compatible fragrances for a given ID
    scan/               # POST — Claude Vision bottle recognition
    auth/
      callback/         # GET  — Supabase auth callback (magic link)
      confirm/          # GET  — Supabase OTP confirmation
  community/            # Public fragrance feed (no auth)
  components/
    NavBar.tsx          # Client Component — live auth state
    BottomNav.tsx       # Mobile bottom navigation
  dna-match/            # DNA Match page (server + client split)
  layering/             # Layering/Formulate page (server + client split)
  learning/             # Learning notes (localStorage, no auth)
  library/              # Personal journal (auth-gated)
  login/                # Magic-link login
  profile/              # Profile stub (auth-gated)
  schedule/             # Spritz schedule stub
  error.tsx             # Global error boundary
  globals.css           # Global styles
  layout.tsx            # Root layout (NavBar + Geist fonts)
  page.tsx              # Home / landing

lib/
  filter-fragrances.ts  # Pure filter utility (season/lean/anosmia)
  types.ts              # Shared TypeScript types (Fragrance, Session)

utils/supabase/
  client.ts             # Browser Supabase client (createBrowserClient)
  server.ts             # Server Supabase client (createServerClient + cookies)
  middleware.ts         # Session refresh helper (called from proxy.ts)

supabase/
  schema.sql            # Reference schema (paste into SQL editor for fresh DB)
  migrations/           # Ordered migration files

scripts/
  run-frontend-qa-checklist.sh
  verify-fragrance-images.js

__tests__/
  filter-fragrances.test.ts  # Unit tests for filterFragrances utility

council/                # Architecture review documents (read-only reference)
public/
  manifest.webmanifest  # PWA manifest
  sw.js                 # Service worker (generated by next-pwa)
  icon-192.png          # PWA icons
  icon-512.png

proxy.ts               # Session middleware (use this, not middleware.ts)
next.config.ts         # Next.js config (withPWA wrapper)
tsconfig.json          # TypeScript config (strict, @/* alias)
jest.config.js         # Jest config (next/jest, node environment)
```

---

## Database Schema

The live database is managed via migrations in `supabase/migrations/`. `supabase/schema.sql` is a reference snapshot for bootstrapping a fresh project.

### Core Tables

#### `fragrances` — Global catalogue
Every fragrance in the system. Anyone (including unauthenticated users) can read. Only authenticated users can add their own rows.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `brand` | text | |
| `name` | text | |
| `concentration` | text | EDP / EDT / Parfum / EDC |
| `gender_profile` | enum | Men / Women / Unisex |
| `layering_role` | enum | Foundation / Enhancer / Modifier |
| `phase` | integer | 1 (Anchor), 2 (Bridge), 3 (Top) — drives Formulate ordering |
| `phase_label` | text | Human-readable phase name |
| `family` | text | Olfactory family |
| `primary_vector` | text | DNA Match primary scent axis |
| `dominant_accords` | text[] | DNA Match accord list |
| `application_zone` | text | Where to apply |
| `application_method` | text | Optional spray/roll-on hint |
| `anosmia_risk` | text | High / Medium / Low |
| `projection` | text | Sillage descriptor |
| `lean` | text | Masculine / Feminine / Unisex |
| `temperature` | text | Cold / Warm / Hot / All-season |
| `rating` | integer | 1–5 (optional) |
| `notes` | text | Freeform notes |
| `added_by` / `created_by` | uuid → auth.users | FK — only they can update/delete |
| `created_at` | timestamptz | |

**RLS:** Public read (`true`). Authenticated insert (`auth.uid() = created_by`). Owner-only update/delete.

#### `user_collection` / `collections` — Personal library
One row per user per fragrance. Tracks ownership status.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid → auth.users | |
| `fragrance_id` | uuid → fragrances | |
| `status` | enum | own / wishlist / tried / blind_buy / binned / gave_away |
| `bottle_size` | integer | ml, optional |
| `rating` | integer | 1–5, optional |
| `notes` | text | |
| `reaction` | text | liked / disliked / unworn (added in migration) |
| `created_at` | timestamptz | |

Unique constraint: `(user_id, fragrance_id)`. **RLS:** All operations restricted to own user.

#### `wear_logs` — When worn
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid → auth.users | |
| `fragrance_id` | uuid → fragrances | |
| `worn_on` | date | |
| `occasion` | text | Work / Casual / Evening / Date |
| `weather` | text | Warm / Cold / Humid / Dry |
| `rating` | integer | 1–5, optional |
| `notes` | text | |
| `created_at` | timestamptz | |

**RLS:** All operations restricted to own user.

#### `layer_recipes` + `layer_recipe_fragrances` — User layering recipes
User-created pairings; `layer_recipe_fragrances` is a junction table with `apply_order`.

#### `dna_matches` — Similarity cache
Computed DNA Match scores stored to avoid re-calling Anthropic for the same pair. Pair order is normalised (A < B lexicographically). Public read. **Insert requires service role** (the API comment notes this is currently bypassed — the cache write is a TODO).

#### Other tables (schema exists, stubs in UI)
- `profiles` — User profile data.
- `layering_protocols` — Curated layering protocol records (read by the Layering page).
- `layering_combinations` — User-saved layering combos.
- `spritz_schedules` — Scheduled scent rotations.
- `learning_notes` — Synced learning notes (currently LocalStorage only in UI).

### RLS Performance Pattern
All `auth.uid()` comparisons use `(select auth.uid())` to prevent per-row re-evaluation:
```sql
-- ✅ Correct — evaluated once per query
using ((select auth.uid()) = user_id)

-- ❌ Avoid — re-evaluated per row
using (auth.uid() = user_id)
```

---

## API Routes

### `POST /api/formulate`
AI-powered layering recipe. **Auth required. Rate limited: 10 req/min/user (sliding window).**

**Input:**
```typescript
{
  fragrance1: { name, brand, phase, phase_label, family, projection, application_zone, application_method?, anosmia_risk, lean },
  fragrance2: { /* same */ },
  context: { time_of_day, weather, occasion }
}
```

**Output:**
```typescript
{
  success: true,
  result: { combo_name, application_steps[], sillage_prediction, occasion_tag, anosmia_warning, claude_note },
  tokens_used, cache_read_tokens, cache_created_tokens
}
```

Uses **prompt caching** on the system prompt via `cache_control: { type: 'ephemeral' }`. Model: `claude-haiku-4-5`.

### `GET /api/layering?fragranceId=<uuid>`
Returns one fragrance + all fragrances of compatible phases (different from the input's phase). No auth required.

### `POST /api/dna-match`
Similarity scoring between two fragrances. **Auth required.** Checks `dna_matches` cache first.

**Input:** `{ fragrance_a_id, fragrance_b_id }`

**Output:** `{ success, score (0–100), category, narrative, cached }`

Score categories: Virtually Twin (90–100) → Strategic Inspiration (75–89) → Sophisticated Homage (60–74) → Olfactive Cousin (40–59) → Distant Relatives (<40).

Scoring breakdown: primary vector match = 35 pts, accord overlap = up to 50 pts, concentration match = 10 pts, inspired-by bonus = up to 5 pts.

### `POST /api/scan`
Claude Vision bottle recognition. **Auth required.** No rate limit yet (add before production scale).

**Input:** `{ image_base64: string, media_type: "image/jpeg" | "image/png" | "image/webp" }`

**Output:** `{ success, result: { brand, name, concentration, confidence (0–100), notes } }`

Model: `claude-haiku-4-5`.

### Auth routes
- `GET /api/auth/callback` — Handles magic link redirect from email.
- `GET /api/auth/confirm` — Handles OTP token confirmation.

---

## Supabase Client Pattern

Always use the right client for the context:

```typescript
// In Server Components, API routes, page.tsx with `cookies()`:
import { createClient } from '@/utils/supabase/server';
const cookieStore = await cookies();
const supabase = createClient(cookieStore);

// In Client Components ('use client'):
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
```

The `@/*` alias maps to the **project root**, so `@/utils/supabase/server` → `./utils/supabase/server.ts`.

---

## Page Patterns

### Server + Client split (preferred for data-heavy pages)
`layering/page.tsx` and `dna-match/page.tsx` show the correct pattern:
1. **`page.tsx` (Server Component)** — fetches data from Supabase using the server client, passes it as props.
2. **`*Client.tsx` (Client Component)** — receives data as props, handles interactive state.

This avoids client-side waterfall fetching and keeps sensitive Supabase calls server-side.

### Client-only pages
`library/page.tsx`, `community/page.tsx`, `learning/page.tsx`, `login/page.tsx` are `'use client'` pages that manage their own state and fetch via the browser Supabase client. Acceptable for simpler pages.

### Auth pattern in pages
```typescript
// Server Component — redirect if not authenticated:
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect('/login?next=/profile');

// Client Component — bootstrap from session:
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUserId(session?.user.id ?? null);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUserId(session?.user.id ?? null);
  });
  return () => subscription.unsubscribe();
}, []);
```

---

## Shared Types

`lib/types.ts` is the single source of truth for TypeScript types. When the database schema changes, update this file first — TypeScript will show every downstream breakage.

```typescript
// Current shared types:
export interface Fragrance { id, user_id, name, brand, notes, rating, is_public, created_at }
export type { Session }  // re-exported from @supabase/supabase-js
```

> ⚠️ The `Fragrance` interface in `lib/types.ts` reflects the simpler schema used by the Library page. The extended fragrance shape (with `phase`, `primary_vector`, etc.) is defined inline in the API routes and client components. **When resuming, unify these into a single comprehensive type.**

---

## Filter Utility

`lib/filter-fragrances.ts` provides a generic, fully tested pure function:

```typescript
filterFragrances(fragrances, { season, lean, anosmia })
// season: 'All' | 'Cold' | 'Warm' | 'Hot'
// lean:   'All' | 'Masculine' | 'Feminine' | 'Unisex'
// anosmia: 'All' | 'High' | 'Medium' | 'Low'
```

Test it before changing: `npm run test`.

---

## Testing

**Unit tests:** Jest + `next/jest`. Test environment: `node`. Run with `npm run test`.

- `__tests__/filter-fragrances.test.ts` — 7 cases covering all filter combinations.

**E2E:** Playwright is installed but no test files exist yet.

**Type checking:** `npm run type-check` (runs `tsc --noEmit`, no emission).

---

## PWA Configuration

`next.config.ts` wraps the Next.js config with `next-pwa`:
- Service worker output: `public/sw.js` (generated on build)
- PWA **disabled in development** (`process.env.NODE_ENV === "development"`)
- Manifest: `public/manifest.webmanifest`
- Icons: `public/icon-192.png`, `public/icon-512.png`

The `require()` call in `next.config.ts` is intentional — `next-pwa` ships CommonJS only.

---

## Security Notes

A full security review lives at `council/backend-api-security-review-2026-05-13.md`. Key open items:

| Risk | Status | Notes |
|---|---|---|
| Rate limiting on `/api/formulate` | ✅ Done | Upstash, 10/min/user |
| Rate limiting on `/api/scan`, `/api/dna-match` | ⚠️ Missing | Add before scaling |
| OTP/magic-link rate limiting | ⚠️ Missing | No app-layer IP+email cap |
| DNA match cache write (service role) | ⚠️ Incomplete | Cache reads work; inserts are no-ops |
| RLS contract tests in CI | ⚠️ Missing | High priority before launch |
| Broad `select('*')` in some client reads | ⚠️ Minor | Prefer projected selects |

---

## Migrations

Migrations live in `supabase/migrations/` and are applied in filename order. Run via Supabase CLI (`supabase db push`) or directly in the Supabase SQL Editor.

| File | Purpose |
|---|---|
| `20260507_initial_schema.sql` | Core tables: fragrances, user_collection, wear_logs, layer_recipes |
| `20260507000001_alter_fragrances.sql` | Adds gender_profile, layering_role, notes if missing (idempotent) |
| `20260508_add_reaction.sql` | Adds reaction column + unique index to collections |
| `20260510_missing_fk_indexes.sql` | FK performance indexes on collections, wear_logs, etc. |
| `20260510_rls_performance_fixes.sql` | Wraps `auth.uid()` in `(select ...)` for all policies |
| `20260510_security_fixes.sql` | Locks down `handle_new_user` trigger function |
| `20260512_seed_fragrances.sql` | Fragrance catalogue seed data |
| `20260512_seed_fragrances_rls_bypass.sql` | RLS bypass wrapper for seeding |
| `20260521_dna_matches_cache.sql` | DNA matches cache table |

**Before adding a migration:** flag Christopher. Schema and RLS changes are locked decisions.

---

## Deployment

Vercel handles deployment via native Git integration (no `.github/workflows/` CI file). Pushing to `main` triggers a production deploy automatically.

Environment variables must be configured in the Vercel project dashboard — they are not committed to the repo.

---

## Working Rules (Operational)

- **Prefer small, reversible fixes.** Don't refactor whole modules to add one feature.
- **No stale PR merges.** Check branch freshness against main before merging.
- **No lint suppression.** Fix root causes; don't silence warnings.
- **List all dependencies.** When adding a package, mention it in your final summary.
- **Keep explanations direct.** Avoid jargon. Define terms. Connect back to the stack.
- **New AI endpoint = rate limiting required.** No exceptions.
- **Explicit column projections in Supabase queries.** Avoid `select('*')` — list only the columns you use.

---

## Key Files Quick Reference

| File | What it does |
|---|---|
| `proxy.ts` | Session middleware entrypoint |
| `utils/supabase/server.ts` | Server-side Supabase client |
| `utils/supabase/client.ts` | Browser Supabase client |
| `utils/supabase/middleware.ts` | `updateSession()` helper |
| `lib/types.ts` | Shared TS types — update when schema changes |
| `lib/filter-fragrances.ts` | Pure filter utility (tested) |
| `app/api/formulate/route.ts` | Formulate AI endpoint (reference for new AI routes) |
| `next.config.ts` | Next.js + PWA config (don't touch bundler settings) |
| `supabase/schema.sql` | Reference schema for fresh DB bootstrap |
| `FRAGRANCE_SEEDING_GUIDE.md` | How to seed fragrance data |
| `council/backend-api-security-review-2026-05-13.md` | Security review findings |
| `council/production-readiness-review-2026-05-13.md` | Production readiness review |
| `council/reliability-audit-2026-05-12.md` | Reliability audit |

---

## Gotchas

1. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** — not `ANON_KEY`. The wrong name breaks auth silently.
2. **`--webpack` flag is non-negotiable.** Removing it breaks the build.
3. **`proxy.ts` not `middleware.ts`.** This project does not use Next.js middleware.
4. **`lib/types.ts` has two Fragrance shapes.** The interface there is the simple Library schema. The extended fragrance type (phase, primary_vector, etc.) is inline in routes/components. Unify before the next major feature.
5. **DNA match cache write is incomplete.** The API calculates and returns scores but does not persist them to `dna_matches` (service role issue noted in code comment). Fix this before production scale.
6. **Learning notes are localStorage-only.** The `learning_notes` table exists in the schema (with FK indexes) but the UI only uses `localStorage`. Migration to Supabase is a future task.
7. **PWA service worker is only generated on production build.** `npm run dev` will not produce `sw.js`.
8. **next-pwa uses `require()` in `next.config.ts`.** This is intentional; do not convert to ESM import.
