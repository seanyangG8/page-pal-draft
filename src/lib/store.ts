import { Book, Note } from '@/types';

// Simple in-memory store with localStorage persistence
const BOOKS_KEY = 'marginalia_books';
const NOTES_KEY = 'marginalia_notes';

export function getBooks(): Book[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(BOOKS_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((b: any) => ({
    ...b,
    createdAt: new Date(b.createdAt),
  }));
}

export function saveBooks(books: Book[]): void {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function addBook(book: Omit<Book, 'id' | 'createdAt' | 'notesCount'>): Book {
  const books = getBooks();
  const newBook: Book = {
    ...book,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    notesCount: 0,
  };
  books.push(newBook);
  saveBooks(books);
  return newBook;
}

export function deleteBook(bookId: string): void {
  const books = getBooks().filter(b => b.id !== bookId);
  saveBooks(books);
  // Also delete associated notes
  const notes = getNotes().filter(n => n.bookId !== bookId);
  saveNotes(notes);
}

export function getNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(NOTES_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
  }));
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const notes = getNotes();
  const newNote: Note = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  notes.push(newNote);
  saveNotes(notes);

  // Update book notes count
  const books = getBooks();
  const bookIndex = books.findIndex(b => b.id === note.bookId);
  if (bookIndex !== -1) {
    books[bookIndex].notesCount++;
    saveBooks(books);
  }

  return newNote;
}

export function updateNote(noteId: string, updates: Partial<Note>): Note | null {
  const notes = getNotes();
  const noteIndex = notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) return null;
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    ...updates,
    updatedAt: new Date(),
  };
  saveNotes(notes);
  return notes[noteIndex];
}

export function deleteNote(noteId: string): void {
  const notes = getNotes();
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const filteredNotes = notes.filter(n => n.id !== noteId);
  saveNotes(filteredNotes);

  // Update book notes count
  const books = getBooks();
  const bookIndex = books.findIndex(b => b.id === note.bookId);
  if (bookIndex !== -1 && books[bookIndex].notesCount > 0) {
    books[bookIndex].notesCount--;
    saveBooks(books);
  }
}

export function getNotesForBook(bookId: string): Note[] {
  return getNotes().filter(n => n.bookId === bookId);
}

export function searchNotes(query: string): Note[] {
  const lowerQuery = query.toLowerCase();
  return getNotes().filter(n => 
    n.content.toLowerCase().includes(lowerQuery) ||
    n.context?.toLowerCase().includes(lowerQuery) ||
    n.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}
