import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { NoteCard } from '@/components/NoteCard';
import { AddNoteDialog } from '@/components/AddNoteDialog';
import { EditNoteDialog } from '@/components/EditNoteDialog';
import { EmptyState } from '@/components/EmptyState';
import { CollapsibleFAB } from '@/components/CollapsibleFAB';
import { FloatingRecorder } from '@/components/FloatingRecorder';
import { SearchBar } from '@/components/SearchBar';
import { PullToRefresh } from '@/components/PullToRefresh';
import { staggerContainer, staggerItem } from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Book, Note, NoteType, MediaType } from '@/types';
import { useBooks as useBooksHook, useNotesByBook, useNoteMutations } from '@/api/hooks';
import { ArrowLeft, BookOpen, PenLine, Quote, Lightbulb, HelpCircle, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const isMobile = useIsMobile();
  const { data: booksData } = useBooksHook();
  const { data: notesData, isLoading: notesLoading } = useNotesByBook(bookId || '');
  const { create: createNote, update: updateNoteMutation, remove: deleteNoteMutation } = useNoteMutations();
  const [book, setBook] = useState<Book | null>(null);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | NoteType>('all');
  const [pendingRecording, setPendingRecording] = useState<{ url: string; duration: number; transcript?: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<{ url: string; extractedText?: string } | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const notes = notesData || [];

  useEffect(() => {
    if (!bookId) return;
    if (booksData) {
      const found = booksData.find((b) => b.id === bookId);
      if (found) {
        setBook(found);
      } else {
        navigate('/');
      }
    }
  }, [bookId, booksData, notesData, navigate]);

  const handleAddNote = async (noteData: { 
    type: NoteType; 
    mediaType: MediaType;
    content: string; 
    location?: string; 
    chapter?: string;
    context?: string;
    timestamp?: string;
    imageUrl?: string;
    extractedText?: string;
    audioUrl?: string;
    audioDuration?: number;
    tags?: string[];
    isPrivate?: boolean;
  }): Promise<string> => {
    if (!bookId) return '';
    try {
      const created = await createNote.mutateAsync({ bookId, ...noteData });
      setPendingRecording(null);
      setPendingImage(null);
      toast.success('Note saved');
      return created.id;
    } catch (err) {
      toast.error('Failed to save note');
      return '';
    }
  };

  const handleUpdateNoteLocation = (noteId: string, location: string, timestamp?: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      const updated = { ...note, location, timestamp };
      updateNoteMutation.mutate({ id: noteId, updates: updated });
    }
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
    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => toast.success('Note deleted'),
      onError: () => toast.error('Failed to delete note'),
    });
  };

  const handleUpdateNote = (updatedNote: Note) => {
    updateNoteMutation.mutate(
      { id: updatedNote.id, updates: updatedNote },
      {
        onSuccess: () => toast.success('Note updated'),
        onError: () => toast.error('Failed to update note'),
      }
    );
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = !searchQuery || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.context?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || note.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [notes, searchQuery, activeFilter]);

  const handleRefresh = useCallback(async () => {}, [bookId]);

  if (!book || notesLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="px-4 md:px-6 lg:container py-4 md:py-6 lg:py-8 pb-28 md:pb-24">
        {/* iOS-style compact header */}
        <div className="mb-4 md:mb-8">
          {/* Back button - iOS style */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary mb-3 -ml-1 active:opacity-70 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[17px]">Library</span>
          </button>

          {/* Compact book info row */}
          <div className="flex items-center gap-3 animate-fade-in">
            {/* Book cover - always visible, compact on mobile */}
            <div className="w-12 h-16 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-lg bg-gradient-to-br from-secondary to-muted flex-shrink-0 shadow-sm overflow-hidden">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Book details - compact */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-[17px] sm:text-xl md:text-2xl lg:text-3xl font-semibold text-foreground leading-tight line-clamp-2">
                {book.title}
              </h1>
              <p className="text-[15px] sm:text-base md:text-lg text-muted-foreground">
                {book.author}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1 bg-muted/50 px-2 py-0.5 rounded-full">
                <PenLine className="w-3 h-3" />
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
          </div>
        </div>

        {/* Search and iOS Segmented Control */}
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          {/* iOS-style search bar */}
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search notes..."
          />
          
          {/* iOS Segmented Control - no scrolling */}
          {isMobile ? (
            <div className="bg-muted/60 p-1 rounded-[10px] flex">
              {noteFilters.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={cn(
                    "flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all touch-manipulation",
                    activeFilter === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {label === 'Questions' ? 'Q&A' : label === 'Actions' ? 'Tasks' : label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {noteFilters.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant={activeFilter === type ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveFilter(type)}
                  className="gap-1.5 h-9"
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Notes list */}
        <PullToRefresh onRefresh={handleRefresh}>
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
            <motion.div 
              className="space-y-3 max-w-2xl"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filteredNotes.map((note) => (
                <motion.div 
                  key={note.id}
                  variants={staggerItem}
                >
                  <NoteCard
                    note={note}
                    onDelete={() => handleDeleteNote(note.id)}
                    onUpdate={handleUpdateNote}
                    onEdit={() => setEditingNote(note)}
                    onClick={() => setEditingNote(note)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </PullToRefresh>
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
        <div className={cn(
          "fixed right-4 md:right-6 z-50",
          isMobile ? "bottom-[calc(56px+env(safe-area-inset-bottom)+16px)]" : "bottom-6"
        )}>
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
        onUpdateLocation={handleUpdateNoteLocation}
        bookId={book.id}
        bookTitle={book.title}
        bookAuthor={book.author}
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
