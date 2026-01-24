import { supabase, requireUserId } from './client';
import { DbNote } from './types';
import { Note } from '@/types';

function mapNote(row: DbNote): Note {
  return {
    id: row.id,
    bookId: row.book_id,
    type: row.type,
    mediaType: row.media_type,
    content: row.content,
    imageUrl: row.image_url || undefined,
    extractedText: row.extracted_text || undefined,
    audioUrl: row.audio_url || undefined,
    audioDuration: row.audio_duration ?? undefined,
    transcript: row.transcript ?? undefined,
    location: row.location ?? undefined,
    timestamp: row.timestamp ?? undefined,
    chapter: row.chapter ?? undefined,
    context: row.context ?? undefined,
    tags: row.tags ?? undefined,
    aiSummary: row.ai_summary ?? undefined,
    aiExpanded: row.ai_expanded ?? undefined,
    aiFlashcard: row.ai_flashcard ?? undefined,
    isPrivate: row.is_private ?? true,
    reviewCount: row.review_count ?? 0,
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : undefined,
    nextReviewAt: row.next_review_at ? new Date(row.next_review_at) : undefined,
    folderId: row.folder_id ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function fetchNotes(): Promise<Note[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbNote[]).map(mapNote);
}

export async function fetchNotesForBook(bookId: string): Promise<Note[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbNote[]).map(mapNote);
}

export async function createNote(input: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount'>): Promise<Note> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      book_id: input.bookId,
      type: input.type,
      media_type: input.mediaType,
      content: input.content,
      image_url: input.imageUrl ?? null,
      extracted_text: input.extractedText ?? null,
      audio_url: input.audioUrl ?? null,
      audio_duration: input.audioDuration ?? null,
      transcript: (input as any).transcript ?? null,
      location: input.location ?? null,
      timestamp: input.timestamp ?? null,
      chapter: input.chapter ?? null,
      context: input.context ?? null,
      tags: input.tags ?? null,
      ai_summary: input.aiSummary ?? null,
      ai_expanded: input.aiExpanded ?? null,
      ai_flashcard: input.aiFlashcard ?? null,
      is_private: input.isPrivate ?? true,
      folder_id: input.folderId ?? null,
      review_count: input.reviewCount ?? 0,
      last_reviewed_at: input.lastReviewedAt ? input.lastReviewedAt.toISOString() : null,
      next_review_at: input.nextReviewAt ? input.nextReviewAt.toISOString() : null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapNote(data as DbNote);
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({
      type: updates.type,
      media_type: updates.mediaType,
      content: updates.content,
      image_url: updates.imageUrl ?? null,
      extracted_text: updates.extractedText ?? null,
      audio_url: updates.audioUrl ?? null,
      audio_duration: updates.audioDuration ?? null,
      transcript: (updates as any).transcript ?? null,
      location: updates.location ?? null,
      timestamp: updates.timestamp ?? null,
      chapter: updates.chapter ?? null,
      context: updates.context ?? null,
      tags: updates.tags ?? null,
      ai_summary: updates.aiSummary ?? null,
      ai_expanded: updates.aiExpanded ?? null,
      ai_flashcard: updates.aiFlashcard ?? null,
      is_private: updates.isPrivate,
      folder_id: updates.folderId ?? null,
      review_count: updates.reviewCount,
      last_reviewed_at: updates.lastReviewedAt ? updates.lastReviewedAt.toISOString() : null,
      next_review_at: updates.nextReviewAt ? updates.nextReviewAt.toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapNote(data as DbNote);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export async function searchNotesClient(notes: Note[], query: string): Promise<Note[]> {
  const lower = query.toLowerCase();
  return notes.filter((n) =>
    n.content.toLowerCase().includes(lower) ||
    n.context?.toLowerCase().includes(lower) ||
    n.extractedText?.toLowerCase().includes(lower) ||
    n.tags?.some((t) => t.toLowerCase().includes(lower))
  );
}

export async function getAllTags(notes: Note[]): Promise<string[]> {
  const tags = new Set<string>();
  notes.forEach((n) => n.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export async function getNotesForReview(notes: Note[], limit = 10): Promise<Note[]> {
  const now = new Date();
  return notes
    .filter((n) => !n.nextReviewAt || n.nextReviewAt <= now)
    .sort((a, b) => {
      if (!a.lastReviewedAt && !b.lastReviewedAt) return 0;
      if (!a.lastReviewedAt) return -1;
      if (!b.lastReviewedAt) return 1;
      return a.lastReviewedAt.getTime() - b.lastReviewedAt.getTime();
    })
    .slice(0, limit);
}

export async function markNoteReviewed(id: string): Promise<Note> {
  const { data, error } = await supabase.rpc('note_mark_reviewed', { p_note_id: id });
  if (error) throw error;
  return mapNote(data as DbNote);
}
