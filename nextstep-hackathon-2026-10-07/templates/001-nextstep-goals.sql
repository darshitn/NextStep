-- DRAFT: review before applying to the dedicated Supabase project.
-- Creates a new table only; fails and rolls back if it already exists.
-- Do not drop an existing table to rerun this file.
-- Migration creation does NOT mean remote SQL has been executed.
begin;

create table public.nextstep_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creation_request_id uuid not null,
  version integer not null default 1 check (version >= 1),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nextstep_one_goal_per_owner unique (owner_id)
);

alter table public.nextstep_goals enable row level security;
revoke all on public.nextstep_goals from public, anon, authenticated;
grant select, insert, update on public.nextstep_goals to authenticated;

create policy nextstep_read_own on public.nextstep_goals
  for select to authenticated using ((select auth.uid()) = owner_id);

create policy nextstep_insert_own on public.nextstep_goals
  for insert to authenticated with check ((select auth.uid()) = owner_id);

create policy nextstep_update_own on public.nextstep_goals
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

commit;
