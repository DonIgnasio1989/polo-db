-- ════════════════════════════════════════════════════════════════════
--  «База Мастера» (VW Polo 6N / Caddy) · Облачная синхронизация 1.14.0
--  Supabase: схема БД + RLS-политики + Storage + Realtime
--
--  КАК ПРИМЕНИТЬ: Supabase Dashboard → ваш проект → SQL Editor →
--  New query → вставить весь этот файл → Run.
--  Скрипт идемпотентен (if not exists / or replace) — можно запускать
--  повторно после изменений.
--
--  ВАЖНО: после применения отключите подтверждение email
--  (Authentication → Sign In / Providers → Email → «Confirm email» = OFF) —
--  вход в приложении идёт по нику + паролю, почта не используется.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 0. СЛУЖЕБНЫЕ ФУНКЦИИ
-- ────────────────────────────────────────────────────────────────────

-- updated_at проставляется сервером при каждом UPDATE
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Профиль создаётся автоматически при регистрации (ник приходит
-- из raw_user_meta_data — его передаёт js/cloud.js при signUp)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nick, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nick', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'nick', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────
-- 1. ПРОФИЛИ (ник виден сообществу; остальное — у владельца)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  nick         text not null unique,
  display_name text not null default '',
  city         text not null default '',
  color        text not null default '#00b0f0',
  initials     text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to anon, authenticated using (true);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 2. ЛИЧНЫЕ ДАННЫЕ (KV: гараж, ТО, журнал, покупки, профиль, флаги)
--    ключи: garage | to | logs | shop | profile | pflags
--    Доступ — ТОЛЬКО у владельца строки.
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.user_data (
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_data enable row level security;

drop policy if exists "user_data own" on public.user_data;
create policy "user_data own" on public.user_data
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_data ins own" on public.user_data;
create policy "user_data ins own" on public.user_data
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_data upd own" on public.user_data;
create policy "user_data upd own" on public.user_data
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_data del own" on public.user_data;
create policy "user_data del own" on public.user_data
  for delete to authenticated using (user_id = auth.uid());

drop trigger if exists user_data_updated_at on public.user_data;
create trigger user_data_updated_at before update on public.user_data
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 3. ОБЩИЙ КАТАЛОГ: позиции, добавленные пользователями
--    (всё, чего нет в справочных data/parts-*.json)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.parts_custom (
  id         text primary key,                 -- id позиции из клиента (p_…)
  data       jsonb not null,                   -- объект позиции целиком
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parts_custom enable row level security;

drop policy if exists "parts_custom read" on public.parts_custom;
create policy "parts_custom read" on public.parts_custom
  for select to anon, authenticated using (true);

drop policy if exists "parts_custom ins" on public.parts_custom;
create policy "parts_custom ins" on public.parts_custom
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "parts_custom upd own" on public.parts_custom;
create policy "parts_custom upd own" on public.parts_custom
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "parts_custom del own" on public.parts_custom;
create policy "parts_custom del own" on public.parts_custom
  for delete to authenticated using (created_by = auth.uid());

drop trigger if exists parts_custom_updated_at on public.parts_custom;
create trigger parts_custom_updated_at before update on public.parts_custom
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 4. ОБЩИЙ КАТАЛОГ: правки существующих позиций
--    part_key = lower(oem)|lower(name); data = {notes, price, currency,
--    shopUrl, priceHistory, photos[URL], inst}
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.part_overrides (
  part_key   text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.part_overrides enable row level security;

drop policy if exists "part_overrides read" on public.part_overrides;
create policy "part_overrides read" on public.part_overrides
  for select to anon, authenticated using (true);

-- Правки каталога — «вики-слой»: любой вошедший может дополнить/исправить
-- правку (авторство перезаписывается на текущего пользователя), удалить —
-- только автор последней ревизии.
drop policy if exists "part_overrides write" on public.part_overrides;
create policy "part_overrides write" on public.part_overrides
  for insert to authenticated with check (updated_by = auth.uid());

drop policy if exists "part_overrides upd" on public.part_overrides;
create policy "part_overrides upd" on public.part_overrides
  for update to authenticated using (true) with check (updated_by = auth.uid());

drop policy if exists "part_overrides del" on public.part_overrides;
create policy "part_overrides del" on public.part_overrides
  for delete to authenticated using (updated_by = auth.uid());

drop trigger if exists part_overrides_updated_at on public.part_overrides;
create trigger part_overrides_updated_at before update on public.part_overrides
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 5. ОБЩИЕ СЕРВИСЫ/МАСТЕРСКИЕ, добавленные пользователями
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.workshops_custom (
  id         text primary key,
  data       jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workshops_custom enable row level security;

drop policy if exists "workshops_custom read" on public.workshops_custom;
create policy "workshops_custom read" on public.workshops_custom
  for select to anon, authenticated using (true);

drop policy if exists "workshops_custom ins" on public.workshops_custom;
create policy "workshops_custom ins" on public.workshops_custom
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "workshops_custom upd own" on public.workshops_custom;
create policy "workshops_custom upd own" on public.workshops_custom
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "workshops_custom del own" on public.workshops_custom;
create policy "workshops_custom del own" on public.workshops_custom
  for delete to authenticated using (created_by = auth.uid());

drop trigger if exists workshops_custom_updated_at on public.workshops_custom;
create trigger workshops_custom_updated_at before update on public.workshops_custom
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 6. СХЕМЫ УЗЛОВ: маркеры + ссылки на фото (сами фото — в Storage)
--    key = «категория|подгруппа»
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.schemes (
  key        text primary key,
  marks      jsonb not null default '[]'::jsonb,
  photos     jsonb not null default '[]'::jsonb,   -- массив публичных URL
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.schemes enable row level security;

drop policy if exists "schemes read" on public.schemes;
create policy "schemes read" on public.schemes
  for select to anon, authenticated using (true);

drop policy if exists "schemes write" on public.schemes;
create policy "schemes write" on public.schemes
  for insert to authenticated with check (updated_by = auth.uid());

drop policy if exists "schemes upd" on public.schemes;
create policy "schemes upd" on public.schemes
  for update to authenticated using (true) with check (updated_by = auth.uid());

drop policy if exists "schemes del" on public.schemes;
create policy "schemes del" on public.schemes
  for delete to authenticated using (true);

drop trigger if exists schemes_updated_at on public.schemes;
create trigger schemes_updated_at before update on public.schemes
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 7. ГОЛОСА ЗА АНАЛОГИ: по одной строке на пользователя и ключ
--    value = 'ok' | 'bad'; счётчики агрегирует клиент
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.votes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  vote_key   text not null,
  value      text not null check (value in ('ok', 'bad')),
  updated_at timestamptz not null default now(),
  primary key (user_id, vote_key)
);

create index if not exists votes_key_idx on public.votes (vote_key);

alter table public.votes enable row level security;

drop policy if exists "votes read" on public.votes;
create policy "votes read" on public.votes
  for select to anon, authenticated using (true);

drop policy if exists "votes own write" on public.votes;
create policy "votes own write" on public.votes
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "votes own upd" on public.votes;
create policy "votes own upd" on public.votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "votes own del" on public.votes;
create policy "votes own del" on public.votes
  for delete to authenticated using (user_id = auth.uid());

drop trigger if exists votes_updated_at on public.votes;
create trigger votes_updated_at before update on public.votes
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 8. ОБЩАЯ МЕТА: пользовательские категории и разделы
--    key = 'categories' | 'sec:<id раздела>'
--    для серверных разделов (data/sections.json) хранятся только
--    label/icon/parent — строки таблиц всегда приходят из data-файлов
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.meta_shared (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.meta_shared enable row level security;

drop policy if exists "meta_shared read" on public.meta_shared;
create policy "meta_shared read" on public.meta_shared
  for select to anon, authenticated using (true);

drop policy if exists "meta_shared write" on public.meta_shared;
create policy "meta_shared write" on public.meta_shared
  for insert to authenticated with check (updated_by = auth.uid());

drop policy if exists "meta_shared upd" on public.meta_shared;
create policy "meta_shared upd" on public.meta_shared
  for update to authenticated using (true) with check (updated_by = auth.uid());

drop policy if exists "meta_shared del" on public.meta_shared;
create policy "meta_shared del" on public.meta_shared
  for delete to authenticated using (true);

drop trigger if exists meta_shared_updated_at on public.meta_shared;
create trigger meta_shared_updated_at before update on public.meta_shared
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────
-- 9. STORAGE: публичный бакет для фото (схемы узлов + фото позиций)
--    Чтение — всем по прямой ссылке; запись — только вошедшим.
-- ────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('bm-photos', 'bm-photos', true, 5242880)   -- лимит 5 МБ на файл
on conflict (id) do update set public = true;

drop policy if exists "bm-photos public read" on storage.objects;
create policy "bm-photos public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'bm-photos');

drop policy if exists "bm-photos auth insert" on storage.objects;
create policy "bm-photos auth insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'bm-photos');

drop policy if exists "bm-photos auth update" on storage.objects;
create policy "bm-photos auth update" on storage.objects
  for update to authenticated using (bucket_id = 'bm-photos');

drop policy if exists "bm-photos auth delete" on storage.objects;
create policy "bm-photos auth delete" on storage.objects
  for delete to authenticated using (bucket_id = 'bm-photos');

-- ────────────────────────────────────────────────────────────────────
-- 10. REALTIME: живые обновления общих данных у всех вошедших
-- ────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['parts_custom','part_overrides','workshops_custom','schemes','votes','meta_shared']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
--  Готово. Проверка: Table Editor должен показывать таблицы profiles,
--  user_data, parts_custom, part_overrides, workshops_custom, schemes,
--  votes, meta_shared; Storage → бакет bm-photos (Public).
--  Не забудьте: Auth → Sign In / Providers → Email → Confirm email = OFF.
-- ════════════════════════════════════════════════════════════════════
