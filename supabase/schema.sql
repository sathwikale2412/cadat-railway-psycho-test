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

create policy "own cadat results" on public.cadat_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cadat batteries" on public.cadat_batteries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cadat logins read" on public.cadat_logins
  for select using (auth.uid() = user_id);

create policy "own cadat logins insert" on public.cadat_logins
  for insert with check (auth.uid() = user_id);
