-- Migration: 001-nextstep-goals.sql
-- Review before applying in the Supabase SQL Editor.
-- Creates nextstep_goals table with RLS and owner policies.
-- Does not drop existing tables.

begin;

create table if not exists public.nextstep_goals (
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

-- Policies: drop existing if any, then create
drop policy if exists nextstep_read_own on public.nextstep_goals;
create policy nextstep_read_own on public.nextstep_goals
  for select to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists nextstep_insert_own on public.nextstep_goals;
create policy nextstep_insert_own on public.nextstep_goals
  for insert to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists nextstep_update_own on public.nextstep_goals;
create policy nextstep_update_own on public.nextstep_goals
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

commit;
