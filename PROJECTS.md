# PROJECTS.md — Source of Truth

Always check this file before making a plan or roadmap.
If a request conflicts with this file, flag it and propose a resolution.

---

## Project 1 — Fragrance App
- **Goal:** A web app for fragrance discovery, likely including browsing,
  searching, and some form of personalisation or recommendations.
- **Status:** In progress — has working code deployed on Vercel; missing
  core features needed to call it an MVP.
- **Stack:** To be confirmed via audit (likely Next.js or similar, on Vercel).
- **Where it lives:** Vercel (deployed), VSCode (local files), Notion (docs/specs).
- **Priority:** Active — push to MVP now.
- **Next 3 actions:**
  1. Audit what exists: deployed URL, codebase, Notion docs.
  2. Define the MVP feature set — what must work for a real user visit.
  3. Identify and close the biggest gap between current state and MVP.

---

## Project 2 — Wholesale Gardening Database
- **Goal:** A database-backed app for wholesale gardening — likely product
  catalogue, inventory, or ordering for a B2B context.
- **Status:** Early — idea and some specs exist, limited working code.
- **Stack:** Not yet decided.
- **Priority:** Parked until Fragrance App reaches MVP.
- **Next 3 actions:**
  1. Define the core user and their main job to be done.
  2. Sketch a minimal data model (products, categories, suppliers, etc.).
  3. Choose a stack once Fragrance App stack is confirmed (reuse where possible).

---

## Project 3 — Personal Financial Planner
- **Goal:** A personal tool for financial planning — tracking, projections,
  or goal-setting for personal use.
- **Status:** Early — idea and some specs exist, limited working code.
- **Stack:** Not yet decided.
- **Priority:** Parked until Fragrance App reaches MVP.
- **Note:** Financial data is sensitive — will need auth and privacy decisions
  before building.
- **Next 3 actions:**
  1. Define what "personal financial planning" means concretely for this app.
  2. Decide: personal-only tool or something shareable with others?
  3. Design data model and auth approach before writing any code.

---

## Cross-project principles
- Prefer reusing the same stack across projects where possible.
- Each project should reach a real MVP before adding new features.
- Keep complexity low — we are learning while building.
