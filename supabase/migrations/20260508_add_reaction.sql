-- Add reaction stamp to collections
alter table collections
  add column reaction text check (reaction in ('liked', 'disliked', 'unworn'));

-- Ensure upsert can resolve conflicts on (user_id, fragrance_id)
create unique index if not exists collections_user_fragrance_idx
  on collections (user_id, fragrance_id);
