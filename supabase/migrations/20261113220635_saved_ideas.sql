-- Parents choose which ideas to keep. Every generated idea is still stored
-- (so new ideas can avoid repeating old ones), but only saved ideas form the library.
alter table public.ideas add column saved_at timestamptz;

create index ideas_saved_idx on public.ideas (household_id, saved_at desc)
  where saved_at is not null;
