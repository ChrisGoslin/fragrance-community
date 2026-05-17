# 02 - Tech Stack Analysis

## Confirmed Frontend Stack

Evidence: `package.json`, `app/`, `next.config.ts`, `app/globals.css`.

- Framework: Next.js `16.2.4` using the App Router.
- UI runtime: React `19.2.4` and React DOM `19.2.4`.
- Language: TypeScript `^5`.
- Styling: mixed Tailwind CSS `^4`, global CSS, inline React style objects, and utility classes.
- Fonts: Next.js font integration in `app/layout.tsx` using Geist and Geist Mono.
- PWA: `next-pwa` configured in `next.config.ts`; generated assets exist in `public/sw.js`, `public/workbox-4754cb34.js`, and `public/manifest.webmanifest`.

## Confirmed Backend Stack

Evidence: `app/api/layering/route.ts`, `app/layering/page.tsx`, `app/todos/page.tsx`, `utils/supabase/server.ts`.

- Backend runtime is primarily Next.js server-side code.
- API route present: `app/api/layering/route.ts`.
- Server components call Supabase directly for data loading.
- There is no separate Express, Fastify, Nest, Python, or other backend service in this repository.

## Confirmed Database And Auth Stack

Evidence: `utils/supabase/*.ts`, `supabase/migrations/*.sql`, `app/login/page.tsx`.

- Database: Supabase Postgres.
- Client library: `@supabase/supabase-js`.
- SSR helper library: `@supabase/ssr`.
- Auth: Supabase Auth with email magic links via `supabase.auth.signInWithOtp`.
- Session handling: browser session checks in client components and cookie-based server clients.
- Row Level Security: migrations include RLS policies for catalogue, user collection, wear logs, recipes, profiles, and other user-owned tables.

## AI Integrations

On audited `origin/main`, no live AI provider dependency or AI API route is present.

Evidence:

- `package.json` does not include `@anthropic-ai/sdk`, OpenAI SDK, or Vercel AI SDK.
- No `app/api/formulate/route.ts` exists on this branch.
- `app/layering/LayeringClient.tsx` contains a placeholder result: `Formulation engine coming soon`.

Important context: the user's active local branch appears to contain `@anthropic-ai/sdk` and a formulate route, but those are not part of this clean `origin/main` audit baseline.

## Testing Stack

Evidence: `package.json`, `jest.config.ts`, `__tests__/filter-fragrances.test.ts`.

- Unit test runner: Jest `^30.4.2`.
- Test environment: Node.
- Next.js Jest integration: `next/jest`.
- Current test coverage: one focused test file for `lib/filter-fragrances.ts`.
- Playwright is installed as a dev dependency, but no Playwright config or test suite is present.

## Build, Lint, And Formatting

Evidence: `package.json`, `.github/workflows/webpack.yml`, `eslint.config.mjs`, `.prettierrc`.

- `npm run dev` - starts Next.js dev server with webpack.
- `npm run build` - builds with webpack.
- `npm run lint` - runs ESLint.
- `npm run type-check` - runs `tsc --noEmit`.
- `npm test` - runs Jest.
- `npm run format` - runs Prettier in write mode.
- Husky is configured through `prepare`, but hook files should be checked in `.husky/` when reviewing local behaviour.

## Localisation

Evidence: `app/layout.tsx`, app route text.

- No i18n framework or locale routing was found.
- HTML language is hardcoded as `en`.
- User-facing copy is embedded directly in components.
- Some browser formatting uses the runtime locale, for example `toLocaleDateString()` in `app/learning/page.tsx`.

## Analytics And Monitoring

Evidence: package search and app code search.

- No analytics SDK was found.
- No Sentry, PostHog, Datadog, LogRocket, or similar monitoring package was found.
- Logging is minimal and mostly script-level in `scripts/verify-fragrance-images.js`.
- User-facing error handling exists in selected screens, but there is no central error reporting.

