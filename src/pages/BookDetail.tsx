import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { NoteCard } from '@/components/NoteCard';
import { AddNoteDialog } from '@/components/AddNoteDialog';
import { EmptyState } from '@/components/EmptyState';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Book, Note, NoteType } from '@/types';
import { getBooks, getNotesForBook, addNote, deleteNote } from '@/lib/store';
import { ArrowLeft, BookOpen, PenLine, Quote, Lightbulb, HelpCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const noteFilters = [
  { type: 'all' as const, label: 'All', icon: null },
  { type: 'quote' as NoteType, label: 'Quotes', icon: Quote },
  { type: 'idea' as NoteType, label: 'Ideas', icon: Lightbulb },
  { type: 'question' as NoteType, label: 'Questions', icon: HelpCircle },
  { type: 'action' as NoteType, label: 'Actions', icon: CheckCircle },
];

const BookDetail = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | NoteType>('all');

  useEffect(() => {
    if (!bookId) return;
    
    const books = getBooks();
    const foundBook = books.find(b => b.id === bookId);
    if (foundBook) {
      setBook(foundBook);
      setNotes(getNotesForBook(bookId));
    } else {
      navigate('/');
    }
  }, [bookId, navigate]);

  const handleAddNote = (noteData: { type: NoteType; content: string; location?: string; context?: string }) => {
    if (!bookId) return;
    
    const newNote = addNote({
      bookId,
      ...noteData,
    });
    setNotes(prev => [newNote, ...prev]);
    toast.success('Note saved');
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Note deleted');
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.context?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || note.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 pb-24">
        {/* Back button and book info */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to library
          </Button>

          <div className="flex items-start gap-6 animate-fade-in">
            {/* Book cover */}
            <div className="hidden sm:block w-24 h-36 rounded-lg bg-gradient-to-br from-secondary to-muted flex-shrink-0 shadow-card overflow-hidden">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Book details */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-3">
                {book.author}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <PenLine className="w-4 h-4" />
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-64">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search notes..."
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {noteFilters.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant={activeFilter === type ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveFilter(type)}
                className="flex-shrink-0 gap-1.5"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <EmptyState
            icon={PenLine}
            title="No notes yet"
            description="Start capturing quotes, ideas, and thoughts from this book."
            actionLabel="Add a note"
            onAction={() => setAddNoteOpen(true)}
          />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            icon={PenLine}
            title="No matching notes"
            description="Try adjusting your search or filter."
          />
        ) : (
          <div className="space-y-3 max-w-2xl">
            {filteredNotes.map((note, index) => (
              <div 
                key={note.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <NoteCard
                  note={note}
                  onDelete={() => handleDeleteNote(note.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating add button */}
      <FloatingAddButton 
        onClick={() => setAddNoteOpen(true)} 
        label="Add note"
      />

      {/* Add note dialog */}
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        onAdd={handleAddNote}
        bookTitle={book.title}
      />
    </div>
  );
};

export default BookDetail;
