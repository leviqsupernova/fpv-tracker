-- FRESH INSTALL
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table drones (
  id text primary key,
  serial text unique not null,
  prefix text,
  unit int,
  handler text,
  checklist_steps jsonb not null default '[]',
  checklist jsonb not null default '{}',
  faults jsonb not null default '[]',
  status text,                      -- null = automatic (from checklist). 'NONE' | 'READY' | 'REPAIR' = manually set.
  history jsonb not null default '[]',
  repair_flags jsonb not null default '{}', -- per-step "needs attention" marker, set by right-clicking a checklist row
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row-level security is on by default once enabled below; without a
-- policy, that blocks everyone, including the app. This policy allows
-- full read/write through the anon key — fine for a small trusted team
-- with no login system. If you later add real user accounts, replace
-- this with a policy scoped to authenticated users.
alter table drones enable row level security;

create policy "allow all for anon"
  on drones
  for all
  to anon
  using (true)
  with check (true);

-- Turns on live push updates (INSERT/UPDATE/DELETE) to every connected
-- browser — this is what makes teammates' changes show up without
-- anyone refreshing.
alter publication supabase_realtime add table drones;

-- MIGRATION — run this instead if the `drones` table already exists
-- (e.g. from before the checklist-flag feature): adds the column
-- without touching existing rows.
--   alter table drones add column if not exists repair_flags jsonb not null default '{}';

-- Shared app settings (currently just the editable handler list). The
-- app creates the 'handlers' row itself on first connect — but this
-- table has to exist first for that to work and for edits to sync
-- across the team, rather than silently falling back to the default.
create table app_settings (
  key text primary key,
  value jsonb not null default '[]'
);
alter table app_settings enable row level security;
create policy "allow all for anon" on app_settings for all to anon using (true) with check (true);
