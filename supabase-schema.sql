-- ============================================================
-- MediaTracker — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- 2. Media Items
create table if not exists media_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('movie', 'tv_show', 'music', 'game', 'book')),
  title text not null,
  creator text,
  release_date text,
  genre text,
  platform text,
  status text not null default 'owned' check (status in ('owned', 'wishlist', 'currently_using', 'completed')),
  rating integer check (rating >= 1 and rating <= 5),
  cover_image_url text,
  notes text,
  ai_summary text,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Tags
create table if not exists tags (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  unique(user_id, name)
);

-- 4. Media Tags (join table)
create table if not exists media_tags (
  media_item_id uuid references media_items(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (media_item_id, tag_id)
);

-- 5. Chat Sessions
create table if not exists chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default 'New Chat',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = ''
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data ->> 'username',
    split_part(new.email, '@', 1)
  );
  final_username := base_username;

  -- Handle duplicate usernames by appending a number
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists media_items_updated_at on media_items;
create trigger media_items_updated_at
  before update on media_items
  for each row execute function public.update_updated_at();

drop trigger if exists chat_sessions_updated_at on chat_sessions;
create trigger chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function public.update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table media_items enable row level security;
alter table tags enable row level security;
alter table media_tags enable row level security;
alter table chat_sessions enable row level security;

-- Profiles: own CRUD + public read
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Public profiles are viewable" on profiles
  for select using (is_public = true);

-- Media items: own CRUD
create policy "Users can view own media" on media_items
  for select using (auth.uid() = user_id);

create policy "Users can insert own media" on media_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update own media" on media_items
  for update using (auth.uid() = user_id);

create policy "Users can delete own media" on media_items
  for delete using (auth.uid() = user_id);

-- Media items: public read via public profiles
create policy "Public media is viewable" on media_items
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = media_items.user_id
      and profiles.is_public = true
    )
  );

-- Tags: own access
create policy "Users can manage own tags" on tags
  for all using (auth.uid() = user_id);

-- Media tags: own access via media ownership
create policy "Users can manage own media tags" on media_tags
  for all using (
    exists (
      select 1 from media_items
      where media_items.id = media_tags.media_item_id
      and media_items.user_id = auth.uid()
    )
  );

-- Public media tags readable
create policy "Public media tags are viewable" on media_tags
  for select using (
    exists (
      select 1 from media_items
      join profiles on profiles.id = media_items.user_id
      where media_items.id = media_tags.media_item_id
      and profiles.is_public = true
    )
  );

-- Public tags readable
create policy "Public tags are viewable" on tags
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = tags.user_id
      and profiles.is_public = true
    )
  );

-- Chat sessions: own access only
create policy "Users can view own chats" on chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own chats" on chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own chats" on chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete own chats" on chat_sessions
  for delete using (auth.uid() = user_id);
