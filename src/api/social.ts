import { supabase, requireUserId } from './client';

const PROFILE_FIELDS = 'id, username, display_name, avatar_url, bio, created_at';

export type BasicProfile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
};

export type SocialPost = {
  id: string;
  userId: string;
  user?: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
  type: 'shared_note' | 'status' | 'milestone';
  content: string | null;
  noteId: string | null;
  bookId: string | null;
  milestoneType: 'books_read' | 'notes_count' | 'streak' | null;
  milestoneValue: number | null;
  likeCount: number;
  commentCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SocialComment = {
  id: string;
  postId: string;
  userId: string;
  user?: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SocialLike = {
  postId: string;
  userId: string;
  createdAt: Date;
  user?: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null };
};

export type ProfileSummary = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
  followers: number;
  following: number;
  isFollowing: boolean;
  isSelf: boolean;
  booksCount?: number;
  notesCount?: number;
};

function mapProfile(row: any): BasicProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: new Date(row.created_at),
  };
}

function mapPost(row: any): SocialPost {
  return {
    id: row.id,
    userId: row.user_id,
    user: row.user
      ? {
          id: row.user.id,
          username: row.user.username,
          displayName: row.user.display_name,
          avatarUrl: row.user.avatar_url,
        }
      : undefined,
    type: row.type,
    content: row.content,
    noteId: row.note_id,
    bookId: row.book_id,
    milestoneType: row.milestone_type,
    milestoneValue: row.milestone_value,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    isPublic: row.is_public ?? true,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapComment(row: any): SocialComment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    user: row.user
      ? {
          id: row.user.id,
          username: row.user.username,
          displayName: row.user.display_name,
          avatarUrl: row.user.avatar_url,
        }
      : undefined,
    content: row.content,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function fetchFeed(limit = 50): Promise<SocialPost[]> {
  const { data, error } = await supabase
    .from('social_posts')
    .select(`*, user:profiles(${PROFILE_FIELDS})`)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function fetchMyFeed(limit = 50): Promise<SocialPost[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('social_posts')
    .select(`*, user:profiles(${PROFILE_FIELDS})`)
    .or(`is_public.eq.true,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function createPost(input: {
  type: SocialPost['type'];
  content?: string | null;
  noteId?: string | null;
  bookId?: string | null;
  milestoneType?: SocialPost['milestoneType'];
  milestoneValue?: number | null;
  isPublic?: boolean;
}): Promise<SocialPost> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      user_id: userId,
      type: input.type,
      content: input.content ?? null,
      note_id: input.noteId ?? null,
      book_id: input.bookId ?? null,
      milestone_type: input.milestoneType ?? null,
      milestone_value: input.milestoneValue ?? null,
      is_public: input.isPublic ?? true,
    })
    .select(`*, user:profiles(${PROFILE_FIELDS})`)
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('social_posts').delete().eq('id', id);
  if (error) throw error;
}

export async function likePost(postId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('social_likes').insert({ post_id: postId, user_id: userId });
  if (error && error.code !== '23505') throw error; // ignore duplicate like
}

export async function unlikePost(postId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase.from('social_likes').delete().eq('post_id', postId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchLikes(postId: string): Promise<SocialLike[]> {
  const { data, error } = await supabase
    .from('social_likes')
    .select(`*, user:profiles(${PROFILE_FIELDS})`)
    .eq('post_id', postId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    postId: row.post_id,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    user: row.user
      ? {
          id: row.user.id,
          username: row.user.username,
          displayName: row.user.display_name,
          avatarUrl: row.user.avatar_url,
        }
      : undefined,
  }));
}

export async function addComment(postId: string, content: string): Promise<SocialComment> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('social_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`*, user:profiles(${PROFILE_FIELDS})`)
    .single();
  if (error) throw error;
  return mapComment(data);
}

export async function fetchComments(postId: string): Promise<SocialComment[]> {
  const { data, error } = await supabase
    .from('social_comments')
    .select(`*, user:profiles(${PROFILE_FIELDS})`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapComment);
}

export async function fetchUserLikes(): Promise<string[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase.from('social_likes').select('post_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.post_id as string);
}

export async function fetchFollowingProfiles(): Promise<BasicProfile[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('social_follows')
    .select(`following:profiles(${PROFILE_FIELDS})`)
    .eq('follower_id', userId);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.following)
    .filter(Boolean)
    .map(mapProfile);
}

export async function fetchFollowerProfiles(): Promise<BasicProfile[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('social_follows')
    .select(`follower:profiles(${PROFILE_FIELDS})`)
    .eq('following_id', userId);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.follower)
    .filter(Boolean)
    .map(mapProfile);
}

export async function fetchSuggestedProfiles(limit = 20): Promise<BasicProfile[]> {
  const userId = await requireUserId();

  const { data: followingData, error: followingError } = await supabase
    .from('social_follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (followingError) throw followingError;

  const followingIds = new Set<string>((followingData ?? []).map((row: any) => row.following_id));

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .neq('id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  return (data ?? [])
    .filter((row: any) => !followingIds.has(row.id))
    .slice(0, limit)
    .map(mapProfile);
}

export async function followUser(followingId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('social_follows')
    .insert({ follower_id: userId, following_id: followingId });
  if (error && error.code !== '23505') throw error; // ignore duplicates
}

export async function unfollowUser(followingId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('social_follows')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', followingId);
  if (error) throw error;
}

export async function fetchProfileSummary(userId: string): Promise<ProfileSummary> {
  const { data: sessionData } = await supabase.auth.getSession();
  const viewerId = sessionData.session?.user?.id ?? null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single();
  if (profileError) throw profileError;

  const [followersRes, followingRes, followCheckRes, booksRes, notesRes] = await Promise.all([
    supabase.from('social_follows').select('*', { head: true, count: 'exact' }).eq('following_id', userId),
    supabase.from('social_follows').select('*', { head: true, count: 'exact' }).eq('follower_id', userId),
    viewerId && viewerId !== userId
      ? supabase
          .from('social_follows')
          .select('*', { head: true, count: 'exact' })
          .eq('follower_id', viewerId)
          .eq('following_id', userId)
      : Promise.resolve({ count: 0, error: null, data: null } as { count: number | null; error: null; data: null }),
    viewerId === userId
      ? supabase.from('books').select('*', { head: true, count: 'exact' }).eq('user_id', userId)
      : Promise.resolve({ count: null, error: null, data: null } as {
          count: number | null;
          error: null;
          data: null;
        }),
    viewerId === userId
      ? supabase.from('notes').select('*', { head: true, count: 'exact' }).eq('user_id', userId)
      : Promise.resolve({ count: null, error: null, data: null } as {
          count: number | null;
          error: null;
          data: null;
        }),
  ]);

  if (followersRes.error) throw followersRes.error;
  if (followingRes.error) throw followingRes.error;
  if (followCheckRes && 'error' in followCheckRes && followCheckRes.error) throw followCheckRes.error;
  if (booksRes && 'error' in booksRes && booksRes.error) throw booksRes.error;
  if (notesRes && 'error' in notesRes && notesRes.error) throw notesRes.error;

  const followerCount = followersRes.count ?? 0;
  const followingCount = followingRes.count ?? 0;
  const isFollowing = (followCheckRes && 'count' in followCheckRes && (followCheckRes.count ?? 0) > 0) || false;

  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    createdAt: new Date(profile.created_at),
    followers: followerCount,
    following: followingCount,
    isFollowing,
    isSelf: viewerId === userId,
    booksCount: booksRes && 'count' in booksRes ? booksRes.count ?? undefined : undefined,
    notesCount: notesRes && 'count' in notesRes ? notesRes.count ?? undefined : undefined,
  };
}
