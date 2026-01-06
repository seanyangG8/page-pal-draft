export type NoteType = 'quote' | 'idea' | 'question' | 'action';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  createdAt: Date;
  notesCount: number;
}

export interface Note {
  id: string;
  bookId: string;
  type: NoteType;
  content: string;
  location?: string; // page number, chapter, or timestamp
  context?: string; // why it matters
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface BookWithNotes extends Book {
  notes: Note[];
}
