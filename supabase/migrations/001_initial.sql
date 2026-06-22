-- AI Vid Creator — Initial Schema
-- Paste into Supabase SQL Editor and click Run

-- ── Users ──────────────────────────────────────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- ── Projects ───────────────────────────────────────────────
create table if not exists public.projects (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.users(id) on delete cascade,
  title            text        not null default 'Untitled Project',
  status           text        not null default 'script-ready',
  prompt           text,
  script_text      text,
  audio_url        text,
  video_url        text,
  voice_id         text,
  avatar_id        text,
  duration_seconds integer,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.projects enable row level security;

drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

-- ── API Keys (one global row) ──────────────────────────────
create table if not exists public.api_keys (
  id             integer primary key default 1,
  nvidia_key     text,
  elevenlabs_key text,
  heygen_key     text,
  updated_at     timestamptz default now(),
  constraint single_row check (id = 1)
);

alter table public.api_keys enable row level security;

drop policy if exists "Authenticated users can read api_keys" on public.api_keys;
create policy "Authenticated users can read api_keys" on public.api_keys
  for select to authenticated using (true);
