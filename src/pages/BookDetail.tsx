import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { NoteCard } from '@/components/NoteCard';
import { AddNoteDialog } from '@/components/AddNoteDialog';
import { EditNoteDialog } from '@/components/EditNoteDialog';
import { EmptyState } from '@/components/EmptyState';
import { CollapsibleFAB } from '@/components/CollapsibleFAB';
import { FloatingRecorder } from '@/components/FloatingRecorder';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Book, Note, NoteType, MediaType } from '@/types';
import { getBooks, getNotesForBook, addNote, deleteNote, updateNote } from '@/lib/store';
import { ArrowLeft, BookOpen, PenLine, Quote, Lightbulb, HelpCircle, CheckCircle, Plus } from 'lucide-react';
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
  const [pendingRecording, setPendingRecording] = useState<{ url: string; duration: number; transcript?: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<{ url: string; extractedText?: string } | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddNote = (noteData: { 
    type: NoteType; 
    mediaType: MediaType;
    content: string; 
    location?: string; 
    context?: string;
    timestamp?: string;
    imageUrl?: string;
    extractedText?: string;
    audioUrl?: string;
    audioDuration?: number;
    tags?: string[];
  }) => {
    if (!bookId) return;
    
    const newNote = addNote({
      bookId,
      ...noteData,
    });
    setNotes(prev => [newNote, ...prev]);
    toast.success('Note saved');
    setPendingRecording(null);
    setPendingImage(null);
  };

  const handleQuickRecording = (data: { url: string; duration: number; transcript?: string }) => {
    setPendingRecording(data);
    setAddNoteOpen(true);
  };

  const handleQuickCapture = (data: { url: string; extractedText?: string }) => {
    setPendingImage(data);
    setAddNoteOpen(true);
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success('Note deleted');
  };

  const handleUpdateNote = (updatedNote: Note) => {
    updateNote(updatedNote.id, updatedNote);
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    toast.success('Note updated');
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
      
      <main className="px-4 md:px-6 lg:container py-4 md:py-6 lg:py-8 pb-28 md:pb-24">
        {/* Back button and book info */}
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-3 md:mb-4 -ml-2 text-muted-foreground hover:text-foreground h-10 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to library
          </Button>

          <div className="flex items-start gap-4 md:gap-6 animate-fade-in">
            {/* Book cover */}
            <div className="hidden sm:block w-20 md:w-24 h-28 md:h-36 rounded-lg bg-gradient-to-br from-secondary to-muted flex-shrink-0 shadow-card overflow-hidden">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Book details */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 leading-tight">
                {book.title}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-2 md:mb-3">
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
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="w-full sm:w-64">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search notes..."
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {noteFilters.map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant={activeFilter === type ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveFilter(type)}
                className="flex-shrink-0 gap-1.5 h-9 touch-manipulation"
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
                  onUpdate={handleUpdateNote}
                  onEdit={() => setEditingNote(note)}
                  onClick={() => setEditingNote(note)}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
            const url = event.target?.result as string;
            handleQuickCapture({ url, extractedText: undefined });
          };
          reader.readAsDataURL(file);
          if (cameraInputRef.current) cameraInputRef.current.value = '';
        }}
        className="hidden"
      />

      {/* Floating Recorder */}
      {showRecorder && (
        <div className="fixed bottom-6 right-6 z-50">
          <FloatingRecorder
            autoStart
            onRecordingComplete={(data) => {
              setShowRecorder(false);
              handleQuickRecording(data);
            }}
          />
        </div>
      )}

      {/* Collapsible FAB */}
      {!showRecorder && (
        <CollapsibleFAB
          onAddNote={() => setAddNoteOpen(true)}
          onStartRecording={() => setShowRecorder(true)}
          onOpenCamera={() => cameraInputRef.current?.click()}
          cameraInputRef={cameraInputRef}
        />
      )}

      {/* Add note dialog */}
      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={(open) => {
          setAddNoteOpen(open);
          if (!open) {
            setPendingRecording(null);
            setPendingImage(null);
          }
        }}
        onAdd={handleAddNote}
        bookId={book.id}
        bookTitle={book.title}
        bookFormat={book.format}
        initialRecording={pendingRecording}
        initialImage={pendingImage}
      />

      {/* Edit note dialog */}
      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
        note={editingNote}
        onSave={handleUpdateNote}
        bookFormat={book.format}
      />
    </div>
  );
};

export default BookDetail;
