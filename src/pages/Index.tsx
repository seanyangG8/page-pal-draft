import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Book, Note, BookFormat } from '@/types';
import { getBooks, addBook, deleteBook, updateBook, getNotes, deleteNote, updateNote, searchNotes, saveBooks, saveNotes } from '@/lib/store';
import { BookOpen, Search, Library, Sparkles, Filter, Download, Upload, Users, Rss } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
const Index = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [editBookOpen, setEditBookOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'notes' | 'feed' | 'friends'>('library');
  const [showFilters, setShowFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Note[] | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<{
    bookId?: string;
    noteType?: string;
    tags: string[];
  }>({ tags: [] });

  useEffect(() => {
    // Simulate brief loading for skeleton demo
    const timer = setTimeout(() => {
      setBooks(getBooks());
      setNotes(getNotes());
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleAddBook = (bookData: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => {
    const newBook = addBook(bookData);
    setBooks(prev => [...prev, newBook]);
    toast.success('Book added to your library');
  };

  const handleEditBook = (book: Book) => {
    setBookToEdit(book);
    setEditBookOpen(true);
  };

  const handleSaveBook = (bookId: string, updates: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => {
    const updated = updateBook(bookId, updates);
    if (updated) {
      setBooks(prev => prev.map(b => b.id === bookId ? updated : b));
      toast.success('Book updated');
    }
  };

  const handleDeleteBook = (bookId: string) => {
    deleteBook(bookId);
    setBooks(prev => prev.filter(b => b.id !== bookId));
    setNotes(prev => prev.filter(n => n.bookId !== bookId));
    toast.success('Book removed');
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setBooks(getBooks()); // Refresh to update note counts
    toast.success('Note deleted');
  };

  const handleImport = (importedBooks: Book[], importedNotes: Note[]) => {
    // Merge with existing data
    const existingBooks = getBooks();
    const existingNotes = getNotes();
    
    const allBooks = [...existingBooks, ...importedBooks];
    const allNotes = [...existingNotes, ...importedNotes];
    
    saveBooks(allBooks);
    saveNotes(allNotes);
    
    setBooks(allBooks);
    setNotes(allNotes);
    toast.success(`Imported ${importedBooks.length} books and ${importedNotes.length} notes`);
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    updateNote(updatedNote.id, updatedNote);
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    toast.success('Note updated');
  };

  const getBookFormat = (bookId: string): BookFormat | undefined => {
    return books.find(b => b.id === bookId)?.format;
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.context?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBook = !activeFilters.bookId || note.bookId === activeFilters.bookId;
    const matchesType = !activeFilters.noteType || note.type === activeFilters.noteType;
    const matchesTags = activeFilters.tags.length === 0 || 
      activeFilters.tags.every(tag => note.tags?.includes(tag));
    return matchesSearch && matchesBook && matchesType && matchesTags;
  });

  const getBookTitle = (bookId: string) => {
    return books.find(b => b.id === bookId)?.title || 'Unknown';
  };

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen">
      <Header 
        hasBooks={books.length > 0} 
        onShowWelcome={() => setShowWelcome(true)} 
      />
      
      <main className="container py-6 md:py-8 pb-24 md:pb-24 px-4 md:px-6">
        {/* Hero section for empty state or when showWelcome is true */}
        {(books.length === 0 && notes.length === 0) || showWelcome ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up gradient-hero rounded-3xl -mx-4 px-4 py-12">
            <div className="w-24 h-24 rounded-2xl gradient-amber flex items-center justify-center mb-8 shadow-elevated animate-float shine">
              <Sparkles className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-tight">
              Welcome to <span className="text-gradient">Marginalia</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Your personal companion for capturing and organizing thoughts from every book you read.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => {
                  setAddBookOpen(true);
                  setShowWelcome(false);
                }}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-primary-foreground gradient-amber shadow-elevated hover:shadow-glow transition-all duration-300 hover:-translate-y-1 hover:scale-105"
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
            {/* Tabs and search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
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

            {/* Review Widget */}
            {activeTab === 'notes' && (
              <div className="mb-6">
                <ReviewWidget onStartReview={(notes) => setReviewNotes(notes)} />
              </div>
            )}

            {/* Filters Panel */}
            {activeTab === 'notes' && showFilters && (
              <div className="mb-6">
                <FilterPanel
                  books={books}
                  onFilterChange={setActiveFilters}
                  activeFilters={activeFilters}
                />
              </div>
            )}

            {/* Library tab */}
            {activeTab === 'library' && (
              <div className="library-bg wall-texture rounded-2xl -mx-2 px-2 py-6 sm:-mx-4 sm:px-4">
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
                    books={books.filter(b => 
                      !searchQuery || 
                      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.author.toLowerCase().includes(searchQuery.toLowerCase())
                    )}
                    onBookClick={(bookId) => navigate(`/book/${bookId}`)}
                    onDeleteBook={handleDeleteBook}
                    onEditBook={handleEditBook}
                    onReorder={() => setBooks(getBooks())}
                  />
                )}
              </div>
            )}

            {/* Notes tab */}
            {activeTab === 'notes' && (
              <>
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
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {filteredNotes.map((note, index) => (
                      <div 
                        key={note.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${index * 50}ms` }}
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
                      </div>
                    ))}
                  </div>
                )}
              </>
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
        onImport={handleImport}
      />

      {/* Review session */}
      {reviewNotes && (
        <ReviewSession
          notes={reviewNotes}
          onComplete={() => {
            setReviewNotes(null);
            setNotes(getNotes()); // Refresh notes after review
          }}
          onClose={() => setReviewNotes(null)}
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
