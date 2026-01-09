import { Book, Note, Folder, Collection, SavedFilter, ReviewSession } from '@/types';

// Storage keys
const BOOKS_KEY = 'marginalia_books';
const NOTES_KEY = 'marginalia_notes';
const FOLDERS_KEY = 'marginalia_folders';
const COLLECTIONS_KEY = 'marginalia_collections';
const FILTERS_KEY = 'marginalia_saved_filters';
const REVIEW_KEY = 'marginalia_review_sessions';
const ACTIVITY_KEY = 'marginalia_activity_dates';
const GOALS_KEY = 'marginalia_reading_goals';

// ===== READING ACTIVITY TRACKING =====
export interface ReadingGoals {
  yearlyBookTarget: number;
  year: number;
}

export function getReadingGoals(): ReadingGoals {
  if (typeof window === 'undefined') return { yearlyBookTarget: 12, year: new Date().getFullYear() };
  const stored = localStorage.getItem(GOALS_KEY);
  if (!stored) return { yearlyBookTarget: 12, year: new Date().getFullYear() };
  return JSON.parse(stored);
}

export function saveReadingGoals(goals: ReadingGoals): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function getActivityDates(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ACTIVITY_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
}

export function saveActivityDates(dates: string[]): void {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(dates));
}

export function recordActivity(): void {
  const today = new Date().toISOString().split('T')[0];
  const dates = getActivityDates();
  if (!dates.includes(today)) {
    dates.push(today);
    saveActivityDates(dates);
  }
}

export function calculateStreak(): { current: number; longest: number } {
  const dates = getActivityDates().sort().reverse();
  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak (must include today or yesterday)
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // Calculate longest streak
  const sortedAsc = [...dates].sort();
  tempStreak = 1;
  longestStreak = 1;
  for (let i = 1; i < sortedAsc.length; i++) {
    const prevDate = new Date(sortedAsc[i - 1]);
    const currDate = new Date(sortedAsc[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }
  
  return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
}

export function getBooksReadThisYear(): number {
  const currentYear = new Date().getFullYear();
  const books = getBooks();
  return books.filter(b => new Date(b.createdAt).getFullYear() === currentYear).length;
}

// ===== BOOKS =====
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
  
  // Record activity for streak tracking
  recordActivity();
  
  return newBook;
}

export function updateBook(bookId: string, updates: Partial<Book>): Book | null {
  const books = getBooks();
  const index = books.findIndex(b => b.id === bookId);
  if (index === -1) return null;
  books[index] = { ...books[index], ...updates };
  saveBooks(books);
  return books[index];
}

export function deleteBook(bookId: string): void {
  const books = getBooks().filter(b => b.id !== bookId);
  saveBooks(books);
  const notes = getNotes().filter(n => n.bookId !== bookId);
  saveNotes(notes);
}

export function reorderBooks(bookIds: string[]): void {
  const books = getBooks();
  const bookMap = new Map(books.map(b => [b.id, b]));
  const reordered = bookIds.map(id => bookMap.get(id)).filter(Boolean) as Book[];
  // Add any books not in the list (safety)
  books.forEach(b => {
    if (!bookIds.includes(b.id)) reordered.push(b);
  });
  saveBooks(reordered);
}

// ===== NOTES =====
export function getNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(NOTES_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
    lastReviewedAt: n.lastReviewedAt ? new Date(n.lastReviewedAt) : undefined,
    nextReviewAt: n.nextReviewAt ? new Date(n.nextReviewAt) : undefined,
  }));
}

export function saveNotes(notes: Note[]): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount'>): Note {
  const notes = getNotes();
  const newNote: Note = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewCount: 0,
  };
  notes.push(newNote);
  saveNotes(notes);

  // Record activity for streak tracking
  recordActivity();

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
    n.extractedText?.toLowerCase().includes(lowerQuery) ||
    n.tags?.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

// ===== FOLDERS =====
export function getFolders(): Folder[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FOLDERS_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((f: any) => ({
    ...f,
    createdAt: new Date(f.createdAt),
  }));
}

export function saveFolders(folders: Folder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function addFolder(name: string, color?: string): Folder {
  const folders = getFolders();
  const newFolder: Folder = {
    id: crypto.randomUUID(),
    name,
    color,
    createdAt: new Date(),
  };
  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
}

export function deleteFolder(folderId: string): void {
  const folders = getFolders().filter(f => f.id !== folderId);
  saveFolders(folders);
  // Remove folder from notes
  const notes = getNotes().map(n => 
    n.folderId === folderId ? { ...n, folderId: undefined } : n
  );
  saveNotes(notes);
}

// ===== COLLECTIONS =====
export function getCollections(): Collection[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(COLLECTIONS_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
  }));
}

export function saveCollections(collections: Collection[]): void {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export function addCollection(name: string, description?: string): Collection {
  const collections = getCollections();
  const newCollection: Collection = {
    id: crypto.randomUUID(),
    name,
    description,
    noteIds: [],
    createdAt: new Date(),
  };
  collections.push(newCollection);
  saveCollections(collections);
  return newCollection;
}

export function updateCollection(collectionId: string, updates: Partial<Collection>): Collection | null {
  const collections = getCollections();
  const index = collections.findIndex(c => c.id === collectionId);
  if (index === -1) return null;
  collections[index] = { ...collections[index], ...updates };
  saveCollections(collections);
  return collections[index];
}

export function deleteCollection(collectionId: string): void {
  const collections = getCollections().filter(c => c.id !== collectionId);
  saveCollections(collections);
}

// ===== SAVED FILTERS =====
export function getSavedFilters(): SavedFilter[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FILTERS_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((f: any) => ({
    ...f,
    createdAt: new Date(f.createdAt),
  }));
}

export function saveSavedFilters(filters: SavedFilter[]): void {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

export function addSavedFilter(filter: Omit<SavedFilter, 'id' | 'createdAt'>): SavedFilter {
  const filters = getSavedFilters();
  const newFilter: SavedFilter = {
    ...filter,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  filters.push(newFilter);
  saveSavedFilters(filters);
  return newFilter;
}

export function deleteSavedFilter(filterId: string): void {
  const filters = getSavedFilters().filter(f => f.id !== filterId);
  saveSavedFilters(filters);
}

// ===== REVIEW SESSIONS =====
export function getReviewSessions(): ReviewSession[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(REVIEW_KEY);
  if (!stored) return [];
  return JSON.parse(stored).map((s: any) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
  }));
}

export function saveReviewSessions(sessions: ReviewSession[]): void {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(sessions));
}

export function createReviewSession(noteCount: number = 5): ReviewSession {
  const notes = getNotes();
  // Prioritize notes that haven't been reviewed or are due for review
  const now = new Date();
  const eligibleNotes = notes
    .filter(n => !n.nextReviewAt || n.nextReviewAt <= now)
    .sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0));
  
  const selectedNotes = eligibleNotes.slice(0, noteCount);
  
  const session: ReviewSession = {
    id: crypto.randomUUID(),
    noteIds: selectedNotes.map(n => n.id),
    completedNoteIds: [],
    createdAt: new Date(),
  };
  
  const sessions = getReviewSessions();
  sessions.push(session);
  saveReviewSessions(sessions);
  return session;
}

export function markNoteReviewed(noteId: string): void {
  const note = getNotes().find(n => n.id === noteId);
  if (!note) return;
  
  const reviewCount = (note.reviewCount || 0) + 1;
  // Simple spaced repetition: double the interval each time
  const daysUntilNext = Math.min(Math.pow(2, reviewCount), 30);
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + daysUntilNext);
  
  updateNote(noteId, {
    lastReviewedAt: new Date(),
    reviewCount,
    nextReviewAt,
  });
}

// ===== EXPORT =====
export function exportNotesToMarkdown(notes: Note[], books: Book[]): string {
  const bookMap = new Map(books.map(b => [b.id, b]));
  let markdown = '# My Reading Notes\n\n';
  
  const notesByBook = notes.reduce((acc, note) => {
    const bookId = note.bookId;
    if (!acc[bookId]) acc[bookId] = [];
    acc[bookId].push(note);
    return acc;
  }, {} as Record<string, Note[]>);
  
  for (const [bookId, bookNotes] of Object.entries(notesByBook)) {
    const book = bookMap.get(bookId);
    if (book) {
      markdown += `## ${book.title}\n*by ${book.author}*\n\n`;
    }
    
    for (const note of bookNotes) {
      const typeEmoji = { quote: '💬', idea: '💡', question: '❓', action: '✅' }[note.type];
      markdown += `### ${typeEmoji} ${note.type.charAt(0).toUpperCase() + note.type.slice(1)}\n`;
      if (note.location) markdown += `*${note.location}*\n\n`;
      markdown += `${note.content}\n\n`;
      if (note.context) markdown += `> ${note.context}\n\n`;
      if (note.tags?.length) markdown += `Tags: ${note.tags.map(t => `#${t}`).join(' ')}\n\n`;
      markdown += '---\n\n';
    }
  }
  
  return markdown;
}

export function exportNotesToCSV(notes: Note[], books: Book[]): string {
  const bookMap = new Map(books.map(b => [b.id, b]));
  const headers = ['Book', 'Author', 'Type', 'Content', 'Location', 'Context', 'Tags', 'Created'];
  
  const rows = notes.map(note => {
    const book = bookMap.get(note.bookId);
    return [
      book?.title || '',
      book?.author || '',
      note.type,
      `"${note.content.replace(/"/g, '""')}"`,
      note.location || '',
      note.context ? `"${note.context.replace(/"/g, '""')}"` : '',
      note.tags?.join(', ') || '',
      note.createdAt.toISOString(),
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

export function exportNotesToJSON(notes: Note[], books: Book[]): string {
  return JSON.stringify({ books, notes }, null, 2);
}

// ===== IMPORT =====
export function importFromJSON(jsonString: string): { books: Book[]; notes: Note[] } | null {
  try {
    const data = JSON.parse(jsonString);
    if (data.books && data.notes) {
      return {
        books: data.books.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt),
        })),
        notes: data.notes.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        })),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// ===== BOOK SUMMARY =====
export function generateBookSummary(bookId: string): {
  totalNotes: number;
  byType: Record<string, number>;
  topTags: string[];
  recentNotes: Note[];
} {
  const notes = getNotesForBook(bookId);
  
  const byType = notes.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const tagCounts = notes.flatMap(n => n.tags || []).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
  
  const recentNotes = notes
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);
  
  return { totalNotes: notes.length, byType, topTags, recentNotes };
}

// ===== ALL TAGS =====
export function getAllTags(): string[] {
  const notes = getNotes();
  const tags = new Set<string>();
  notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}

// ===== GET NOTES FOR REVIEW =====
export function getNotesForReview(limit: number = 10): Note[] {
  const notes = getNotes();
  const now = new Date();
  
  return notes
    .filter(n => !n.nextReviewAt || n.nextReviewAt <= now)
    .sort((a, b) => {
      // Prioritize notes never reviewed, then by oldest review date
      if (!a.lastReviewedAt && !b.lastReviewedAt) return 0;
      if (!a.lastReviewedAt) return -1;
      if (!b.lastReviewedAt) return 1;
      return a.lastReviewedAt.getTime() - b.lastReviewedAt.getTime();
    })
    .slice(0, limit);
}

// Alias exports for convenience
export const exportToMarkdown = exportNotesToMarkdown;
export const exportToCSV = exportNotesToCSV;
export const exportToJSON = exportNotesToJSON;
