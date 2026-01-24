import { NoteType, MediaType, BookFormat } from '@/types';

export type DbBook = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  format: BookFormat;
  cover_url: string | null;
  isbn: string | null;
  tags: string[] | null;
  folder_id: string | null;
  display_order: number;
  notes_count: number;
  created_at: string;
  updated_at: string;
};

export type DbNote = {
  id: string;
  user_id: string;
  book_id: string;
  type: NoteType;
  media_type: MediaType;
  content: string;
  image_url: string | null;
  extracted_text: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  transcript: string | null;
  location: string | null;
  timestamp: string | null;
  chapter: string | null;
  context: string | null;
  tags: string[] | null;
  ai_summary: string | null;
  ai_expanded: string | null;
  ai_flashcard: { question: string; answer: string } | null;
  is_private: boolean;
  review_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbFolder = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type DbCollection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  note_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

export type DbSavedFilter = {
  id: string;
  user_id: string;
  name: string;
  filters: {
    bookIds?: string[];
    types?: NoteType[];
    tags?: string[];
    folderIds?: string[];
    dateRange?: { start: string; end: string };
  } | null;
  created_at: string;
};

export type DbReviewSession = {
  id: string;
  user_id: string;
  note_ids: string[] | null;
  completed_note_ids: string[] | null;
  created_at: string;
  completed_at: string | null;
};

export type DbReadingGoal = {
  id: string;
  user_id: string;
  year: number;
  yearly_book_target: number;
  created_at: string;
  updated_at: string;
};

export type DbActivityDate = {
  id: string;
  user_id: string;
  activity_date: string;
  created_at: string;
};
