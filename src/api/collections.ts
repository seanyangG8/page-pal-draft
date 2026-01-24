import { supabase, requireUserId } from './client';
import { DbCollection } from './types';
import { Collection } from '@/types';

function mapCollection(row: DbCollection): Collection {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    noteIds: row.note_ids ?? [],
    createdAt: new Date(row.created_at),
  };
}

export async function fetchCollections(): Promise<Collection[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbCollection[]).map(mapCollection);
}

export async function createCollection(name: string, description?: string): Promise<Collection> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('collections')
    .insert({ user_id: userId, name, description: description ?? null, note_ids: [] })
    .select('*')
    .single();
  if (error) throw error;
  return mapCollection(data as DbCollection);
}

export async function updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .update({
      name: updates.name,
      description: updates.description ?? null,
      note_ids: updates.noteIds,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapCollection(data as DbCollection);
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) throw error;
}
