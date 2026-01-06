export type NoteType = 'quote' | 'idea' | 'question' | 'action';
export type MediaType = 'text' | 'image' | 'audio';
export type BookFormat = 'physical' | 'ebook' | 'audiobook';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  format: BookFormat;
  createdAt: Date;
  notesCount: number;
  tags?: string[];
  folderId?: string;
}

export interface Note {
  id: string;
  bookId: string;
  type: NoteType;
  mediaType: MediaType;
  content: string;
  // For image captures
  imageUrl?: string;
  extractedText?: string;
  // For audio/voice memos
  audioUrl?: string;
  audioDuration?: number;
  // Location info
  location?: string; // page number, chapter, or timestamp
  timestamp?: string; // for audiobooks: "1:23:45"
  chapter?: string;
  // Context
  context?: string; // why it matters
  // Organization
  tags?: string[];
  folderId?: string;
  // AI-generated fields
  aiSummary?: string;
  aiExpanded?: string;
  aiFlashcard?: { question: string; answer: string };
  // Review tracking
  lastReviewedAt?: Date;
  reviewCount: number;
  nextReviewAt?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface BookWithNotes extends Book {
  notes: Note[];
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  noteIds: string[];
  createdAt: Date;
}

export interface ReviewSession {
  id: string;
  noteIds: string[];
  completedNoteIds: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    bookIds?: string[];
    types?: NoteType[];
    tags?: string[];
    folderIds?: string[];
    dateRange?: { start: Date; end: Date };
  };
  createdAt: Date;
}

export interface ExportFormat {
  type: 'markdown' | 'csv' | 'json' | 'pdf';
  includeImages: boolean;
  includeContext: boolean;
  groupByBook: boolean;
}
