import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBooks,
  createBook as apiCreateBook,
  updateBook as apiUpdateBook,
  deleteBook as apiDeleteBook,
  reorderBooks as apiReorderBooks,
} from './books';
import {
  fetchNotes,
  fetchNotesForBook,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  searchNotesClient,
  getAllTags as getAllTagsFromNotes,
  getNotesForReview as getNotesForReviewClient,
  markNoteReviewed as apiMarkNoteReviewed,
} from './notes';
import {
  fetchFolders,
  createFolder as apiCreateFolder,
  updateFolder as apiUpdateFolder,
  deleteFolder as apiDeleteFolder,
} from './folders';
import {
  fetchCollections,
  createCollection as apiCreateCollection,
  updateCollection as apiUpdateCollection,
  deleteCollection as apiDeleteCollection,
} from './collections';
import {
  fetchSavedFilters,
  createSavedFilter as apiCreateSavedFilter,
  deleteSavedFilter as apiDeleteSavedFilter,
} from './savedFilters';
import {
  fetchFeed,
  fetchMyFeed,
  createPost as apiCreatePost,
  deletePost as apiDeletePost,
  likePost as apiLikePost,
  unlikePost as apiUnlikePost,
  fetchLikes,
  addComment as apiAddComment,
  fetchComments,
  followUser as apiFollowUser,
  unfollowUser as apiUnfollowUser,
  fetchUserLikes,
  fetchFollowingProfiles,
  fetchFollowerProfiles,
  fetchSuggestedProfiles,
} from './social';
import {
  createReviewSession as apiCreateReviewSession,
  fetchReviewSession as apiFetchReviewSession,
  completeReviewSession as apiCompleteReviewSession,
  markNoteReviewedInSession as apiMarkNoteReviewedInSession,
  pickNotesForSession,
} from './reviewSessions';
import {
  fetchReadingGoals as apiFetchReadingGoals,
  updateReadingGoals as apiUpdateReadingGoals,
  fetchActivityDates as apiFetchActivityDates,
  calculateStreakFromDates,
  recordActivity as apiRecordActivity,
} from './goalsActivity';
import { Book, Note, Folder, Collection, SavedFilter, ReviewSession } from '@/types';
import { ReadingGoals } from './goalsActivity';

// Keys
const qk = {
  books: ['books'] as const,
  notes: ['notes'] as const,
  notesByBook: (bookId: string) => ['notes', bookId] as const,
  folders: ['folders'] as const,
  collections: ['collections'] as const,
  savedFilters: ['savedFilters'] as const,
  reviewSession: (id: string) => ['reviewSession', id] as const,
  goals: ['readingGoals'] as const,
  activity: ['activityDates'] as const,
  feed: ['feed'] as const,
  myFeed: ['myFeed'] as const,
  comments: (postId: string) => ['comments', postId] as const,
  likes: (postId: string) => ['likes', postId] as const,
  myLikes: ['myLikes'] as const,
  following: ['following'] as const,
  followers: ['followers'] as const,
  suggestedProfiles: ['suggestedProfiles'] as const,
};

// Books
export function useBooks() {
  return useQuery({ queryKey: qk.books, queryFn: fetchBooks });
}

export function useBookMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: qk.books });

  const create = useMutation({ mutationFn: apiCreateBook, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Book> }) =>
      apiUpdateBook(id, updates),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: string) => apiDeleteBook(id), onSuccess: invalidate });
  const reorder = useMutation({
    mutationFn: (ids: string[]) => apiReorderBooks(ids),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder };
}

// Notes
export function useNotes() {
  return useQuery({ queryKey: qk.notes, queryFn: fetchNotes });
}

export function useNotesByBook(bookId: string) {
  return useQuery({
    queryKey: qk.notesByBook(bookId),
    queryFn: () => fetchNotesForBook(bookId),
    enabled: !!bookId,
  });
}

export function useNoteMutations() {
  const client = useQueryClient();
  const invalidateAll = () => {
    client.invalidateQueries({ queryKey: qk.notes });
    client.invalidateQueries({ queryKey: qk.books });
  };
  const invalidateByBook = (bookId?: string) => {
    if (bookId) client.invalidateQueries({ queryKey: qk.notesByBook(bookId) });
    client.invalidateQueries({ queryKey: qk.notes });
    client.invalidateQueries({ queryKey: qk.books });
  };

  const create = useMutation({
    mutationFn: apiCreateNote,
    onSuccess: (data) => invalidateByBook(data.bookId),
  });
  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
      apiUpdateNote(id, updates),
    onSuccess: (data) => invalidateByBook(data.bookId),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDeleteNote(id),
    onSuccess: () => invalidateAll(),
  });
  const markReviewed = useMutation({
    mutationFn: ({ id }: { id: string }) => apiMarkNoteReviewed(id),
    onSuccess: invalidateAll,
  });

  return { create, update, remove, markReviewed };
}

// Folders
export function useFolders() {
  return useQuery({ queryKey: qk.folders, queryFn: fetchFolders });
}
export function useFolderMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: qk.folders });
    client.invalidateQueries({ queryKey: qk.notes });
  };
  const create = useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => apiCreateFolder(name, color),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Folder> }) =>
      apiUpdateFolder(id, updates),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDeleteFolder(id),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// Collections
export function useCollections() {
  return useQuery({ queryKey: qk.collections, queryFn: fetchCollections });
}
export function useCollectionMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: qk.collections });
  const create = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      apiCreateCollection(name, description),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Collection> }) =>
      apiUpdateCollection(id, updates),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDeleteCollection(id),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

// Saved Filters
export function useSavedFilters() {
  return useQuery({ queryKey: qk.savedFilters, queryFn: fetchSavedFilters });
}
export function useSavedFilterMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: qk.savedFilters });
  const create = useMutation({ mutationFn: apiCreateSavedFilter, onSuccess: invalidate });
  const remove = useMutation({
    mutationFn: (id: string) => apiDeleteSavedFilter(id),
    onSuccess: invalidate,
  });
  return { create, remove };
}

// Review Sessions
export function useReviewSession(id: string) {
  return useQuery({
    queryKey: qk.reviewSession(id),
    queryFn: () => apiFetchReviewSession(id),
    enabled: !!id,
  });
}
export function useReviewSessionMutations() {
  const client = useQueryClient();
  const invalidate = (id?: string) => {
    if (id) client.invalidateQueries({ queryKey: qk.reviewSession(id) });
    client.invalidateQueries({ queryKey: qk.notes });
  };
  const create = useMutation({
    mutationFn: apiCreateReviewSession,
    onSuccess: () => client.invalidateQueries({ queryKey: qk.reviewSession('new') }), // noop invalidation placeholder
  });
  const complete = useMutation({
    mutationFn: (id: string) => apiCompleteReviewSession(id),
    onSuccess: invalidate,
  });
  const markInSession = useMutation({
    mutationFn: ({ sessionId, noteId }: { sessionId: string; noteId: string }) =>
      apiMarkNoteReviewedInSession(sessionId, noteId),
    onSuccess: () => client.invalidateQueries(),
  });
  return { create, complete, markInSession, pickNotesForSession };
}

// Goals & Activity
export function useReadingGoals() {
  return useQuery({ queryKey: qk.goals, queryFn: apiFetchReadingGoals });
}
export function useGoalsMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: qk.goals });
  const update = useMutation({
    mutationFn: (target: number) => apiUpdateReadingGoals(target),
    onSuccess: invalidate,
  });
  return { update };
}

export function useActivity() {
  return useQuery({ queryKey: qk.activity, queryFn: apiFetchActivityDates });
}
export function useActivityHelpers() {
  return { calculateStreakFromDates, recordActivity: apiRecordActivity };
}

// Helpers that operate on client-fetched notes
export function useNoteHelpers() {
  return { searchNotesClient, getAllTagsFromNotes, getNotesForReviewClient };
}

// Social
export function useFeed() {
  return useQuery({ queryKey: qk.feed, queryFn: () => fetchFeed() });
}

export function useMyFeed() {
  return useQuery({ queryKey: qk.myFeed, queryFn: () => fetchMyFeed() });
}

export function useSocialMutations() {
  const client = useQueryClient();
  const invalidateFeed = () => {
    client.invalidateQueries({ queryKey: qk.feed });
    client.invalidateQueries({ queryKey: qk.myFeed });
  };
  const createPost = useMutation({ mutationFn: apiCreatePost, onSuccess: invalidateFeed });
  const deletePost = useMutation({ mutationFn: apiDeletePost, onSuccess: invalidateFeed });
  const like = useMutation({
    mutationFn: apiLikePost,
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: qk.feed });
      client.invalidateQueries({ queryKey: qk.myFeed });
      client.invalidateQueries({ queryKey: qk.likes(variables) });
      client.invalidateQueries({ queryKey: qk.myLikes });
    },
  });
  const unlike = useMutation({
    mutationFn: apiUnlikePost,
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: qk.feed });
      client.invalidateQueries({ queryKey: qk.myFeed });
      client.invalidateQueries({ queryKey: qk.likes(variables) });
      client.invalidateQueries({ queryKey: qk.myLikes });
    },
  });
  const invalidateFollows = () => {
    client.invalidateQueries({ queryKey: qk.following });
    client.invalidateQueries({ queryKey: qk.followers });
    client.invalidateQueries({ queryKey: qk.suggestedProfiles });
  };
  const follow = useMutation({
    mutationFn: apiFollowUser,
    onSuccess: invalidateFollows,
  });
  const unfollow = useMutation({
    mutationFn: apiUnfollowUser,
    onSuccess: invalidateFollows,
  });
  return { createPost, deletePost, like, unlike, follow, unfollow, fetchLikes };
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: qk.comments(postId),
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  });
}

export function useMyLikes() {
  return useQuery({ queryKey: qk.myLikes, queryFn: fetchUserLikes });
}

export function useFollowingProfiles() {
  return useQuery({ queryKey: qk.following, queryFn: fetchFollowingProfiles });
}

export function useFollowerProfiles() {
  return useQuery({ queryKey: qk.followers, queryFn: fetchFollowerProfiles });
}

export function useSuggestedProfiles() {
  return useQuery({ queryKey: qk.suggestedProfiles, queryFn: () => fetchSuggestedProfiles() });
}

export function useCommentsMutations() {
  const client = useQueryClient();
  const addComment = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => apiAddComment(postId, content),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: qk.comments(variables.postId) });
      client.invalidateQueries({ queryKey: qk.feed });
      client.invalidateQueries({ queryKey: qk.myFeed });
    },
  });
  return { addComment };
}
