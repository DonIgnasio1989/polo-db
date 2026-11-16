-- ============================================================
-- База Мастера · Supabase schema + RLS + RPC синхронизации
-- Общее: parts, workshops, schemes, votes (правки видны всем).
-- Приватное: garage, logs, settings (только владелец).
-- Идемпотентно: можно выполнять повторно.
-- ============================================================
create extension if not exists pgcrypto;

-- ---------- ОБЩИЕ ТАБЛИЦЫ ----------
create table if not exists public.parts (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  deleted    boolean not null default false,
  owner      uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.workshops (
  id text primary key, data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  owner uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create table if not exists public.schemes (
  id text primary key, data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  owner uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists parts_upd     on public.parts(updated_at);
create index if not exists workshops_upd on public.workshops(updated_at);
create index if not exists schemes_upd   on public.schemes(updated_at);

-- ---------- ПРИВАТНЫЕ ТАБЛИЦЫ ----------
create table if not exists public.garage (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create table if not exists public.logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create table if not exists public.settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists garage_upd   on public.garage(user_id, updated_at);
create index if not exists logs_upd     on public.logs(user_id, updated_at);
create index if not exists settings_upd on public.settings(user_id, updated_at);

-- ---------- ГОЛОСА ЗА АНАЛОГИ ----------
create table if not exists public.votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  dir text not null check (dir in ('ok','bad')),
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
create index if not exists votes_upd on public.votes(updated_at);

-- ---------- updated_at = время СЕРВЕРА + сохранение автора ----------
create or replace function public.bm_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and tg_table_name in ('parts','workshops','schemes') then
    new.owner := old.owner;      -- авторство не перехватывается правкой
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['parts','workshops','schemes','garage','logs','settings','votes'] loop
    execute format('drop trigger if exists bm_touch on public.%I', t);
    execute format('create trigger bm_touch before insert or update on public.%I
                    for each row execute function public.bm_touch()', t);
  end loop;
end $$;

-- ---------- RLS ----------
alter table public.parts     enable row level security;
alter table public.workshops enable row level security;
alter table public.schemes   enable row level security;
alter table public.garage    enable row level security;
alter table public.logs      enable row level security;
alter table public.settings  enable row level security;
alter table public.votes     enable row level security;

-- общий каталог: читают все (в т.ч. анонимно), правят залогиненные
do $$
declare t text;
begin
  foreach t in array array['parts','workshops','schemes'] loop
    execute format('drop policy if exists %I on public.%I', t||'_read', t);
    execute format('create policy %I on public.%I for select using (true)', t||'_read', t);

    execute format('drop policy if exists %I on public.%I', t||'_ins', t);
    execute format('create policy %I on public.%I for insert to authenticated
                    with check (owner = auth.uid())', t||'_ins', t);

    execute format('drop policy if exists %I on public.%I', t||'_upd', t);
    execute format('create policy %I on public.%I for update to authenticated
                    using (true) with check (true)', t||'_upd', t);

    execute format('drop policy if exists %I on public.%I', t||'_del', t);
    execute format('create policy %I on public.%I for delete to authenticated
                    using (owner = auth.uid())', t||'_del', t);
  end loop;
end $$;

-- приватное: только владелец
do $$
declare t text;
begin
  foreach t in array array['garage','logs','settings','votes'] loop
    execute format('drop policy if exists %I on public.%I', t||'_own', t);
    execute format('create policy %I on public.%I for all to authenticated
                    using (user_id = auth.uid()) with check (user_id = auth.uid())', t||'_own', t);
  end loop;
end $$;

grant select on public.parts, public.workshops, public.schemes to anon, authenticated;
grant insert, update, delete on public.parts, public.workshops, public.schemes to authenticated;
grant select, insert, update, delete on public.garage, public.logs, public.settings, public.votes to authenticated;

-- ---------- АГРЕГАТ ГОЛОСОВ (счётчики общие, «мой голос» — свой) ----------
create or replace function public.bm_votes_agg(since timestamptz default 'epoch')
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  changed int;
  out jsonb;
begin
  select count(*) into changed from public.votes where updated_at > since;
  if since > 'epoch'::timestamptz and changed = 0 then
    return null;                       -- нечего отдавать — экономим трафик
  end if;
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into out
  from (
    select v.key as k,
           jsonb_build_object(
             'ok',  count(*) filter (where v.dir = 'ok'),
             'bad', count(*) filter (where v.dir = 'bad'),
             'my',  coalesce((select m.dir from public.votes m
                              where m.user_id = uid and m.key = v.key), '')
           ) as v
    from public.votes v group by v.key
  ) s;
  return out;
end $$;

-- ---------- PULL: один запрос = атомарный снимок всех скоупов ----------
create or replace function public.bm_pull(
  since_shared timestamptz default 'epoch',
  since_priv   timestamptz default 'epoch'
) returns jsonb
language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'ts', now(),
    'parts', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'deleted', p.deleted, 'updatedAt', p.updated_at,
        'data', case when p.deleted then null else p.data end))
      from public.parts p where p.updated_at > since_shared), '[]'::jsonb),
    'workshops', coalesce((select jsonb_agg(jsonb_build_object(
        'id', w.id, 'deleted', w.deleted, 'updatedAt', w.updated_at,
        'data', case when w.deleted then null else w.data end))
      from public.workshops w where w.updated_at > since_shared), '[]'::jsonb),
    'schemes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', s.id, 'deleted', s.deleted, 'updatedAt', s.updated_at,
        'data', case when s.deleted then null else s.data end))
      from public.schemes s where s.updated_at > since_shared), '[]'::jsonb),
    'garage', coalesce((select jsonb_agg(jsonb_build_object(
        'id', g.id, 'deleted', g.deleted, 'updatedAt', g.updated_at,
        'data', case when g.deleted then null else g.data end))
      from public.garage g
      where g.user_id = auth.uid() and g.updated_at > since_priv), '[]'::jsonb),
    'logs', coalesce((select jsonb_agg(jsonb_build_object(
        'id', l.id, 'deleted', l.deleted, 'updatedAt', l.updated_at,
        'data', case when l.deleted then null else l.data end))
      from public.logs l
      where l.user_id = auth.uid() and l.updated_at > since_priv), '[]'::jsonb),
    'settings', coalesce((select jsonb_object_agg(s.key, jsonb_build_object(
        'data', s.data, 'updatedAt', s.updated_at))
      from public.settings s
      where s.user_id = auth.uid() and s.updated_at > since_priv), '{}'::jsonb),
    'votes', public.bm_votes_agg(since_shared)
  );
$$;

grant execute on function public.bm_pull(timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.bm_votes_agg(timestamptz) to anon, authenticated;

-- ---------- REALTIME (мгновенные правки между пользователями) ----------
do $$
declare t text;
begin
  foreach t in array array['parts','workshops','schemes','votes','garage','logs','settings'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;