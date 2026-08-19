create table if not exists public.app_sync_meta (
  id text primary key,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.fields (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_task_templates (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.harvests (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.crops (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.stock (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.finance (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.team (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_accounts (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_sync_meta',
    'profiles',
    'fields',
    'tasks',
    'daily_task_templates',
    'harvests',
    'crops',
    'stock',
    'finance',
    'team',
    'user_accounts'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format('drop policy if exists "AgriPilot read" on public.%I', table_name);
    execute format('create policy "AgriPilot read" on public.%I for select using (true)', table_name);

    execute format('drop policy if exists "AgriPilot insert" on public.%I', table_name);
    execute format('create policy "AgriPilot insert" on public.%I for insert with check (true)', table_name);

    execute format('drop policy if exists "AgriPilot update" on public.%I', table_name);
    execute format('create policy "AgriPilot update" on public.%I for update using (true) with check (true)', table_name);

    execute format('drop policy if exists "AgriPilot delete" on public.%I', table_name);
    execute format('create policy "AgriPilot delete" on public.%I for delete using (true)', table_name);
  end loop;
end $$;

insert into public.profiles (id, data, updated_at)
values (
  'admin-profile',
  '{"id":"admin-profile","name":"Admins","role":"Admin","note":"Accès complet à toute l''application."}'::jsonb,
  now()
)
on conflict (id) do update set
  data = excluded.data,
  updated_at = excluded.updated_at;

insert into public.team (id, data, updated_at)
values (
  'admin-user',
  '{"id":"admin-user","name":"Administrateur","role":"Admin","phone":"","profileId":"admin-profile"}'::jsonb,
  now()
)
on conflict (id) do update set
  data = excluded.data,
  updated_at = excluded.updated_at;

insert into public.user_accounts (id, data, updated_at)
values (
  'admin-user',
  '{"id":"admin-user","teamId":"admin-user","login":"admin","password":"admin123","profileId":"admin-profile"}'::jsonb,
  now()
)
on conflict (id) do update set
  data = excluded.data,
  updated_at = excluded.updated_at;

insert into public.app_sync_meta (id, updated_at)
values ('agripilot-main', now())
on conflict (id) do update set updated_at = excluded.updated_at;
