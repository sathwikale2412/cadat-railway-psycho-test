-- CADAT Psycho Test Simulator — Supabase schema
-- Run once in the Supabase SQL editor of the same project used by Day to Day Activity,
-- so a single account signs you in to both apps.
--
-- Stores every practice attempt and full-battery report against the signed-in user,
-- plus a sign-in log so you can show which accounts logged in and when.

create extension if not exists "pgcrypto";

-- One row per practice attempt of a single sub-test.
create table if not exists public.cadat_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  test_id text not null,
  test_name text not null,
  t_score numeric not null default 0,
  is_qualified boolean not null default false,
  completed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

-- One row per completed 5-test mock battery.
create table if not exists public.cadat_batteries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  battery_id text not null,
  average_t_score numeric not null default 0,
  overall_qualified boolean not null default false,
  completed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

-- Sign-in log: every time an account authenticates into this app.
create table if not exists public.cadat_logins (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  email text not null default '',
  logged_at timestamptz not null default now()
);

create index if not exists cadat_results_user_idx on public.cadat_results (user_id, completed_at desc);
create index if not exists cadat_batteries_user_idx on public.cadat_batteries (user_id, completed_at desc);
create index if not exists cadat_logins_user_idx on public.cadat_logins (user_id, logged_at desc);

-- Row Level Security: a user can only ever read or write their own rows.
alter table public.cadat_results enable row level security;
alter table public.cadat_batteries enable row level security;
alter table public.cadat_logins enable row level security;

create policy "own cadat results read" on public.cadat_results
  for select using (auth.uid() = user_id);

create policy "own cadat results insert" on public.cadat_results
  for insert with check (auth.uid() = user_id);

create policy "own cadat batteries read" on public.cadat_batteries
  for select using (auth.uid() = user_id);

create policy "own cadat batteries insert" on public.cadat_batteries
  for insert with check (auth.uid() = user_id);

create policy "own cadat logins read" on public.cadat_logins
  for select using (auth.uid() = user_id);

create policy "own cadat logins insert" on public.cadat_logins
  for insert with check (auth.uid() = user_id);

-- Append-only: an attempt cannot be edited or erased after it lands. completed_at is left
-- to the client because it records when the attempt ended on the device, not when it synced.
-- The sign-in time is stamped here, since `default now()` above only applies when the
-- client omits the column. See harden-records.sql to apply this to a database that exists.
create or replace function public.cadat_force_login_time()
returns trigger language plpgsql as $$
begin new.logged_at := now(); return new; end;
$$;

create trigger cadat_logins_force_time
  before insert on public.cadat_logins
  for each row execute function public.cadat_force_login_time();
