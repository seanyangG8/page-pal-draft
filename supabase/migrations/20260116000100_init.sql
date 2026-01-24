-- Page-Pal / Marginalia: initial schema + RLS + storage policies (Supabase)
-- Apply via: supabase db push

-- Extensions
create extension if not exists pgcrypto;

-- =========================
-- Tables
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_is_lowercase check (username is null or username = lower(username))
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  author text not null,
  format text not null check (format in ('physical', 'ebook', 'audiobook')),
  cover_url text,
  isbn text,
  tags text[],
  folder_id uuid references public.folders(id) on delete set null,
  display_order int not null default 0,
  notes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  type text not null check (type in ('quote', 'idea', 'question', 'action')),
  media_type text not null check (media_type in ('text', 'image', 'audio')),
  content text not null,
  image_url text,
  extracted_text text,
  audio_url text,
  audio_duration int,
  transcript text,
  location text,
  timestamp text,
  chapter text,
  context text,
  tags text[],
  ai_summary text,
  ai_expanded text,
  ai_flashcard jsonb check (ai_flashcard is null or (ai_flashcard ? 'question' and ai_flashcard ? 'answer')),
  is_private boolean not null default true,
  review_count int not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  folder_id uuid references public.folders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  note_ids uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  filters jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  note_ids uuid[],
  completed_note_ids uuid[],
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  year int not null,
  yearly_book_target int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year)
);

create table if not exists public.activity_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

-- =========================
-- Triggers
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_folders_updated on public.folders;
create trigger trg_folders_updated
before update on public.folders
for each row execute function public.set_updated_at();

drop trigger if exists trg_books_updated on public.books;
create trigger trg_books_updated
before update on public.books
for each row execute function public.set_updated_at();

drop trigger if exists trg_notes_updated on public.notes;
create trigger trg_notes_updated
before update on public.notes
for each row execute function public.set_updated_at();

drop trigger if exists trg_collections_updated on public.collections;
create trigger trg_collections_updated
before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists trg_reading_goals_updated on public.reading_goals;
create trigger trg_reading_goals_updated
before update on public.reading_goals
for each row execute function public.set_updated_at();

-- Keep books.notes_count in sync
create or replace function public.adjust_notes_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.books
      set notes_count = notes_count + 1
      where id = new.book_id;
  elsif tg_op = 'DELETE' then
    update public.books
      set notes_count = greatest(notes_count - 1, 0)
      where id = old.book_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_notes_count_ins on public.notes;
create trigger trg_notes_count_ins
after insert on public.notes
for each row execute function public.adjust_notes_count();

drop trigger if exists trg_notes_count_del on public.notes;
create trigger trg_notes_count_del
after delete on public.notes
for each row execute function public.adjust_notes_count();

-- Optional: record daily activity on book/note creation
create or replace function public.upsert_activity_today()
returns trigger
language plpgsql
as $$
begin
  insert into public.activity_dates(user_id, activity_date)
  values (new.user_id, current_date)
  on conflict (user_id, activity_date) do nothing;
  return null;
end;
$$;

drop trigger if exists trg_activity_on_book on public.books;
create trigger trg_activity_on_book
after insert on public.books
for each row execute function public.upsert_activity_today();

drop trigger if exists trg_activity_on_note on public.notes;
create trigger trg_activity_on_note
after insert on public.notes
for each row execute function public.upsert_activity_today();

-- Create a profiles row whenever a user signs up (username set later by app)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Reader'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- Row Level Security (RLS)
-- =========================

alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.books enable row level security;
alter table public.notes enable row level security;
alter table public.collections enable row level security;
alter table public.saved_filters enable row level security;
alter table public.review_sessions enable row level security;
alter table public.reading_goals enable row level security;
alter table public.activity_dates enable row level security;

-- profiles: public read, owner write
drop policy if exists profiles_public_select on public.profiles;
create policy profiles_public_select
on public.profiles for select
using (true);

drop policy if exists profiles_owner_insert on public.profiles;
create policy profiles_owner_insert
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- folders/books/etc: owner-only
drop policy if exists folders_owner_all on public.folders;
create policy folders_owner_all
on public.folders for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists books_owner_all on public.books;
create policy books_owner_all
on public.books for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists collections_owner_all on public.collections;
create policy collections_owner_all
on public.collections for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists saved_filters_owner_all on public.saved_filters;
create policy saved_filters_owner_all
on public.saved_filters for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists review_sessions_owner_all on public.review_sessions;
create policy review_sessions_owner_all
on public.review_sessions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists reading_goals_owner_all on public.reading_goals;
create policy reading_goals_owner_all
on public.reading_goals for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists activity_dates_owner_all on public.activity_dates;
create policy activity_dates_owner_all
on public.activity_dates for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- notes: owner writes; reads allowed for owner OR public notes
drop policy if exists notes_insert_owner on public.notes;
create policy notes_insert_owner
on public.notes for insert
with check (user_id = auth.uid());

drop policy if exists notes_update_owner on public.notes;
create policy notes_update_owner
on public.notes for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notes_delete_owner on public.notes;
create policy notes_delete_owner
on public.notes for delete
using (user_id = auth.uid());

drop policy if exists notes_select_owner_or_public on public.notes;
create policy notes_select_owner_or_public
on public.notes for select
using (user_id = auth.uid() or is_private = false);

-- =========================
-- Storage (bucket policies)
-- =========================

-- Note: bucket visibility (public/private) is set in dashboard.
-- These policies prevent cross-user upload/delete and enable signed-URL reads for private audio.
-- (RLS on storage.objects is managed by Supabase; no alter here.)

-- Public read buckets
drop policy if exists storage_public_read_avatars on storage.objects;
create policy storage_public_read_avatars
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists storage_public_read_book_covers on storage.objects;
create policy storage_public_read_book_covers
on storage.objects for select
using (bucket_id = 'book-covers');

drop policy if exists storage_public_read_note_images on storage.objects;
create policy storage_public_read_note_images
on storage.objects for select
using (bucket_id = 'note-images');

-- Private read bucket (owner only)
drop policy if exists storage_private_read_note_audio on storage.objects;
create policy storage_private_read_note_audio
on storage.objects for select
using (bucket_id = 'note-audio' and owner = auth.uid());

-- Upload (insert): require authenticated and path prefix "<uid>/..."
drop policy if exists storage_upload_avatars on storage.objects;
create policy storage_upload_avatars
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_upload_book_covers on storage.objects;
create policy storage_upload_book_covers
on storage.objects for insert
with check (
  bucket_id = 'book-covers'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_upload_note_images on storage.objects;
create policy storage_upload_note_images
on storage.objects for insert
with check (
  bucket_id = 'note-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists storage_upload_note_audio on storage.objects;
create policy storage_upload_note_audio
on storage.objects for insert
with check (
  bucket_id = 'note-audio'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: only owners can delete their objects (all buckets)
drop policy if exists storage_delete_owner on storage.objects;
create policy storage_delete_owner
on storage.objects for delete
using (owner = auth.uid());

-- =========================
-- Indexes
-- =========================

create index if not exists idx_books_user_order on public.books(user_id, display_order);
create index if not exists idx_books_tags on public.books using gin(tags);
create index if not exists idx_notes_user_book on public.notes(user_id, book_id);
create index if not exists idx_notes_user_nextreview on public.notes(user_id, next_review_at);
create index if not exists idx_notes_tags on public.notes using gin(tags);
-- Full-text index: wrap in an immutable helper because to_tsvector with expressions is not immutable
create or replace function public.notes_search_vector(n public.notes)
returns tsvector
language sql
immutable
as $$
  select to_tsvector('english',
    coalesce(n.content, '') || ' ' ||
    coalesce(n.context, '') || ' ' ||
    coalesce(n.extracted_text, '') || ' ' ||
    coalesce(array_to_string(n.tags, ' '), '')
  );
$$;

create index if not exists idx_notes_search on public.notes using gin(public.notes_search_vector(notes));
