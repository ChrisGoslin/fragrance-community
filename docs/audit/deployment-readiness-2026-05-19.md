# Deployment Readiness Audit — ScentOI / Fragrance Community

**Date:** 2026-05-19  
**Auditor:** Claude (automated session)  
**Branch audited:** `main` (worktree `claude/sweet-haibt-3a5702`)

---

## Audit Scorecard

| Check | Status | Notes |
|---|---|---|
| `next.config.ts` configured | ✅ READY | PWA wrapper, reactStrictMode — no issues |
| `vercel.json` | ✅ READY | Not needed; Vercel auto-detects Next.js |
| Env vars documented | ❌ BLOCKED | No `.env.example`; no env vars in Vercel |
| `npm run build` passes | ❌ BLOCKED | Fails without env vars (Supabase init throws) |
| `middleware.ts` at root | ❌ BLOCKED | File named `proxy.ts` — Next.js ignores it |
| Schema applied & consistent | ⚠️ NEEDS WORK | Migration drift; `collections` vs `user_collection` name conflict |
| Routes exist | ✅ READY | 6 routes built |
| Features end-to-end | ⚠️ NEEDS WORK | Login works; library has runtime schema mismatches; community is a stub |

---

## 1. `next.config.ts` / `vercel.json`

**Status: ✅ READY**

`next.config.ts` exists and is valid. Uses `next-pwa` wrapper with `reactStrictMode: true`.
No `vercel.json` needed — Vercel auto-detects Next.js projects.

---

## 2. Environment Variables

**Status: ❌ BLOCKED**

No `.env.example` file. No `.env.local` (correctly gitignored).

Two variables are required across `utils/supabase/client.ts`, `server.ts`, and `middleware.ts`:

| Variable | Required |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes |

**Action:** Add both to Vercel → Settings → Environment Variables. Create `.env.example` in repo root.

---

## 3. `npm run build`

**Status: ❌ BLOCKED**

Build fails with:

```
Error occurred prerendering page "/library"
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**Root cause:** Both `app/library/page.tsx` and `app/login/page.tsx` call `createClient()` at
module scope. Next.js evaluates this during static generation — it throws when env vars are absent.

**Fix:** Guard the Supabase client with fallback values in `utils/supabase/client.ts`, or set
env vars in Vercel before the build runs. (Addressed in PR #8.)

---

## 4. `middleware.ts` at Project Root

**Status: ❌ BLOCKED**

`proxy.ts` exists at root and exports the session-refresh logic, but Next.js only recognises
`middleware.ts` (or `src/middleware.ts`). The file is silently ignored — no session refreshing,
no route protection runs.

**Fix:** Rename `proxy.ts` → `middleware.ts` and rename the exported function from `proxy` to
`middleware`. (Addressed in PR #8.)

---

## 5. Supabase Schema

**Status: ⚠️ NEEDS WORK**

Six migration files found. Issues:

| File | Problem |
|---|---|
| `20260507_alter_fragrances.sql` | `CREATE TYPE gender_profile/layering_role` — already created in initial schema; will error on apply |
| `20260508_add_reaction.sql` | References `collections` table — initial schema calls it `user_collection` |
| `20260510_missing_fk_indexes.sql` | Indexes on `layering_combinations`, `learning_notes`, `spritz_schedules` — none of these tables exist |
| `20260510_security_fixes.sql` | Alters `public.handle_new_user()` — function not defined in any migration |

**Code/schema mismatch:** `app/library/page.tsx` queries columns `primary_vector`,
`dominant_accords`, `top_notes`, `heart_notes`, `base_notes`, `inspired_by` on `fragrances` —
none of these exist in the migration files. The live Supabase database was likely edited manually
via the dashboard.

**Action:** Run `select column_name from information_schema.columns where table_name = 'fragrances'`
in Supabase SQL editor to confirm what actually exists, then reconcile migrations.

---

## 6. Full Sitemap

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Home — username + collection count from DB |
| `/library` | `app/library/page.tsx` | Fragrance shelf with reactions, wear states, shelf tiers |
| `/learning` | `app/learning/page.tsx` | Notes — **localStorage only, not saved to DB** |
| `/community` | `app/community/page.tsx` | Stub — placeholder text only |
| `/login` | `app/login/page.tsx` | Magic-link auth via Supabase |
| `/todos` | `app/todos/page.tsx` | **Leftover test page** — queries non-existent `todos` table; delete this |

---

## 7. Features: Working vs Stubbed

| Feature | Status |
|---|---|
| Magic link login / logout | ✅ Working |
| Home personalisation (username, count) | ✅ Working |
| Library — display fragrances | ⚠️ Runtime errors if DB schema doesn't match code |
| Library — reaction stamps | ⚠️ Upserts to `collections`; schema has `user_collection` |
| Learning notes | ⚠️ localStorage only — lost between devices |
| Community | ❌ Stub |
| Route protection / auth gating | ❌ Not working — middleware file named wrong |
| Todos | ❌ Should be deleted |

---

## 8. Prioritised Fix List

### Blocker 1 — Rename `proxy.ts` → `middleware.ts`
```bash
mv proxy.ts middleware.ts
# Change: "export async function proxy" → "export async function middleware"
```

### Blocker 2 — Add env vars to Vercel + create `.env.example`
Set in Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Blocker 3 — Guard Supabase client init against missing env vars
In `utils/supabase/client.ts`, add `?? 'placeholder'` fallbacks so the build
doesn't throw when env vars are absent.

### Blocker 4 — Delete `/todos` page
```bash
rm app/todos/page.tsx
```

### Blocker 5 — Confirm live Supabase schema
Query the live DB and reconcile migration files with what actually exists.

---

*All code fixes from this audit were implemented in PR #8 (`fix/deployment-blockers`).*
