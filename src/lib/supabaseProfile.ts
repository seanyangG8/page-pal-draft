import { supabase } from './supabaseClient';

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw userError || new Error('No user');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(updates: Partial<Profile>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw userError || new Error('No user');

  const patch = {
    display_name: updates.display_name,
    username: updates.username ? updates.username.toLowerCase() : undefined,
    bio: updates.bio,
    avatar_url: updates.avatar_url,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id);
  if (error) throw error;
  return getProfile();
}
