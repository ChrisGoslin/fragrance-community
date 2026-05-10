-- ============================================================
-- RLS performance fixes
-- Wrapping auth.uid() in (select auth.uid()) prevents Postgres
-- from re-evaluating it for every row scanned. On large tables
-- this can be a significant speedup.
-- ============================================================

-- profiles
drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile" on profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" on profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- fragrances (insert policy only — select is public, no auth.uid())
drop policy if exists "Authenticated users can add fragrances" on fragrances;
create policy "Authenticated users can add fragrances" on fragrances
  for insert to authenticated
  with check ((select auth.uid()) = created_by);

-- collections
drop policy if exists "Users manage their own collection" on collections;
create policy "Users manage their own collection" on collections
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- wear_logs
drop policy if exists "Users manage their own wear logs" on wear_logs;
create policy "Users manage their own wear logs" on wear_logs
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- layering_combinations
drop policy if exists "Users manage their own layering combos" on layering_combinations;
create policy "Users manage their own layering combos" on layering_combinations
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- spritz_schedules
drop policy if exists "Users manage their own spritz schedules" on spritz_schedules;
create policy "Users manage their own spritz schedules" on spritz_schedules
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- learning_notes
drop policy if exists "Users manage their own learning notes" on learning_notes;
create policy "Users manage their own learning notes" on learning_notes
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
