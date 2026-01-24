import { supabase } from '@/api/client';

export async function runOCR(imageBase64: string, mimeType = 'image/png', prompt?: string): Promise<string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const { data, error } = await supabase.functions.invoke('ai-ocr', {
    body: { imageBase64, mimeType, prompt },
    headers: anonKey
      ? {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        }
      : undefined,
  });
  if (error) throw error;
  return (data as { text?: string }).text ?? '';
}
