-- ============================================================
-- Missing foreign key indexes
-- Without these, any query that joins or filters on these FK
-- columns triggers a sequential scan of the referenced table.
-- ============================================================

-- fragrances.created_by → auth.users
create index if not exists fragrances_created_by_idx
  on fragrances (created_by);

-- layering_combinations FK slots
create index if not exists layering_combinations_base_collection_id_idx
  on layering_combinations (base_collection_id);

create index if not exists layering_combinations_top_collection_id_idx
  on layering_combinations (top_collection_id);

create index if not exists layering_combinations_third_collection_id_idx
  on layering_combinations (third_collection_id);

create index if not exists layering_combinations_fourth_collection_id_idx
  on layering_combinations (fourth_collection_id);

-- learning_notes.wear_log_id → wear_logs
create index if not exists learning_notes_wear_log_id_idx
  on learning_notes (wear_log_id);

-- spritz_schedules collection slot FKs
create index if not exists spritz_schedules_morning_collection_id_idx
  on spritz_schedules (morning_collection_id);

create index if not exists spritz_schedules_midday_collection_id_idx
  on spritz_schedules (midday_collection_id);

create index if not exists spritz_schedules_evening_collection_id_idx
  on spritz_schedules (evening_collection_id);

create index if not exists spritz_schedules_night_collection_id_idx
  on spritz_schedules (night_collection_id);
