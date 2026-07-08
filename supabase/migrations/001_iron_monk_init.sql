-- IRON MONK — initieel schema (reeds toegepast op project lxrnubswclcufovsidpa als migration `iron_monk_init`)
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Krijger',
  xp integer not null default 0,
  current_phase integer not null default 1,
  injured_side text not null default 'R',
  departure_date date,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.iron_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists iron_on_auth_user_created on auth.users;
create trigger iron_on_auth_user_created
  after insert on auth.users
  for each row execute function public.iron_handle_new_user();

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric, sleep_hours numeric, sleep_quality integer, rhr integer,
  mood integer, energy integer, ankle_pain integer, ankle_stability integer,
  water_l numeric, steps integer, meditation_min integer not null default 0,
  training_types text[] not null default '{}', nutrition_score integer, notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.daily_checkins enable row level security;
create policy "checkins_own" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index daily_checkins_user_date on public.daily_checkins (user_id, date desc);

create table public.ankle_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_date date not null,
  figure8_l numeric, figure8_r numeric, ktw_l numeric, ktw_r numeric,
  balance_l integer, balance_r integer, heel_raises_l integer, heel_raises_r integer,
  pain_week integer, instability integer, phase integer, notes text,
  created_at timestamptz not null default now(),
  unique (user_id, week_date)
);
alter table public.ankle_checks enable row level security;
create policy "ankle_own" on public.ankle_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_key text not null, side text, value numeric not null,
  tested_at date not null default current_date, notes text,
  created_at timestamptz not null default now()
);
alter table public.test_results enable row level security;
create policy "tests_own" on public.test_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index test_results_user_key on public.test_results (user_id, test_key, tested_at);

create table public.criteria_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phase integer not null, criterion_key text not null,
  met boolean not null default false, met_at timestamptz,
  unique (user_id, phase, criterion_key)
);
alter table public.criteria_state enable row level security;
create policy "criteria_own" on public.criteria_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null, amount integer not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.xp_events enable row level security;
create policy "xp_own" on public.xp_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.coach_messages enable row level security;
create policy "coach_own" on public.coach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index coach_messages_user_time on public.coach_messages (user_id, created_at);

insert into storage.buckets (id, name, public) values ('media','media', false)
on conflict (id) do nothing;

create policy "media_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
