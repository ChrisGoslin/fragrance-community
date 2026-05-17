# 03 - Project Structure Map

## Top-Level Map

```text
fragrance-community/
  app/
    api/
      layering/route.ts
    community/page.tsx
    learning/page.tsx
    library/
      page.tsx
      FragranceGrid.tsx
    layering/
      page.tsx
      LayeringClient.tsx
    login/page.tsx
    todos/page.tsx
    layout.tsx
    page.tsx
    globals.css
  lib/
    filter-fragrances.ts
  utils/
    supabase/
      client.ts
      server.ts
      middleware.ts
  supabase/
    migrations/
  scripts/
  __tests__/
  public/
  .github/
```

## Application Routes

| Route | File | What it does |
| --- | --- | --- |
| `/` | `app/page.tsx` | Home dashboard; reads Supabase session and collection count. |
| `/library` | `app/library/page.tsx` | Main personal collection and fragrance catalogue search workflow. |
| `/learning` | `app/learning/page.tsx` | Local browser notes stored in `localStorage`. |
| `/community` | `app/community/page.tsx` | Placeholder page for future community functionality. |
| `/layering` | `app/layering/page.tsx` | Server-loads fragrances and layering protocols, then renders client interaction. |
| `/login` | `app/login/page.tsx` | Supabase email magic-link login and sign-out. |
| `/todos` | `app/todos/page.tsx` | Server-loads `todos`; appears to be a sample or development route. |

## API Layer

| API | File | Behaviour |
| --- | --- | --- |
| `GET /api/layering?fragranceId=...` | `app/api/layering/route.ts` | Loads one fragrance, calculates compatible phases, then returns compatible fragrances. |

The app mostly calls Supabase directly from pages/components rather than routing every action through local API endpoints.

## Major Modules

### Library

Main file: `app/library/page.tsx`.

Responsibilities:

- Detect current Supabase user.
- Load a user's collection from `collections`.
- Load global fragrances from `fragrances`.
- Search catalogue by brand, name, vector, accords, or inspiration.
- Add fragrances to collection.
- Update status, wear state, shelf tier, personal notes.
- Stamp reactions: liked, disliked, unworn.
- Remove collection items.

Risk note: this file currently owns data loading, mutation logic, UI state, styles, and rendering in one large component.

### Layering

Main files:

- `app/layering/page.tsx`
- `app/layering/LayeringClient.tsx`
- `app/api/layering/route.ts`

Responsibilities:

- Load fragrances and protocols from Supabase.
- Let users select a fragrance.
- Show compatible fragrances based on phase differences.
- Show expert protocols.
- Show a placeholder formulation result.

The API route and client component duplicate the broad "compatible phase" idea.

### Auth

Main files:

- `app/login/page.tsx`
- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `utils/supabase/middleware.ts`
- `proxy.ts`

Responsibilities:

- Magic-link sign-in and sign-out.
- Browser and server Supabase clients.
- Cookie refresh through Next.js proxy middleware.

### Learning Notes

Main file: `app/learning/page.tsx`.

Responsibilities:

- Create, list, and delete learning notes.
- Store notes in browser `localStorage`.

This is not connected to Supabase on the audited branch.

## Shared Components And Utilities

- `app/library/FragranceGrid.tsx` is a reusable-ish fragrance grid, but it is not obviously used by `app/library/page.tsx` on this branch.
- `lib/filter-fragrances.ts` is the clearest shared pure utility and has direct unit tests.
- No central component library, design system, API client layer, or typed database layer was found.

## State Management

State management is local React state:

- `useState` and `useEffect` in client components.
- Supabase Auth session state is read directly where needed.
- No Redux, Zustand, React Query, SWR, or central state store was found.

## Service Boundary Map

```text
UI pages/components
  |
  +-- Direct Supabase browser queries
  |     - app/page.tsx
  |     - app/library/page.tsx
  |     - app/library/FragranceGrid.tsx
  |     - app/login/page.tsx
  |
  +-- Direct Supabase server queries
  |     - app/layering/page.tsx
  |     - app/todos/page.tsx
  |
  +-- Next API route
        - app/api/layering/route.ts
```

The current boundary is simple and workable for an MVP, but business rules are spread across UI files rather than collected in a service layer.

