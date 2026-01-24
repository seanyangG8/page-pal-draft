-- Review session helpers and review scheduling on the server
-- Apply via: supabase db push

-- Pick due notes for the current user (oldest/least reviewed first)
create or replace function public.review_pick_notes(note_limit int default 5)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  safe_limit int := greatest(1, least(coalesce(note_limit, 5), 50));
  note_ids uuid[];
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28P01';
  end if;

  select array(
    select n.id
    from public.notes n
    where n.user_id = uid
      and (n.next_review_at is null or n.next_review_at <= now())
    order by coalesce(n.next_review_at, to_timestamp(0)), n.review_count, n.created_at
    limit safe_limit
  ) into note_ids;

  return coalesce(note_ids, '{}');
end;
$$;

-- Create a review session; if note_ids is empty, auto-pick
create or replace function public.review_start_session(note_ids uuid[] default null, note_limit int default 5)
returns public.review_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target_ids uuid[] := coalesce(note_ids, '{}');
  session_row public.review_sessions;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28P01';
  end if;

  if target_ids = '{}'::uuid[] then
    target_ids := public.review_pick_notes(note_limit);
  end if;

  -- Filter to only this user's notes
  select array_agg(id)
    into target_ids
  from public.notes
  where user_id = uid
    and id = any(target_ids);

  insert into public.review_sessions (user_id, note_ids, completed_note_ids)
  values (uid, coalesce(target_ids, '{}'), '{}')
  returning * into session_row;

  return session_row;
end;
$$;

-- Mark a note reviewed (increments SR fields) and add to the session's completed list
create or replace function public.review_mark_note(p_session_id uuid, p_note_id uuid)
returns public.review_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  session_row public.review_sessions;
  completed uuid[];
  current_count int;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28P01';
  end if;

  select *
    into session_row
  from public.review_sessions
  where id = p_session_id
    and user_id = uid;

  if not found then
    raise exception 'Session not found for user' using errcode = '22023';
  end if;

  if array_position(coalesce(session_row.note_ids, '{}'), p_note_id) is null then
    raise exception 'Note is not part of this session' using errcode = '22023';
  end if;

  update public.notes
    set review_count   = coalesce(review_count, 0) + 1,
        last_reviewed_at = now(),
        next_review_at    = now() + (interval '1 day' * least(power(2, coalesce(review_count, 0) + 1)::int, 30))
  where id = p_note_id
    and user_id = uid
  returning review_count into current_count;

  if not found then
    raise exception 'Note not found for user' using errcode = '22023';
  end if;

  completed := coalesce(session_row.completed_note_ids, '{}');
  if array_position(completed, p_note_id) is null then
    completed := completed || p_note_id;
    update public.review_sessions
      set completed_note_ids = completed
    where id = p_session_id;
    session_row.completed_note_ids := completed;
  end if;

  return session_row;
end;
$$;

-- Complete a session
create or replace function public.review_complete_session(p_session_id uuid)
returns public.review_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  session_row public.review_sessions;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28P01';
  end if;

  update public.review_sessions
    set completed_at = now()
  where id = p_session_id
    and user_id = uid
  returning * into session_row;

  if not found then
    raise exception 'Session not found for user' using errcode = '22023';
  end if;

  return session_row;
end;
$$;

-- Standalone review action for non-session flows
create or replace function public.note_mark_reviewed(p_note_id uuid)
returns public.notes
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  note_row public.notes;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '28P01';
  end if;

  update public.notes
    set review_count     = coalesce(review_count, 0) + 1,
        last_reviewed_at = now(),
        next_review_at   = now() + (interval '1 day' * least(power(2, coalesce(review_count, 0) + 1)::int, 30))
  where id = p_note_id
    and user_id = uid
  returning * into note_row;

  if not found then
    raise exception 'Note not found for user' using errcode = '22023';
  end if;

  return note_row;
end;
$$;
