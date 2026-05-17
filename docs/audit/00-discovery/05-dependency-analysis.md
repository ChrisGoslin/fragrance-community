# 05 - Dependency Analysis

## Runtime Dependencies

Evidence: `package.json`.

| Package | Purpose |
| --- | --- |
| `next` | App framework, routing, server rendering, build system. |
| `react` | UI library. |
| `react-dom` | Browser DOM rendering for React. |
| `@supabase/supabase-js` | Supabase database and auth client. |
| `@supabase/ssr` | Supabase browser/server helpers for SSR and cookies. |
| `next-pwa` | Generates PWA service worker assets. |

## Development Dependencies

| Package | Purpose |
| --- | --- |
| `typescript` | Static typing. |
| `eslint` and `eslint-config-next` | Code linting and Next.js rules. |
| `prettier` | Formatting. |
| `jest`, `jest-environment-jsdom`, `@types/jest` | Unit testing. |
| `playwright` | Browser automation dependency; used by an image verification script, not a test suite. |
| `tailwindcss`, `@tailwindcss/postcss` | Tailwind CSS v4 support. |
| `husky` | Git hook management. |
| `@types/*` packages | TypeScript type declarations. |

## Not Present On Audited Main

The following were not found in `package.json` on clean `origin/main`:

- `@anthropic-ai/sdk`
- `openai`
- `ai` / Vercel AI SDK
- `zod`
- Sentry, PostHog, Datadog, or other monitoring SDKs
- React Query, SWR, Redux, or Zustand
- Supabase CLI package

## Dependency-Driven Architecture Observations

- The stack is intentionally simple: Next.js plus Supabase covers most app needs.
- No ORM is present; database access is direct through Supabase query builders.
- No generated database TypeScript types are present, so table shapes are manually typed inside components.
- Playwright is installed, but no browser test harness is present. The current Playwright usage is a manual/scripted image update workflow.
- `next-pwa` creates generated assets in `public/`; ESLint explicitly ignores these generated files.

## Dependency Risks And Hotspots

- Next.js `16.2.4` and React `19.2.4` are very new-looking major versions. That may be fine, but it raises compatibility risk with older libraries such as `next-pwa`.
- `next-pwa` can add build complexity because it generates service worker files and can affect caching behaviour.
- No dependency appears to centralise data fetching, caching, or mutation state, so those concerns are handled manually in components.
- The image verification script depends on external website structure and browser behaviour; this is likely brittle by nature.

