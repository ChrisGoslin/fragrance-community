# 04 - Environment Analysis

## Required Environment Variables

Evidence: `utils/supabase/client.ts`, `utils/supabase/server.ts`, `utils/supabase/middleware.ts`, `scripts/verify-fragrance-images.js`, `.github/workflows/webpack.yml`.

The app expects:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The image verification script additionally expects:

- `SUPABASE_SERVICE_ROLE_KEY`

The CI workflow also defines:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

However, the app helpers read `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Local Environment Files

No `.env.example` file was found in the clean `origin/main` branch.

The user's active checkout has a local `.env.local`, but that file is intentionally not audited or copied because it may contain private values.

## Supabase Client Setup

Browser client:

- File: `utils/supabase/client.ts`
- Uses `createBrowserClient`.
- Reads public Supabase URL and publishable key from environment variables.

Server client:

- File: `utils/supabase/server.ts`
- Uses `createServerClient`.
- Accepts the Next.js cookie store.
- Handles cookie writes defensively for Server Component contexts.

Middleware/proxy client:

- File: `utils/supabase/middleware.ts`
- Uses `createServerClient`.
- Refreshes cookies on requests matched by `proxy.ts`.

## Deployment Environment

Evidence:

- README references Vercel because the project was bootstrapped from Next.js.
- `.vercel/` exists in the user's original checkout, but it is not part of this clean audit branch.
- `next.config.ts` is compatible with Vercel-style deployment.
- No `vercel.json` file was found.

Assumption requiring validation: production deployment is likely Vercel, but the repo does not document the deployed URL, project name, environment variables, or deployment owner.

## CI Environment

File: `.github/workflows/webpack.yml`.

The CI job runs on push and pull request targeting `main`. It uses Node 20 and placeholder Supabase public environment variables.

CI steps:

1. `npm ci`
2. `npm run lint`
3. `npm run type-check`
4. `npm test`
5. `npm run build`

## Environment Risks

- Missing `.env.example` means a new contributor cannot quickly tell which variables are required.
- CI sets `NEXT_PUBLIC_SUPABASE_ANON_KEY`, but app code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase helpers use non-null assertions (`supabaseUrl!`, `supabaseKey!`), so missing environment variables may fail at runtime with unclear errors.
- Service role key is required by `scripts/verify-fragrance-images.js`; that script updates database rows and should be treated as sensitive/privileged.

