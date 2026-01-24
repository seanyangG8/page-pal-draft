import { supabase, requireUserId } from './client';
import { DbBook } from './types';
import { Book } from '@/types';

function mapBook(row: DbBook): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    format: row.format,
    coverUrl: row.cover_url || undefined,
    isbn: row.isbn || undefined,
    tags: row.tags || undefined,
    folderId: row.folder_id || undefined,
    displayOrder: row.display_order,
    notesCount: row.notes_count,
    createdAt: new Date(row.created_at),
  };
}

export async function fetchBooks(): Promise<Book[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data as DbBook[]).map(mapBook);
}

export async function createBook(input: {
  title: string;
  author: string;
  format: Book['format'];
  coverUrl?: string;
  isbn?: string;
}): Promise<Book> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('books')
    .insert({
      user_id: userId,
      title: input.title,
      author: input.author,
      format: input.format,
      cover_url: input.coverUrl ?? null,
      isbn: input.isbn ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapBook(data as DbBook);
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .update({
      title: updates.title,
      author: updates.author,
      format: updates.format,
      cover_url: updates.coverUrl ?? null,
      isbn: updates.isbn ?? null,
      tags: updates.tags ?? null,
      folder_id: updates.folderId ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapBook(data as DbBook);
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderBooks(bookIds: string[]): Promise<void> {
  // Update display_order in the sequence provided
  const updates = bookIds.map((id, idx) => ({ id, display_order: idx }));
  const { error } = await supabase.from('books').upsert(updates, { onConflict: 'id' });
  if (error) throw error;
}
