import { supabase, requireUserId } from './client';
import { DbSavedFilter } from './types';
import { SavedFilter, NoteType } from '@/types';

function mapSavedFilter(row: DbSavedFilter): SavedFilter {
  return {
    id: row.id,
    name: row.name,
    filters: {
      bookIds: row.filters?.bookIds,
      types: row.filters?.types as NoteType[] | undefined,
      tags: row.filters?.tags,
      folderIds: row.filters?.folderIds,
      dateRange: row.filters?.dateRange
        ? {
            start: new Date(row.filters.dateRange.start),
            end: new Date(row.filters.dateRange.end),
          }
        : undefined,
    },
    createdAt: new Date(row.created_at),
  };
}

export async function fetchSavedFilters(): Promise<SavedFilter[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('saved_filters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbSavedFilter[]).map(mapSavedFilter);
}

export async function createSavedFilter(input: Omit<SavedFilter, 'id' | 'createdAt'>): Promise<SavedFilter> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('saved_filters')
    .insert({
      user_id: userId,
      name: input.name,
      filters: {
        bookIds: input.filters.bookIds,
        types: input.filters.types,
        tags: input.filters.tags,
        folderIds: input.filters.folderIds,
        dateRange: input.filters.dateRange
          ? {
              start: input.filters.dateRange.start,
              end: input.filters.dateRange.end,
            }
          : null,
      },
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapSavedFilter(data as DbSavedFilter);
}

export async function deleteSavedFilter(id: string): Promise<void> {
  const { error } = await supabase.from('saved_filters').delete().eq('id', id);
  if (error) throw error;
}
