import { supabase } from '@/api/client';

export type AIAction = 'cleanup' | 'expand' | 'summarize' | 'flashcard';
export type AIContext =
  | {
      bookTitle?: string;
      bookAuthor?: string;
      chapterOrSection?: string;
      page?: string;
      highlight?: string;
    }
  | string;

export async function runAIAction(
  action: AIAction,
  text: string,
  context?: AIContext
): Promise<{ text?: string; flashcard?: { question: string; answer: string } }> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const { data, error } = await supabase.functions.invoke('ai-actions', {
    body: { action, text, context },
    headers: anonKey
      ? {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        }
      : undefined,
  });
  if (error) throw error;
  return data as { text?: string; flashcard?: { question: string; answer: string } };
}
