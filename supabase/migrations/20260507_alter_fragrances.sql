-- Add missing columns to fragrances table
-- gender_profile and layering_role use enums; notes is free text

create type gender_profile as enum ('Men', 'Women', 'Unisex');
create type layering_role  as enum ('Foundation', 'Enhancer', 'Modifier');

alter table fragrances
  add column gender_profile gender_profile,
  add column layering_role  layering_role,
  add column notes          text;
