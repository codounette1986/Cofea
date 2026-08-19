create table if not exists public.app_sync_meta (
  id text primary key,
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  name text,
  role text,
  pages jsonb,
  sections jsonb,
  note text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.fields (
  id text primary key,
  name text,
  crop text,
  active boolean,
  area numeric(8, 3),
  stage text,
  health integer,
  mode text,
  field_update text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  title text,
  field text,
  owner text,
  due date,
  status text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_task_templates (
  id text primary key,
  title text,
  crops jsonb,
  modes jsonb,
  note text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.harvests (
  id text primary key,
  date date,
  field text,
  crop text,
  quantity numeric(12, 3),
  unit text,
  quality text,
  destination text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.crops (
  id text primary key,
  name text,
  active boolean,
  family text,
  cycle text,
  water text,
  spacing text,
  notes text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.stock (
  id text primary key,
  item text,
  category text,
  quantity numeric(12, 3),
  unit text,
  threshold numeric(12, 3),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.finance (
  id text primary key,
  date date,
  label text,
  crop text,
  type text,
  amount numeric(14, 2),
  is_sale boolean,
  sale_quantity numeric(12, 3),
  sale_price numeric(14, 2),
  sale_unit text,
  sale_kg_equivalent numeric(12, 3),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.team (
  id text primary key,
  name text,
  role text,
  phone text,
  profile_id text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_accounts (
  id text primary key,
  team_id text,
  login text unique,
  password text,
  profile_id text,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists pages jsonb;
alter table public.profiles add column if not exists sections jsonb;
alter table public.profiles add column if not exists note text;
alter table public.profiles add column if not exists updated_by text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.fields add column if not exists name text;
alter table public.fields add column if not exists crop text;
alter table public.fields add column if not exists active boolean;
alter table public.fields add column if not exists area numeric(8, 3);
alter table public.fields add column if not exists stage text;
alter table public.fields add column if not exists health integer;
alter table public.fields add column if not exists mode text;
alter table public.fields add column if not exists field_update text;
alter table public.fields add column if not exists updated_by text;
alter table public.fields add column if not exists updated_at timestamptz not null default now();

alter table public.tasks add column if not exists title text;
alter table public.tasks add column if not exists field text;
alter table public.tasks add column if not exists owner text;
alter table public.tasks add column if not exists due date;
alter table public.tasks add column if not exists status text;
alter table public.tasks add column if not exists updated_by text;
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

alter table public.daily_task_templates add column if not exists title text;
alter table public.daily_task_templates add column if not exists crops jsonb;
alter table public.daily_task_templates add column if not exists modes jsonb;
alter table public.daily_task_templates add column if not exists note text;
alter table public.daily_task_templates add column if not exists updated_by text;
alter table public.daily_task_templates add column if not exists updated_at timestamptz not null default now();

alter table public.harvests add column if not exists date date;
alter table public.harvests add column if not exists field text;
alter table public.harvests add column if not exists crop text;
alter table public.harvests add column if not exists quantity numeric(12, 3);
alter table public.harvests add column if not exists unit text;
alter table public.harvests add column if not exists quality text;
alter table public.harvests add column if not exists destination text;
alter table public.harvests add column if not exists updated_by text;
alter table public.harvests add column if not exists updated_at timestamptz not null default now();

alter table public.crops add column if not exists name text;
alter table public.crops add column if not exists active boolean;
alter table public.crops add column if not exists family text;
alter table public.crops add column if not exists cycle text;
alter table public.crops add column if not exists water text;
alter table public.crops add column if not exists spacing text;
alter table public.crops add column if not exists notes text;
alter table public.crops add column if not exists updated_by text;
alter table public.crops add column if not exists updated_at timestamptz not null default now();

alter table public.stock add column if not exists item text;
alter table public.stock add column if not exists category text;
alter table public.stock add column if not exists quantity numeric(12, 3);
alter table public.stock add column if not exists unit text;
alter table public.stock add column if not exists threshold numeric(12, 3);
alter table public.stock add column if not exists updated_by text;
alter table public.stock add column if not exists updated_at timestamptz not null default now();

alter table public.finance add column if not exists date date;
alter table public.finance add column if not exists label text;
alter table public.finance add column if not exists crop text;
alter table public.finance add column if not exists type text;
alter table public.finance add column if not exists amount numeric(14, 2);
alter table public.finance add column if not exists is_sale boolean;
alter table public.finance add column if not exists sale_quantity numeric(12, 3);
alter table public.finance add column if not exists sale_price numeric(14, 2);
alter table public.finance add column if not exists sale_unit text;
alter table public.finance add column if not exists sale_kg_equivalent numeric(12, 3);
alter table public.finance add column if not exists updated_by text;
alter table public.finance add column if not exists updated_at timestamptz not null default now();

alter table public.team add column if not exists name text;
alter table public.team add column if not exists role text;
alter table public.team add column if not exists phone text;
alter table public.team add column if not exists profile_id text;
alter table public.team add column if not exists updated_by text;
alter table public.team add column if not exists updated_at timestamptz not null default now();

alter table public.user_accounts add column if not exists team_id text;
alter table public.user_accounts add column if not exists login text;
alter table public.user_accounts add column if not exists password text;
alter table public.user_accounts add column if not exists profile_id text;
alter table public.user_accounts add column if not exists updated_by text;
alter table public.user_accounts add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'data') then
    update public.profiles set
      name = coalesce(name, data->>'name'),
      role = coalesce(role, data->>'role'),
      pages = coalesce(pages, data->'pages'),
      sections = coalesce(sections, data->'sections'),
      note = coalesce(note, data->>'note'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fields' and column_name = 'data') then
    update public.fields set
      name = coalesce(name, data->>'name'),
      crop = coalesce(crop, data->>'crop'),
      active = coalesce(active, nullif(data->>'active', '')::boolean),
      area = coalesce(area, nullif(data->>'area', '')::numeric),
      stage = coalesce(stage, data->>'stage'),
      health = coalesce(health, nullif(data->>'health', '')::integer),
      mode = coalesce(mode, data->>'mode'),
      field_update = coalesce(field_update, data->>'update'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tasks' and column_name = 'data') then
    update public.tasks set
      title = coalesce(title, data->>'title'),
      field = coalesce(field, data->>'field'),
      owner = coalesce(owner, data->>'owner'),
      due = coalesce(due, nullif(data->>'due', '')::date),
      status = coalesce(status, data->>'status'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_task_templates' and column_name = 'data') then
    update public.daily_task_templates set
      title = coalesce(title, data->>'title'),
      crops = coalesce(crops, data->'crops'),
      modes = coalesce(modes, data->'modes'),
      note = coalesce(note, data->>'note'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'harvests' and column_name = 'data') then
    update public.harvests set
      date = coalesce(date, nullif(data->>'date', '')::date),
      field = coalesce(field, data->>'field'),
      crop = coalesce(crop, data->>'crop'),
      quantity = coalesce(quantity, nullif(data->>'quantity', '')::numeric),
      unit = coalesce(unit, data->>'unit'),
      quality = coalesce(quality, data->>'quality'),
      destination = coalesce(destination, data->>'destination'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'crops' and column_name = 'data') then
    update public.crops set
      name = coalesce(name, data->>'name'),
      active = coalesce(active, nullif(data->>'active', '')::boolean),
      family = coalesce(family, data->>'family'),
      cycle = coalesce(cycle, data->>'cycle'),
      water = coalesce(water, data->>'water'),
      spacing = coalesce(spacing, data->>'spacing'),
      notes = coalesce(notes, data->>'notes'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'stock' and column_name = 'data') then
    update public.stock set
      item = coalesce(item, data->>'item'),
      category = coalesce(category, data->>'category'),
      quantity = coalesce(quantity, nullif(data->>'quantity', '')::numeric),
      unit = coalesce(unit, data->>'unit'),
      threshold = coalesce(threshold, nullif(data->>'threshold', '')::numeric),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'finance' and column_name = 'data') then
    update public.finance set
      date = coalesce(date, nullif(data->>'date', '')::date),
      label = coalesce(label, data->>'label'),
      crop = coalesce(crop, data->>'crop'),
      type = coalesce(type, data->>'type'),
      amount = coalesce(amount, nullif(data->>'amount', '')::numeric),
      is_sale = coalesce(is_sale, coalesce(nullif(data->>'isSale', ''), 'false') <> 'false'),
      sale_quantity = coalesce(sale_quantity, nullif(data->>'saleQuantity', '')::numeric),
      sale_price = coalesce(sale_price, nullif(data->>'salePrice', '')::numeric),
      sale_unit = coalesce(sale_unit, data->>'saleUnit'),
      sale_kg_equivalent = coalesce(sale_kg_equivalent, nullif(data->>'saleKgEquivalent', '')::numeric),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'team' and column_name = 'data') then
    update public.team set
      name = coalesce(name, data->>'name'),
      role = coalesce(role, data->>'role'),
      phone = coalesce(phone, data->>'phone'),
      profile_id = coalesce(profile_id, data->>'profileId'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;

  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_accounts' and column_name = 'data') then
    update public.user_accounts set
      team_id = coalesce(team_id, data->>'teamId'),
      login = coalesce(login, data->>'login'),
      password = coalesce(password, data->>'password'),
      profile_id = coalesce(profile_id, data->>'profileId'),
      updated_by = coalesce(updated_by, data->>'updatedBy');
  end if;
end $$;

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

insert into public.profiles (id, name, role, pages, sections, note, updated_by, updated_at)
values (
  'admin-profile',
  'Admins',
  'Admin',
  null,
  null,
  'Accès complet à toute l''application.',
  'Système',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  pages = excluded.pages,
  sections = excluded.sections,
  note = excluded.note,
  updated_by = coalesce(public.profiles.updated_by, excluded.updated_by),
  updated_at = excluded.updated_at;

insert into public.team (id, name, role, phone, profile_id, updated_by, updated_at)
values (
  'admin-user',
  'Administrateur',
  'Admin',
  '',
  'admin-profile',
  'Système',
  now()
)
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  phone = excluded.phone,
  profile_id = excluded.profile_id,
  updated_by = coalesce(public.team.updated_by, excluded.updated_by),
  updated_at = excluded.updated_at;

insert into public.user_accounts (id, team_id, login, password, profile_id, updated_by, updated_at)
values (
  'admin-user',
  'admin-user',
  'admin',
  coalesce((select password from public.user_accounts where id = 'admin-user'), 'admin123'),
  'admin-profile',
  'Système',
  now()
)
on conflict (id) do update set
  team_id = excluded.team_id,
  login = excluded.login,
  password = public.user_accounts.password,
  profile_id = excluded.profile_id,
  updated_by = coalesce(public.user_accounts.updated_by, excluded.updated_by),
  updated_at = excluded.updated_at;

insert into public.app_sync_meta (id, updated_at)
values ('agripilot-main', now())
on conflict (id) do update set updated_at = excluded.updated_at;

notify pgrst, 'reload schema';
