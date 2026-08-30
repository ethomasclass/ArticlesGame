-- =====================================================================
--  THE CONFEDERATION PROBLEM — Supabase setup
--  Paste this whole file into the Supabase SQL Editor and press Run.
--  It is safe to run twice.
-- =====================================================================

-- ---------------------------------------------------------------- tables
create table if not exists aoc_games (
  code        text primary key,
  data        jsonb       not null,
  updated_at  timestamptz not null default now()
);

create table if not exists aoc_states (
  code        text        not null,
  name        text        not null,
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  primary key (code, name)
);

-- Deals get their own rows rather than an array inside the game document.
-- Several groups send offers at the same moment, and appending to a shared
-- array from twelve laptops loses some of them.
create table if not exists aoc_deals (
  id          bigserial primary key,
  code        text        not null,
  data        jsonb       not null,
  updated_at  timestamptz not null default now()
);
create index if not exists aoc_deals_code_idx on aoc_deals (code);

-- ------------------------------------------------------------ permissions
-- Students are not signed in: they type a 4-letter code the teacher reads
-- off the board, so these tables have to be reachable without a login.
-- What lives here is state names, votes, and the first names students type.
-- Nothing else. No emails, no student IDs, no grades.
alter table aoc_games  enable row level security;
alter table aoc_states enable row level security;
alter table aoc_deals  enable row level security;

drop policy if exists aoc_open on aoc_games;
drop policy if exists aoc_open on aoc_states;
drop policy if exists aoc_open on aoc_deals;
create policy aoc_open on aoc_games  for all using (true) with check (true);
create policy aoc_open on aoc_states for all using (true) with check (true);
create policy aoc_open on aoc_deals  for all using (true) with check (true);

grant all on aoc_games, aoc_states, aoc_deals to anon;
grant usage, select on sequence aoc_deals_id_seq to anon;

-- ------------------------------------------------------------- create
create or replace function aoc_create_game(p_code text, p_game jsonb, p_states jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare s jsonb;
begin
  insert into aoc_games (code, data) values (p_code, p_game);
  for s in select * from jsonb_array_elements(p_states) loop
    insert into aoc_states (code, name, data) values (p_code, s->>'name', s);
  end loop;
  return p_code;
end $$;

-- ------------------------------------------------------------- patching
-- Patch keys may be dot paths ("votes.2"), matching how the game writes a
-- single round without disturbing the others. Rows are locked while they are
-- read and rewritten, so two writers cannot clobber each other.
create or replace function aoc_patch_game(p_code text, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text; v jsonb; d jsonb;
begin
  select data into d from aoc_games where code = p_code for update;
  if d is null then return null; end if;
  for k, v in select * from jsonb_each(p_patch) loop
    d := jsonb_set(d, string_to_array(k, '.'), v, true);
  end loop;
  update aoc_games set data = d, updated_at = now() where code = p_code;
  return d;
end $$;

create or replace function aoc_patch_state(p_code text, p_name text, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text; v jsonb; d jsonb;
begin
  select data into d from aoc_states where code = p_code and name = p_name for update;
  if d is null then return null; end if;
  for k, v in select * from jsonb_each(p_patch) loop
    d := jsonb_set(d, string_to_array(k, '.'), v, true);
  end loop;
  update aoc_states set data = d, updated_at = now()
   where code = p_code and name = p_name;
  return d;
end $$;

-- One call for the whole board: bot votes, payouts, score updates.
create or replace function aoc_patch_states(p_code text, p_updates jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare u jsonb;
begin
  for u in select * from jsonb_array_elements(p_updates) loop
    perform aoc_patch_state(p_code, u->>'name', u->'patch');
  end loop;
end $$;

-- --------------------------------------------------------------- deals
create or replace function aoc_push_deal(p_code text, p_deal jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into aoc_deals (code, data) values (p_code, p_deal);
end $$;

-- The teacher's machine answers pending offers and writes the replies back.
create or replace function aoc_replace_deals(p_code text, p_deals jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare d jsonb;
begin
  delete from aoc_deals where code = p_code;
  for d in select * from jsonb_array_elements(p_deals) loop
    insert into aoc_deals (code, data) values (p_code, d);
  end loop;
end $$;

-- ------------------------------------------------------------ reading
-- One call returns the entire session, so a laptop makes one request
-- instead of three.
create or replace function aoc_snapshot(p_code text)
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'game',   (select data from aoc_games where code = p_code),
    'states', coalesce((select jsonb_agg(data order by name) from aoc_states where code = p_code), '[]'::jsonb),
    'deals',  coalesce((select jsonb_agg(data order by id)   from aoc_deals  where code = p_code), '[]'::jsonb)
  );
$$;

-- A few bytes that change whenever anything in the session changes. Clients
-- poll this and only fetch the full snapshot when it moves, which keeps a
-- class of thirteen laptops off the bandwidth allowance.
create or replace function aoc_pulse(p_code text)
returns text language sql security definer set search_path = public stable as $$
  select coalesce(
    (select max(t)::text || ':' || sum(n)::text from (
      select max(updated_at) t, count(*) n from aoc_games  where code = p_code
      union all
      select max(updated_at) t, count(*) n from aoc_states where code = p_code
      union all
      select max(updated_at) t, count(*) n from aoc_deals  where code = p_code
    ) x), 'empty');
$$;

grant execute on function
  aoc_create_game(text, jsonb, jsonb),
  aoc_patch_game(text, jsonb),
  aoc_patch_state(text, text, jsonb),
  aoc_patch_states(text, jsonb),
  aoc_push_deal(text, jsonb),
  aoc_replace_deals(text, jsonb),
  aoc_snapshot(text),
  aoc_pulse(text)
to anon;

-- ------------------------------------------------------------- cleanup
-- Old class periods pile up. Run this whenever you feel like it.
create or replace function aoc_purge_older_than(p_days int default 30)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from aoc_deals  where updated_at < now() - (p_days || ' days')::interval;
  delete from aoc_states where updated_at < now() - (p_days || ' days')::interval;
  delete from aoc_games  where updated_at < now() - (p_days || ' days')::interval;
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function aoc_purge_older_than(int) to anon;
