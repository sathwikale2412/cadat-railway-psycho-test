-- CADAT Psycho Test Simulator — make recorded results permanent
-- Paste into Supabase -> SQL Editor for the shared project and run. Safe to re-run.
--
-- Two problems with the schema as shipped:
--   1. "own cadat results" / "own cadat batteries" are `for all` policies, so a signed-in
--      user can UPDATE or DELETE their own practice attempts. src/lib/cloud.ts only ever
--      inserts and selects, so that capability is pure exposure: a T-score can be quietly
--      rewritten or erased after the fact.
--   2. cadat_logins.logged_at defaults to now(), but a default only applies when the
--      client leaves the column out, so a sign-in row can be back-dated.
--
-- `completed_at` is deliberately NOT stamped by the database. CADAT records the moment the
-- attempt ended on the device (cloud.ts:17 sends it) and syncs offline attempts later, so
-- forcing now() would replace real completion times with sync times. The append-only policy
-- above is what protects those rows: they can still be inserted with a wrong time, but no
-- longer edited or deleted once they exist.

drop policy if exists "own cadat results" on public.cadat_results;
drop policy if exists "own cadat results read" on public.cadat_results;
drop policy if exists "own cadat results insert" on public.cadat_results;

create policy "own cadat results read" on public.cadat_results
  for select using (auth.uid() = user_id);

create policy "own cadat results insert" on public.cadat_results
  for insert with check (auth.uid() = user_id);

drop policy if exists "own cadat batteries" on public.cadat_batteries;
drop policy if exists "own cadat batteries read" on public.cadat_batteries;
drop policy if exists "own cadat batteries insert" on public.cadat_batteries;

create policy "own cadat batteries read" on public.cadat_batteries
  for select using (auth.uid() = user_id);

create policy "own cadat batteries insert" on public.cadat_batteries
  for insert with check (auth.uid() = user_id);

create or replace function public.cadat_force_login_time()
returns trigger
language plpgsql
as $$
begin
  new.logged_at := now();
  return new;
end;
$$;

drop trigger if exists cadat_logins_force_time on public.cadat_logins;
create trigger cadat_logins_force_time
  before insert on public.cadat_logins
  for each row execute function public.cadat_force_login_time();
