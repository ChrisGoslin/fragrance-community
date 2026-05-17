# 01 - Repository Overview

## What This Repository Appears To Be

This repository is the Scentral / fragrance-community web app. It is a Next.js application for a personal fragrance operating system: browsing a fragrance catalogue, managing a personal library, recording learning notes, and experimenting with layering pairings.

The code audited here is from a clean branch based on `origin/main` at commit `a5f532e` (`Add Layering Lab, fix CI pipeline, add Jest, fix library lint`).

## High-Level Product Shape

The current app has these main user-facing areas:

- `/` - home dashboard with links to library, learning, and login.
- `/library` - authenticated fragrance collection and catalogue search.
- `/learning` - local browser-based learning notes.
- `/community` - placeholder community page.
- `/layering` - fragrance layering exploration screen.
- `/login` - Supabase magic-link authentication.
- `/todos` - simple Supabase-backed todo example or leftover development route.

## How The System Appears To Work

```text
User browser
  |
  v
Next.js App Router pages in /app
  |
  +-- Client components call Supabase browser client
  |     - auth session lookup
  |     - collection reads/writes
  |     - catalogue reads
  |
  +-- Server components and API routes call Supabase server client
        - layering data load
        - compatible fragrance lookup

Supabase
  |
  +-- Auth: email magic link
  +-- Database: fragrances, collections, layering data, and related tables
  +-- RLS policies: intended to protect user-owned data
```

## Current Repository Contents

Important top-level paths:

- `app/` - Next.js App Router pages, layouts, API routes, and page-local components.
- `utils/supabase/` - Supabase browser, server, and middleware client helpers.
- `supabase/migrations/` - database schema, RLS, seed, performance, and security migrations.
- `lib/` - shared utility logic; currently `filter-fragrances.ts`.
- `__tests__/` - Jest tests; currently focused on fragrance filtering.
- `.github/workflows/webpack.yml` - CI workflow for lint, type-check, test, and build.
- `scripts/` - frontend QA checklist and fragrance image verification script.
- `public/` - PWA manifest, icons, generated service worker assets, and default SVGs.

## Current Branch Context

This audit was intentionally created from `origin/main` in a separate clean worktree so it does not include unrelated local changes from `feature/formulate-mobile-nav`.

Notable difference from the user's active local branch: `origin/main` does not currently include `@anthropic-ai/sdk` or `app/api/formulate/route.ts`. Those appear to be branch-level work outside this clean audit baseline.

## Repository Navigation Guide

For a fast walkthrough:

1. Start with `app/layout.tsx` to understand global navigation and metadata.
2. Read `app/page.tsx` for the home dashboard and logged-in collection count.
3. Read `app/library/page.tsx` for the core collection workflow.
4. Read `app/layering/page.tsx` and `app/layering/LayeringClient.tsx` for layering behaviour.
5. Read `utils/supabase/*.ts` to understand how the app talks to Supabase.
6. Read `supabase/migrations/` to understand intended database shape and RLS.
7. Read `.github/workflows/webpack.yml` to understand CI expectations.

