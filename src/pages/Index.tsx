import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Bookshelf } from '@/components/Bookshelf';
import { BookshelfSkeleton, NoteCardSkeleton } from '@/components/BookshelfSkeleton';
import { NoteCard } from '@/components/NoteCard';
import { EditNoteDialog } from '@/components/EditNoteDialog';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { AddBookDialog } from '@/components/AddBookDialog';
import { EditBookDialog } from '@/components/EditBookDialog';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { ReviewWidget } from '@/components/ReviewWidget';
import { ReviewSession } from '@/components/ReviewSession';
import { FilterPanel } from '@/components/FilterPanel';
import { ExportDialog } from '@/components/ExportDialog';
import { ImportDialog } from '@/components/ImportDialog';
import { SocialFeed } from '@/components/social/SocialFeed';
import { FriendsPanel } from '@/components/social/FriendsPanel';
import { MobileTabBar } from '@/components/MobileTabBar';
import { PullToRefresh } from '@/components/PullToRefresh';
import { staggerContainer, staggerItem } from '@/components/PageTransition';
import { Book, Note, BookFormat } from '@/types';
import { useBooks, useBookMutations, useNotes, useNoteMutations, useNoteHelpers, useReviewSessionMutations } from '@/api/hooks';
import { BookOpen, Search, Library, Sparkles, Filter, Download, Upload, Users, Rss } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { SavedFiltersBar } from '@/components/SavedFiltersBar';
import { FolderManager } from '@/components/FolderManager';
import { CollectionManager } from '@/components/CollectionManager';
const Index = () => {
  const navigate = useNavigate();
  const { data: booksData, isLoading: booksLoading } = useBooks();
  const { data: notesData, isLoading: notesLoading } = useNotes();
  const { create: createBook, update: updateBookMutation, remove: deleteBookMutation } = useBookMutations();
  const { create: createNote, update: updateNoteMutation, remove: deleteNoteMutation } = useNoteMutations();
  const { searchNotesClient } = useNoteHelpers();
  const { create: createReviewSession, complete: completeReviewSession } = useReviewSessionMutations();

  const books = booksData || [];
  const notes = notesData || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [editBookOpen, setEditBookOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'notes' | 'feed' | 'friends'>('library');
  const [showFilters, setShowFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Note[] | null>(null);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const isLoading = booksLoading || notesLoading;
  const [activeFilters, setActiveFilters] = useState<{
    bookId?: string;
    noteType?: string;
    folderId?: string;
    tags: string[];
  }>({ tags: [] });

  const handleAddBook = (bookData: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => {
    createBook.mutate(bookData, {
      onSuccess: () => toast.success('Book added to your library'),
      onError: () => toast.error('Failed to add book'),
    });
  };

  const handleEditBook = (book: Book) => {
    setBookToEdit(book);
    setEditBookOpen(true);
  };

  const handleSaveBook = (bookId: string, updates: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => {
    updateBookMutation.mutate(
      { id: bookId, updates },
      {
        onSuccess: () => toast.success('Book updated'),
        onError: () => toast.error('Failed to update book'),
      }
    );
  };

  const handleDeleteBook = (bookId: string) => {
    deleteBookMutation.mutate(bookId, {
      onSuccess: () => toast.success('Book removed'),
      onError: () => toast.error('Failed to remove book'),
    });
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNoteMutation.mutate(noteId, {
      onSuccess: () => toast.success('Note deleted'),
      onError: () => toast.error('Failed to delete note'),
    });
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    updateNoteMutation.mutate(
      { id: updatedNote.id, updates: updatedNote },
      {
        onSuccess: () => toast.success('Note updated'),
        onError: () => toast.error('Failed to update note'),
      }
    );
  };

  const getBookFormat = (bookId: string): BookFormat | undefined => {
    return books.find(b => b.id === bookId)?.format;
  };

  const handleRefresh = useCallback(async () => {
    // No-op: React Query handles refetch
  }, []);

  const filteredNotes = useMemo(() => {
    const base = notes;
    const matchesSearch = (note: Note) =>
      !searchQuery ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.context?.toLowerCase().includes(searchQuery.toLowerCase());
    return base.filter((note) => {
      const okSearch = matchesSearch(note);
      const okBook = !activeFilters.bookId || note.bookId === activeFilters.bookId;
      const okType = !activeFilters.noteType || note.type === activeFilters.noteType;
      const okFolder = !activeFilters.folderId || note.folderId === activeFilters.folderId;
      const okTags = activeFilters.tags.length === 0 || activeFilters.tags.every((tag) => note.tags?.includes(tag));
      return okSearch && okBook && okType && okFolder && okTags;
    });
  }, [notes, searchQuery, activeFilters]);

  const getBookTitle = (bookId: string) => {
    return books.find(b => b.id === bookId)?.title || 'Unknown';
  };

  const isMobile = useIsMobile();
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  return (
    <div className="min-h-screen">
      <Header 
        hasBooks={books.length > 0} 
        onShowWelcome={() => setShowWelcome(true)} 
      />
      
      <main className="px-4 md:px-6 lg:container py-4 md:py-6 lg:py-8 pb-28 md:pb-24">
        {/* Hero section for empty state or when showWelcome is true */}
        {(books.length === 0 && notes.length === 0) || showWelcome ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up gradient-hero rounded-2xl md:rounded-3xl px-4 py-10 md:py-12">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl gradient-amber flex items-center justify-center mb-6 md:mb-8 shadow-elevated animate-float shine">
              <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">
              Welcome to <span className="text-gradient">Marginalia</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-lg mb-8 md:mb-10 leading-relaxed">
              Your personal companion for capturing and organizing thoughts from every book you read.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <button 
                onClick={() => {
                  setAddBookOpen(true);
                  setShowWelcome(false);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-semibold text-primary-foreground gradient-amber shadow-elevated hover:shadow-glow transition-all duration-300 active:scale-95 md:hover:-translate-y-1 md:hover:scale-105"
              >
                <BookOpen className="w-5 h-5" />
                Add a book
              </button>
              {showWelcome && books.length > 0 && (
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 transition-all duration-200"
                >
                  <Library className="w-4 h-4" />
                  Back to Library
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Sticky search and tabs section */}
            <div className="sticky top-12 md:top-14 z-40 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-background/95 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Desktop tabs - hidden on mobile */}
                {!isMobile && (
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'notes' | 'feed' | 'friends')} className="w-full sm:w-auto">
                    <TabsList className="bg-secondary/80 shadow-soft p-1">
                      <TabsTrigger value="library" className="gap-2 data-[state=active]:shadow-card">
                        <Library className="w-4 h-4" />
                        Library
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="gap-2 data-[state=active]:shadow-card">
                        <Search className="w-4 h-4" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger value="feed" className="gap-2 data-[state=active]:shadow-card">
                        <Rss className="w-4 h-4" />
                        Feed
                      </TabsTrigger>
                      <TabsTrigger value="friends" className="gap-2 data-[state=active]:shadow-card">
                        <Users className="w-4 h-4" />
                        Friends
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}

                {(activeTab === 'library' || activeTab === 'notes') && (
                  <div className="flex items-center gap-2">
                    <div className="w-full sm:w-72">
                      <SearchBar 
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={activeTab === 'library' ? 'Search books...' : 'Search notes...'}
                      />
                    </div>
                    {activeTab === 'notes' && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowFilters(!showFilters)}
                          className={showFilters ? 'bg-primary/10' : ''}
                        >
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setExportOpen(true)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setImportOpen(true)}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Review Widget */}
            {activeTab === 'notes' && (
              <div className="mb-6">
            <ReviewWidget 
              onStartReview={(notes) => {
                createReviewSession.mutate(
                  notes.map((n) => n.id),
                  {
                    onSuccess: (session) => {
                      setReviewSessionId(session.id);
                      setReviewNotes(notes);
                    },
                    onError: () => toast.error('Failed to start review session'),
                  },
                );
              }} 
            />
              </div>
            )}

            {/* Filters Panel */}
            {activeTab === 'notes' && showFilters && (
              <div className="mb-6 space-y-4">
                <FilterPanel
                  books={books}
                  allTags={allTags}
                  onFilterChange={setActiveFilters}
                  activeFilters={activeFilters}
                />
                <SavedFiltersBar
                  activeFilters={activeFilters}
                  onApply={setActiveFilters}
                  books={books}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-3 rounded-lg border bg-card/50">
                    <FolderManager
                      selectedFolderId={activeFilters.folderId}
                      onSelectFolder={(id) =>
                        setActiveFilters((prev) => ({
                          ...prev,
                          folderId: id,
                        }))
                      }
                    />
                  </div>
                  <div className="p-3 rounded-lg border bg-card/50">
                    <CollectionManager />
                  </div>
                </div>
              </div>
            )}

            {/* Library tab */}
            {activeTab === 'library' && (
              <PullToRefresh onRefresh={handleRefresh}>
                <div className="library-bg wall-texture rounded-2xl -mx-2 px-2 py-3 sm:-mx-4 sm:px-4 mt-2">
                  {isLoading ? (
                    <BookshelfSkeleton />
                  ) : books.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title="Your library is empty"
                      description="Add books to start capturing your reading notes and highlights."
                      actionLabel="Add a book"
                      onAction={() => setAddBookOpen(true)}
                    />
                  ) : (
                      <Bookshelf
                        books={books.filter(
                          (b) =>
                            !searchQuery ||
                            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.author.toLowerCase().includes(searchQuery.toLowerCase())
                        )}
                        onBookClick={(bookId) => navigate(`/book/${bookId}`)}
                        onDeleteBook={handleDeleteBook}
                        onEditBook={handleEditBook}
                        onReorder={() => {}}
                      />
                  )}
                </div>
              </PullToRefresh>
            )}

            {/* Notes tab */}
            {activeTab === 'notes' && (
              <PullToRefresh onRefresh={handleRefresh}>
                {isLoading ? (
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {[...Array(3)].map((_, i) => (
                      <NoteCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title={searchQuery ? 'No notes found' : 'No notes yet'}
                    description={searchQuery ? 'Try a different search term.' : 'Start adding notes from your books to see them here.'}
                  />
                ) : (
                  <motion.div 
                    className="space-y-3 max-w-2xl mx-auto"
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
                          onUpdate={handleNoteUpdate}
                          onEdit={() => setEditingNote(note)}
                          onClick={() => setEditingNote(note)}
                          showBookTitle={getBookTitle(note.bookId)}
                          onBookClick={() => navigate(`/book/${note.bookId}`)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </PullToRefresh>
            )}

            {/* Feed tab */}
            {activeTab === 'feed' && (
              <SocialFeed />
            )}

            {/* Friends tab */}
            {activeTab === 'friends' && (
              <FriendsPanel />
            )}
          </>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && !(books.length === 0 && notes.length === 0) && !showWelcome && (
        <MobileTabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}

      {/* Floating add button */}
      {(books.length > 0 || notes.length > 0) && activeTab === 'library' && (
        <FloatingAddButton 
          onClick={() => setAddBookOpen(true)} 
          label="Add book"
        />
      )}

      {/* Add book dialog */}
      <AddBookDialog
        open={addBookOpen}
        onOpenChange={setAddBookOpen}
        onAdd={handleAddBook}
      />

      {/* Edit book dialog */}
      <EditBookDialog
        book={bookToEdit}
        open={editBookOpen}
        onOpenChange={setEditBookOpen}
        onSave={handleSaveBook}
      />

      {/* Export dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        notes={filteredNotes}
        books={books}
      />

      {/* Import dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      {/* Review session */}
      {reviewNotes && (
        <ReviewSession
          notes={reviewNotes}
          sessionId={reviewSessionId ?? undefined}
          onComplete={() => {
            if (reviewSessionId) {
              completeReviewSession.mutate(reviewSessionId);
            }
            setReviewSessionId(null);
            setReviewNotes(null);
          }}
          onClose={() => {
            setReviewSessionId(null);
            setReviewNotes(null);
          }}
        />
      )}

      {/* Edit note dialog */}
      <EditNoteDialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
        note={editingNote}
        onSave={handleNoteUpdate}
        bookFormat={editingNote ? getBookFormat(editingNote.bookId) : undefined}
      />
    </div>
  );
};

export default Index;
