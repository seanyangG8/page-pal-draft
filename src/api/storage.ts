import { supabase, requireUserId } from './client';

const KB = 1024;
const MB = 1024 * KB;

type UploadResult = {
  path: string;
  publicUrl?: string;
  signedUrl?: string;
};

function ensureFile(file: File, allowedTypes: string[], maxSizeMB: number) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  }
  if (file.size > maxSizeMB * MB) {
    throw new Error(`File is too large (max ${maxSizeMB} MB)`);
  }
}

function randomName() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildPath(userId: string, file: File): string {
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'bin';
  return `${userId}/${randomName()}.${ext}`;
}

async function uploadPublic(bucket: string, file: File, allowed: string[], maxSizeMB: number): Promise<UploadResult> {
  ensureFile(file, allowed, maxSizeMB);
  const userId = await requireUserId();
  const path = buildPath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: publicUrl.publicUrl };
}

async function uploadPrivateWithSignedUrl(bucket: string, file: File, allowed: string[], maxSizeMB: number, expiresIn = 3600): Promise<UploadResult> {
  ensureFile(file, allowed, maxSizeMB);
  const userId = await requireUserId();
  const path = buildPath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (signedError) throw signedError;
  return { path, signedUrl: data.signedUrl };
}

export async function uploadAvatar(file: File) {
  return uploadPublic('avatars', file, ['image/jpeg', 'image/png', 'image/webp'], 5);
}

export async function uploadBookCover(file: File) {
  return uploadPublic('book-covers', file, ['image/jpeg', 'image/png', 'image/webp'], 8);
}

export async function uploadNoteImage(file: File) {
  return uploadPublic('note-images', file, ['image/jpeg', 'image/png', 'image/webp'], 10);
}

export async function uploadNoteAudio(file: File) {
  return uploadPrivateWithSignedUrl('note-audio', file, ['audio/m4a', 'audio/mp3', 'audio/webm', 'audio/wav'], 30);
}

export async function getNoteAudioSignedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from('note-audio').createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
