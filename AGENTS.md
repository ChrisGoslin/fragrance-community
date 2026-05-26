# AGENTS.md — Agent Council for Fragrance Community

## Next.js 16 Rules

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key patterns:
- Use `proxy.ts` for API routes, never `middleware.ts`.
- Use `await cookies()` and `await headers()` in route handlers.
- Named exports: `GET`, `POST`, `PATCH`, `DELETE` (not default export).
- **Use `--webpack` flag for dev and build.** Turbopack is not compatible with this project.

## Agent Council: When to Involve Whom

When making a decision in Fragrance Community, use this matrix:

### Architecture & Next.js Patterns
**When:** File structure, routing, breaking changes, upgrade paths.  
**Use:** `vercel:nextjs` skill.  
**Example:** "Is proxy.ts the right pattern for this API route?"

### Database, Schema, RLS, Migrations
**When:** Schema changes, migrations, RLS policies, Supabase queries, performance.  
**CRITICAL:** Flag schema/RLS changes with Christopher first.  
**Use:** `supabase:supabase` skill + `supabase-postgres-best-practices` skill.  
**Example:** "What's the right way to model user-defined prestige in the schema?"

### Rate Limiting & API Protection
**When:** Protecting API calls (Anthropic SDK, external services), rate limiting.  
**Use:** `security-review` skill + Christopher's sign-off.  
**Example:** "Does this API endpoint need rate limiting via Upstash?"

### Code Quality & Testing
**When:** Before pushing changes, verify the app works as expected.  
**Use:** `verify` skill (run the app, check behavior).  
**Example:** "Does the fragrance discovery algorithm work correctly?"

### High-Risk Changes
**When:** Touching core flows (discovery algorithm, community features), or changes affect multiple routes.  
**Use:** `code-review` skill.  
**Example:** "I rewrote the fragrance ranking logic. Does this look safe?"

### Updating CLAUDE.md or This File
**When:** Documenting learnings, adding new locks, updating decision checklist.  
**Use:** `claude-md-management:revise-claude-md` skill.  
**Example:** "I've learned something important about the prestige-definition pattern. Let me update CLAUDE.md."

## Quick Reference: When to Stop and Flag

**Always flag Christopher before:**
- Changing Supabase schema or RLS policies.
- [TO BE FILLED when resumed: Other Fragrance Community-specific flags]
- Merging stale branches.
- Adding new dependencies.
- Hardcoding business logic that should be user-configurable.

**Ask in Decision Checklist if unsure:** "Does this touch locked decisions?" → If yes, flag.

## Decision Tree

```
About to code a change?
├─ First: Answer Decision Checklist (CLAUDE.md)
├─ If it's a schema/RLS change → Flag Christopher + use supabase skill
├─ If it's a new route → Use vercel:nextjs (proxy.ts pattern) + check --webpack requirement
├─ If it needs rate limiting → Use security-review skill
├─ If it's high-risk → Use code-review skill
├─ If you learned something new → Update CLAUDE.md
└─ After coding → Run verify skill (check it works in the real app)
```
