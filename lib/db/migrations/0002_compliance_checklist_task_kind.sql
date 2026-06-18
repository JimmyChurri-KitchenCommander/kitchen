-- Phase 5: classify cleaning tasks as cleaning, opening, closing, or equipment checks.
-- Existing rows remain normal cleaning tasks.

alter table public.cleaning_tasks
  add column if not exists task_kind text not null default 'cleaning';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cleaning_tasks_task_kind_check'
      and conrelid = 'public.cleaning_tasks'::regclass
  ) then
    alter table public.cleaning_tasks
      add constraint cleaning_tasks_task_kind_check
      check (task_kind in ('cleaning', 'opening', 'closing', 'equipment'));
  end if;
end $$;
