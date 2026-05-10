-- ============================================================
-- Security fixes
-- ============================================================

-- 1. Fix handle_new_user: lock down the search_path so it cannot
--    be hijacked by objects placed in schemas earlier in the path.
alter function public.handle_new_user()
  set search_path = '';

-- 2. Revoke direct execute access from anon and authenticated roles.
--    handle_new_user is a trigger function — it should only be called
--    by the trigger, never directly via the REST API.
revoke execute on function public.handle_new_user() from anon, authenticated;
