import { supabase, requireUserId } from './client';
import { DbFolder } from './types';
import { Folder } from '@/types';

function mapFolder(row: DbFolder): Folder {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function fetchFolders(): Promise<Folder[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbFolder[]).map(mapFolder);
}

export async function createFolder(name: string, color?: string): Promise<Folder> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('folders')
    .insert({ user_id: userId, name, color: color ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return mapFolder(data as DbFolder);
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ name: updates.name, color: updates.color ?? null })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return mapFolder(data as DbFolder);
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}
