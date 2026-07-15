-- IRON MONK — gamification fase 2: dagtaken (quest_claims) + wierook (streak-shields).
-- Reeds toegepast op project lxrnubswclcufovsidpa als migration `iron_monk_quests_and_shields`.

-- shield_dates: dagen die door een wierookstok automatisch beschermd zijn (streak-freeze).
alter table public.profiles add column if not exists shield_dates date[] not null default '{}';

-- quest_claims: XP-grootboek voor dagtaken (voorkomt dubbel uitkeren, uniek per taak+dag).
create table if not exists public.quest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_key text not null,
  date date not null,
  xp integer not null default 0,
  claimed_at timestamptz not null default now(),
  unique (user_id, quest_key, date)
);
alter table public.quest_claims enable row level security;
create policy "quest_claims_own" on public.quest_claims
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists quest_claims_user_date on public.quest_claims (user_id, date desc);
