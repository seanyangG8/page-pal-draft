-- Activity-driven social posts (auto-generated from user actions)
-- Apply via: supabase db push

-- Inserts a social post when a public note is created
create or replace function public.social_post_new_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_private then
    return new;
  end if;

  insert into public.social_posts (user_id, type, content, note_id, book_id, is_public)
  values (
    new.user_id,
    'shared_note',
    left(coalesce(new.content, ''), 280),
    new.id,
    new.book_id,
    true
  );

  return new;
end;
$$;

drop trigger if exists trg_social_post_note_ins on public.notes;
create trigger trg_social_post_note_ins
after insert on public.notes
for each row execute function public.social_post_new_note();

-- Inserts a social post when a note is made public (private -> public)
create or replace function public.social_post_note_made_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_private = false and coalesce(old.is_private, true) = true then
    insert into public.social_posts (user_id, type, content, note_id, book_id, is_public)
    values (
      new.user_id,
      'shared_note',
      left(coalesce(new.content, ''), 280),
      new.id,
      new.book_id,
      true
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_social_post_note_public on public.notes;
create trigger trg_social_post_note_public
after update on public.notes
for each row
when (new.is_private = false and coalesce(old.is_private, true) = true)
execute function public.social_post_note_made_public();

-- Inserts a social post when a book is added
create or replace function public.social_post_new_book()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  summary text;
begin
  summary := left(format('Added a new book: %s%s', new.title, coalesce(' by ' || new.author, '')), 280);

  insert into public.social_posts (user_id, type, content, book_id, is_public)
  values (
    new.user_id,
    'status',
    summary,
    new.id,
    true
  );

  return new;
end;
$$;

drop trigger if exists trg_social_post_book_ins on public.books;
create trigger trg_social_post_book_ins
after insert on public.books
for each row execute function public.social_post_new_book();
