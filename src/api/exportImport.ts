import { Book, Note } from '@/types';

export function exportNotesToMarkdown(notes: Note[], books: Book[]): string {
  const bookMap = new Map(books.map((b) => [b.id, b]));
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
      const typeLabel = { quote: 'QUOTE', idea: 'IDEA', question: 'QUESTION', action: 'ACTION' }[note.type];
      markdown += `### ${typeLabel} ${note.type.charAt(0).toUpperCase() + note.type.slice(1)}\n`;
      if (note.location) markdown += `*${note.location}*\n\n`;
      markdown += `${note.content}\n\n`;
      if (note.context) markdown += `> ${note.context}\n\n`;
      if (note.tags?.length) markdown += `Tags: ${note.tags.map((t) => `#${t}`).join(' ')}\n\n`;
      markdown += '---\n\n';
    }
  }

  return markdown;
}

export function exportNotesToCSV(notes: Note[], books: Book[]): string {
  const bookMap = new Map(books.map((b) => [b.id, b]));
  const headers = ['Book', 'Author', 'Type', 'Content', 'Location', 'Context', 'Tags', 'Created'];

  const rows = notes.map((note) => {
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
          updatedAt: n.updatedAt ? new Date(n.updatedAt) : new Date(),
          lastReviewedAt: n.lastReviewedAt ? new Date(n.lastReviewedAt) : undefined,
          nextReviewAt: n.nextReviewAt ? new Date(n.nextReviewAt) : undefined,
        })),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const exportToMarkdown = exportNotesToMarkdown;
export const exportToCSV = exportNotesToCSV;
export const exportToJSON = exportNotesToJSON;