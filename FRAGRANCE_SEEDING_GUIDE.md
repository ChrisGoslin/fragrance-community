# Fragrance Seeding Guide

## Problem
The `fragrances` table has Row-Level Security (RLS) enabled with a policy that requires:
- For INSERT: the `added_by` field must match the authenticated user's ID
- We have an anon (public) key, not a service role key

## Solution

You have 3 options:

### Option A: Use Supabase Dashboard (Easiest)
1. Go to **https://supabase.com/dashboard** and log in
2. Select your project: **fragrance-community**
3. Click **SQL Editor** (left sidebar)
4. Create a new query
5. Copy the contents of `supabase/migrations/20260512_seed_fragrances.sql`
6. Paste into the SQL editor
7. Click **Run** button
8. Confirm: Query should complete with ~64 rows inserted

### Option B: Use psql (if DATABASE_URL available)
```bash
export DATABASE_URL="postgresql://..."  # Get from Supabase Settings
psql $DATABASE_URL < supabase/migrations/20260512_seed_fragrances.sql
```

### Option C: Use Supabase CLI (if installed)
```bash
cd /Users/christophergoslin/projects/fragrance-community
supabase db push  # Applies all pending migrations including seed
```

## Verification
After seeding, verify in the Supabase dashboard:
```sql
SELECT COUNT(*) as fragrance_count FROM public.fragrances;
-- Should return: 64
```

Or from the app in a Node script:
```bash
node /Users/christophergoslin/projects/fragrance-community/verify_seed.js
```

## Files
- Seed migration: `supabase/migrations/20260512_seed_fragrances.sql` (64 fragrances)
- Temp RLS bypass: `supabase/migrations/20260512_seed_fragrances_rls_bypass.sql` (if needed)
- Verify script: `verify_seed.js` (check count after seeding)
