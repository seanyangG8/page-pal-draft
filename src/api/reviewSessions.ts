import { supabase, requireUserId } from './client';
import { DbReviewSession } from './types';
import { ReviewSession } from '@/types';

function mapSession(row: DbReviewSession): ReviewSession {
  return {
    id: row.id,
    noteIds: row.note_ids ?? [],
    completedNoteIds: row.completed_note_ids ?? [],
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export async function createReviewSession(noteIds: string[]): Promise<ReviewSession> {
  const { data, error } = await supabase.rpc('review_start_session', {
    note_ids: noteIds,
    note_limit: noteIds?.length ?? 5,
  });
  if (error) throw error;
  return mapSession(data as DbReviewSession);
}

export async function fetchReviewSession(id: string): Promise<ReviewSession> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return mapSession(data as DbReviewSession);
}

export async function completeReviewSession(id: string): Promise<void> {
  const { error } = await supabase.rpc('review_complete_session', { p_session_id: id });
  if (error) throw error;
}

export async function markNoteReviewedInSession(sessionId: string, noteId: string): Promise<void> {
  const { error } = await supabase.rpc('review_mark_note', {
    p_session_id: sessionId,
    p_note_id: noteId,
  });
  if (error) throw error;
}

export async function pickNotesForSession(count = 5): Promise<string[]> {
  const { data, error } = await supabase.rpc('review_pick_notes', { note_limit: count });
  if (error) throw error;
  return (data as string[]) ?? [];
}
