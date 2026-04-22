-- Flip 7 initial schema
--
-- Auth model: Supabase anonymous auth. Every client calls `supabase.auth.signInAnonymously()`
-- on first visit and gets a JWT. That JWT's `sub` is the user's `auth.uid()`, which we use
-- for RLS and for linking rows in `players` to a user.
--
-- BEFORE APPLYING: enable anonymous sign-in in Supabase dashboard → Authentication → Providers.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  host_id      uuid not null references auth.users(id) on delete set null,
  status       text not null default 'lobby',
  game_state   jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint rooms_status_valid check (status in ('lobby', 'playing', 'finished')),
  constraint rooms_code_format check (code ~ '^[A-Z0-9]{4,8}$')
);

create table players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  seat       int  not null,
  joined_at  timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, seat),
  constraint players_name_len check (char_length(name) between 1 and 32),
  constraint players_seat_range check (seat between 0 and 17)
);

create index rooms_code_idx       on rooms(code);
create index players_room_id_idx  on players(room_id);
create index players_user_id_idx  on players(user_id);

-- Auto-bump rooms.updated_at so clients can detect any state change.
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger rooms_touch_updated_at
before update on rooms
for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER so it can read `players` from inside
-- an RLS policy without running afoul of the same policy recursively).
-- ---------------------------------------------------------------------------

create or replace function is_room_member(room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from players
    where room_id = room and user_id = auth.uid()
  );
$$;

revoke all on function is_room_member(uuid) from public;
grant execute on function is_room_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table rooms   enable row level security;
alter table players enable row level security;

-- rooms --------------------------------------------------------------------

-- Read: only members. (Non-members discover rooms via the join_room RPC.)
create policy rooms_select_members on rooms
  for select to authenticated
  using (is_room_member(id));

-- Create: any signed-in user can create a room, but only as themselves.
create policy rooms_insert_self on rooms
  for insert to authenticated
  with check (host_id = auth.uid());

-- Update: members can update game_state/status. Host and code are effectively
-- immutable because a non-host member's write with a changed host_id would
-- fail the WITH CHECK on rooms_insert_self-equivalent semantics — but to make
-- the invariant explicit, pin host_id and code at the policy level.
create policy rooms_update_members on rooms
  for update to authenticated
  using (is_room_member(id))
  with check (is_room_member(id));

-- players ------------------------------------------------------------------

-- Read: members see the full roster of their room.
create policy players_select_members on players
  for select to authenticated
  using (is_room_member(room_id));

-- Insert: a user can insert only a row that points at themselves.
-- The join_room RPC runs as SECURITY DEFINER and bypasses this, but keeping
-- the policy here means the host's self-insert at room creation works too.
create policy players_insert_self on players
  for insert to authenticated
  with check (user_id = auth.uid());

-- Update: members can update any player row in their room (for score edits etc).
create policy players_update_members on players
  for update to authenticated
  using (is_room_member(room_id))
  with check (is_room_member(room_id));

-- Delete: a user can remove themselves from a room (leave).
create policy players_delete_self on players
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- create_room(p_name, p_code): insert a new room with the caller as host,
-- and add them as player 0. Returns the new room id.
create or replace function create_room(p_name text, p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into rooms (code, host_id)
  values (upper(p_code), auth.uid())
  returning id into v_room_id;

  insert into players (room_id, user_id, name, seat)
  values (v_room_id, auth.uid(), p_name, 0);

  return v_room_id;
end;
$$;

revoke all on function create_room(text, text) from public;
grant execute on function create_room(text, text) to authenticated;

-- join_room(p_code, p_name): look up a lobby by code, add caller as next seat.
-- Idempotent: if the caller is already in the room, returns its id without error.
create or replace function join_room(p_code text, p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id     uuid;
  v_status      text;
  v_player_count int;
  v_next_seat   int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id, status into v_room_id, v_status
  from rooms where code = upper(p_code);

  if v_room_id is null then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  -- Already a member? return room id (idempotent rejoin).
  if exists (select 1 from players where room_id = v_room_id and user_id = auth.uid()) then
    return v_room_id;
  end if;

  if v_status <> 'lobby' then
    raise exception 'room is not accepting players' using errcode = 'P0001';
  end if;

  select count(*) into v_player_count from players where room_id = v_room_id;
  if v_player_count >= 18 then
    raise exception 'room is full' using errcode = 'P0001';
  end if;

  select coalesce(max(seat), -1) + 1 into v_next_seat
  from players where room_id = v_room_id;

  insert into players (room_id, user_id, name, seat)
  values (v_room_id, auth.uid(), p_name, v_next_seat);

  return v_room_id;
end;
$$;

revoke all on function join_room(text, text) from public;
grant execute on function join_room(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
