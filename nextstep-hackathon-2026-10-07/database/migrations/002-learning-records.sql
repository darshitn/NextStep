-- Migration: 002-learning-records.sql
-- Additive migration for DSA learning loop records stored in state JSONB.
-- Completely non-destructive: does not modify columns, constraints or drop data.

begin;

-- Create GIN index on learning key inside state for fast JSONB access if table exists
create index if not exists nextstep_goals_learning_idx
  on public.nextstep_goals using gin ((state -> 'learning'));

comment on index public.nextstep_goals_learning_idx is
  'Accelerates mission learning loop context and understanding assessment queries';

commit;
