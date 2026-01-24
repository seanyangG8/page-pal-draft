-- Social tables (posts, comments, likes, follows) with RLS
-- Apply via: supabase db push

-- Tables
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('shared_note', 'status', 'milestone')),
  content text,
  note_id uuid references public.notes(id) on delete set null,
  book_id uuid references public.books(id) on delete set null,
  milestone_type text check (milestone_type in ('books_read', 'notes_count', 'streak')),
  milestone_value int,
  like_count int not null default 0,
  comment_count int not null default 0,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.social_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.social_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint social_follow_self check (follower_id <> following_id),
  primary key (follower_id, following_id)
);

-- Triggers: updated_at
drop trigger if exists trg_social_posts_updated on public.social_posts;
create trigger trg_social_posts_updated
before update on public.social_posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_social_comments_updated on public.social_comments;
create trigger trg_social_comments_updated
before update on public.social_comments
for each row execute function public.set_updated_at();

-- Indexes
create index if not exists idx_social_posts_created on public.social_posts(created_at desc);
create index if not exists idx_social_posts_user on public.social_posts(user_id);
create index if not exists idx_social_comments_post on public.social_comments(post_id, created_at);
create index if not exists idx_social_likes_post on public.social_likes(post_id);
create index if not exists idx_social_follows_following on public.social_follows(following_id);

-- RLS
alter table public.social_posts enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_likes enable row level security;
alter table public.social_follows enable row level security;

-- social_posts: public read if is_public, owner read/write; insert/update/delete owner-only
drop policy if exists social_posts_select on public.social_posts;
create policy social_posts_select
on public.social_posts for select
using (is_public or user_id = auth.uid());

drop policy if exists social_posts_insert on public.social_posts;
create policy social_posts_insert
on public.social_posts for insert
with check (user_id = auth.uid());

drop policy if exists social_posts_update on public.social_posts;
create policy social_posts_update
on public.social_posts for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists social_posts_delete on public.social_posts;
create policy social_posts_delete
on public.social_posts for delete
using (user_id = auth.uid());

-- social_comments: public read for comments on public posts; owner read/write
drop policy if exists social_comments_select on public.social_comments;
create policy social_comments_select
on public.social_comments for select
using (
  exists (
    select 1 from public.social_posts p
    where p.id = post_id
      and (p.is_public or p.user_id = auth.uid())
  )
);

drop policy if exists social_comments_insert on public.social_comments;
create policy social_comments_insert
on public.social_comments for insert
with check (
  user_id = auth.uid()
  and exists (select 1 from public.social_posts p where p.id = post_id and (p.is_public or p.user_id = auth.uid()))
);

drop policy if exists social_comments_update on public.social_comments;
create policy social_comments_update
on public.social_comments for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists social_comments_delete on public.social_comments;
create policy social_comments_delete
on public.social_comments for delete
using (user_id = auth.uid());

-- social_likes: any authenticated user can like/unlike public posts
drop policy if exists social_likes_select on public.social_likes;
create policy social_likes_select
on public.social_likes for select
using (
  exists (
    select 1 from public.social_posts p
    where p.id = post_id
      and (p.is_public or p.user_id = auth.uid())
  )
);

drop policy if exists social_likes_insert on public.social_likes;
create policy social_likes_insert
on public.social_likes for insert
with check (
  user_id = auth.uid()
  and exists (select 1 from public.social_posts p where p.id = post_id and (p.is_public or p.user_id = auth.uid()))
);

drop policy if exists social_likes_delete on public.social_likes;
create policy social_likes_delete
on public.social_likes for delete
using (user_id = auth.uid());

-- social_follows: allow users to follow/unfollow and read follower/following lists
drop policy if exists social_follows_select on public.social_follows;
create policy social_follows_select
on public.social_follows for select
using (true);

drop policy if exists social_follows_insert on public.social_follows;
create policy social_follows_insert
on public.social_follows for insert
with check (follower_id = auth.uid());

drop policy if exists social_follows_delete on public.social_follows;
create policy social_follows_delete
on public.social_follows for delete
using (follower_id = auth.uid());

-- Counters: maintain like_count and comment_count on posts
create or replace function public.social_adjust_like_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_social_like_ins on public.social_likes;
create trigger trg_social_like_ins
after insert on public.social_likes
for each row execute function public.social_adjust_like_count();

drop trigger if exists trg_social_like_del on public.social_likes;
create trigger trg_social_like_del
after delete on public.social_likes
for each row execute function public.social_adjust_like_count();

create or replace function public.social_adjust_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_social_comment_ins on public.social_comments;
create trigger trg_social_comment_ins
after insert on public.social_comments
for each row execute function public.social_adjust_comment_count();

drop trigger if exists trg_social_comment_del on public.social_comments;
create trigger trg_social_comment_del
after delete on public.social_comments
for each row execute function public.social_adjust_comment_count();
