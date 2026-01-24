import { supabase } from '@/lib/supabaseClient';

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user?.id) {
    throw new Error('No authenticated user');
  }
  return data.session.user.id;
}

export { supabase, requireUserId };
