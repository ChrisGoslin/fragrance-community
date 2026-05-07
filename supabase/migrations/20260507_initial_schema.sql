-- ============================================================
-- Fragrance Community — Initial Schema
-- ============================================================

-- ============================================================
-- 1. FRAGRANCES (shared global catalogue)
--    Any authenticated user can add a fragrance.
--    Everyone can read all fragrances.
-- ============================================================

create type gender_profile as enum ('Men', 'Women', 'Unisex');
create type layering_role  as enum ('Foundation', 'Enhancer', 'Modifier');

create table fragrances (
  id             uuid primary key default gen_random_uuid(),
  brand          text not null,
  name           text not null,
  concentration  text,                  -- e.g. EDP, EDT, Parfum/Extract, EDC
  gender_profile gender_profile,
  layering_role  layering_role,
  notes          text,
  added_by       uuid references auth.users on delete set null,
  created_at     timestamptz default now()
);

alter table fragrances enable row level security;

-- Anyone (logged in or not) can read the catalogue
create policy "fragrances: public read"
  on fragrances for select
  using (true);

-- Only authenticated users can add fragrances
create policy "fragrances: authenticated insert"
  on fragrances for insert
  to authenticated
  with check (auth.uid() = added_by);

-- Only the user who added a fragrance can update or delete it
create policy "fragrances: owner update"
  on fragrances for update
  to authenticated
  using (auth.uid() = added_by);

create policy "fragrances: owner delete"
  on fragrances for delete
  to authenticated
  using (auth.uid() = added_by);


-- ============================================================
-- 2. USER_COLLECTION (personal library)
--    Each row = one fragrance in one user's collection.
--    Status tracks the user's relationship with that fragrance.
-- ============================================================

create type collection_status as enum (
  'own',
  'wishlist',
  'tried',
  'blind_buy',
  'binned',
  'gave_away'
);

create table user_collection (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fragrance_id uuid not null references fragrances on delete cascade,
  status       collection_status not null default 'own',
  bottle_size  int,              -- ml, optional
  rating       int check (rating between 1 and 5),
  notes        text,
  created_at   timestamptz default now(),
  unique (user_id, fragrance_id)  -- one entry per fragrance per user
);

alter table user_collection enable row level security;

create policy "user_collection: own rows only"
  on user_collection for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- 3. WEAR_LOGS (when did you wear it, how did it perform)
-- ============================================================

create table wear_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  fragrance_id uuid not null references fragrances on delete cascade,
  worn_on      date not null default current_date,
  occasion     text,             -- e.g. Work, Casual, Evening, Date
  weather      text,             -- e.g. Warm, Cold, Humid, Dry
  rating       int check (rating between 1 and 5),
  notes        text,
  created_at   timestamptz default now()
);

alter table wear_logs enable row level security;

create policy "wear_logs: own rows only"
  on wear_logs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- 4. LAYER_RECIPES + junction table
--    A recipe has a name and description, then links to
--    2+ fragrances via layer_recipe_fragrances.
-- ============================================================

create table layer_recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

alter table layer_recipes enable row level security;

create policy "layer_recipes: own rows only"
  on layer_recipes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


create table layer_recipe_fragrances (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references layer_recipes on delete cascade,
  fragrance_id uuid not null references fragrances on delete cascade,
  apply_order  int not null default 1,  -- 1 = apply first, 2 = second, etc.
  notes        text,                    -- e.g. "spray on wrists only"
  unique (recipe_id, fragrance_id)
);

alter table layer_recipe_fragrances enable row level security;

-- Users can only see/edit recipe fragrances that belong to their own recipes
create policy "layer_recipe_fragrances: own rows only"
  on layer_recipe_fragrances for all
  to authenticated
  using (
    exists (
      select 1 from layer_recipes
      where layer_recipes.id = recipe_id
        and layer_recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from layer_recipes
      where layer_recipes.id = recipe_id
        and layer_recipes.user_id = auth.uid()
    )
  );
