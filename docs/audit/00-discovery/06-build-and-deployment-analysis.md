# 06 - Build And Deployment Analysis

## Local Commands

Evidence: `package.json`.

```text
npm run dev         -> next dev --webpack
npm run build       -> next build --webpack
npm run start       -> next start
npm run lint        -> eslint .
npm run format      -> prettier --write .
npm test            -> jest
npm run type-check  -> tsc --noEmit
npm run prepare     -> husky install
```

The app intentionally uses webpack for dev and build rather than Turbopack.

## Next.js Configuration

File: `next.config.ts`.

Confirmed settings:

- `reactStrictMode: true`
- `outputFileTracingRoot: path.join(__dirname)`
- `next-pwa` wrapper enabled
- PWA disabled in development through `disable: process.env.NODE_ENV === "development"`
- PWA generated output goes to `public`

## GitHub Actions CI

File: `.github/workflows/webpack.yml`.

Triggers:

- Push to `main`
- Pull request into `main`

Job:

- Runs on `ubuntu-latest`
- Uses Node 20
- Caches npm
- Runs install, lint, type-check, test, and build

```text
checkout
setup-node
npm ci
npm run lint
npm run type-check
npm test
npm run build
```

This is a solid MVP-level quality gate because it checks syntax, types, tests, and production build.

## Deployment Setup

The repository appears Vercel-compatible:

- It is a Next.js app.
- README contains default Vercel deployment guidance.
- The user's non-audit checkout has `.vercel/`, suggesting the project may be linked locally.

Not found in the clean repo:

- `vercel.json`
- deployment URL documentation
- environment setup guide
- release process
- rollback process
- preview deployment instructions

## Infrastructure

The app depends on:

- Vercel or another Next.js host for web serving.
- Supabase for database and auth.
- GitHub Actions for CI.

No Terraform, Pulumi, Dockerfile, docker-compose, Supabase config directory, or infrastructure-as-code was found.

## Testing Setup

Current automated tests:

- One Jest suite: `__tests__/filter-fragrances.test.ts`.
- Unit under test: `lib/filter-fragrances.ts`.

Manual / semi-manual checks:

- `scripts/run-frontend-qa-checklist.sh` runs lint and build, then points to `council/frontend-qa-gate.md`.
- Playwright is installed and used by `scripts/verify-fragrance-images.js`, but not as a formal app E2E test suite.

## Build And Deployment Risks

- CI uses placeholder Supabase values, so build success does not prove production environment variables are configured correctly.
- No deployment documentation means Vercel setup knowledge may live only in someone's account or memory.
- PWA caching can make production debugging harder if service worker behaviour is not documented.
- No E2E tests cover login, library add/update/delete, or layering flows.

