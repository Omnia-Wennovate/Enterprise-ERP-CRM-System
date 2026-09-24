-- Create tasks table
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null default '',
  status        text not null default 'to_do'
                  check (status in ('to_do','in_progress','completed','cancelled')),
  priority      text not null default 'medium'
                  check (priority in ('low','medium','high','urgent')),
  assigned_to   uuid references public.profiles(id) on delete set null,
  assigned_to_name text not null default '',
  due_date      date not null,
  completed_at  timestamptz,
  related_to    text,
  related_to_type text check (related_to_type in ('lead','customer','quotation')),
  is_reminder_set boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);
create index if not exists tasks_created_by_idx  on public.tasks (created_by);

-- Enable RLS
alter table public.tasks enable row level security;

-- Users can see tasks assigned to them OR created by them
create policy "tasks_select" on public.tasks
  for select using (
    auth.uid() = assigned_to or auth.uid() = created_by
  );

-- Users can insert tasks (they become the creator)
create policy "tasks_insert" on public.tasks
  for insert with check (auth.uid() = created_by);

-- Users can update tasks assigned to them or created by them
create policy "tasks_update" on public.tasks
  for update using (
    auth.uid() = assigned_to or auth.uid() = created_by
  );

-- Users can delete tasks they created
create policy "tasks_delete" on public.tasks
  for delete using (auth.uid() = created_by);

-- Auto-update updated_at
create or replace function public.handle_tasks_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_tasks_update on public.tasks;
create trigger on_tasks_update
  before update on public.tasks
  for each row execute procedure public.handle_tasks_updated_at();
