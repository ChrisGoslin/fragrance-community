-- Add missing columns to fragrances table
-- gender_profile and layering_role use enums; notes is free text
--
-- NOTE: These types and columns were later added directly to the initial schema,
-- so on a fresh preview DB this migration is a no-op. The DO block guards against
-- running out-of-order (this file sorts before initial_schema alphabetically).

do $$ begin
  -- Only proceed if the fragrances table already exists
  if not exists (
    select from pg_tables
    where schemaname = 'public' and tablename = 'fragrances'
  ) then
    return;
  end if;

  -- Create enum types if they don't already exist
  if not exists (select 1 from pg_type where typname = 'gender_profile') then
    create type gender_profile as enum ('Men', 'Women', 'Unisex');
  end if;

  if not exists (select 1 from pg_type where typname = 'layering_role') then
    create type layering_role as enum ('Foundation', 'Enhancer', 'Modifier');
  end if;

  -- Add columns only if they don't already exist
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fragrances' and column_name = 'gender_profile'
  ) then
    alter table fragrances add column gender_profile gender_profile;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fragrances' and column_name = 'layering_role'
  ) then
    alter table fragrances add column layering_role layering_role;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fragrances' and column_name = 'notes'
  ) then
    alter table fragrances add column notes text;
  end if;
end $$;
