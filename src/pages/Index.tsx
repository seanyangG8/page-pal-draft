import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Bookshelf } from '@/components/Bookshelf';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { AddBookDialog } from '@/components/AddBookDialog';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { ReviewWidget } from '@/components/ReviewWidget';
import { ReviewSession } from '@/components/ReviewSession';
import { FilterPanel } from '@/components/FilterPanel';
import { ExportDialog } from '@/components/ExportDialog';
import { ImportDialog } from '@/components/ImportDialog';
import { SocialFeed } from '@/components/social/SocialFeed';
import { FriendsPanel } from '@/components/social/FriendsPanel';
import { Book, Note, BookFormat } from '@/types';
import { getBooks, addBook, deleteBook, getNotes, deleteNote, searchNotes, saveBooks, saveNotes } from '@/lib/store';
import { BookOpen, Search, Library, Sparkles, Filter, Download, Upload, Users, Rss } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'notes' | 'feed' | 'friends'>('library');
  const [showFilters, setShowFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Note[] | null>(null);
  const [activeFilters, setActiveFilters] = useState<{
    bookId?: string;
    noteType?: string;
    tags: string[];
  }>({ tags: [] });

  useEffect(() => {
    setBooks(getBooks());
    setNotes(getNotes());
  }, []);

  const handleAddBook = (bookData: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => {
    const newBook = addBook(bookData);
    setBooks(prev => [...prev, newBook]);
    toast.success('Book added to your library');
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
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 pb-24">
        {/* Hero section for empty state */}
        {books.length === 0 && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
            <div className="w-20 h-20 rounded-2xl gradient-amber flex items-center justify-center mb-6 shadow-card animate-float">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome to Marginalia
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              Your personal companion for capturing and organizing thoughts from every book you read.
            </p>
            <button 
              onClick={() => setAddBookOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-primary-foreground gradient-amber shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              Add your first book
            </button>
          </div>
        ) : (
          <>
            {/* Tabs and search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'notes' | 'feed' | 'friends')} className="w-full sm:w-auto">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="library" className="gap-2">
                    <Library className="w-4 h-4" />
                    Library
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <Search className="w-4 h-4" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="feed" className="gap-2">
                    <Rss className="w-4 h-4" />
                    Feed
                  </TabsTrigger>
                  <TabsTrigger value="friends" className="gap-2">
                    <Users className="w-4 h-4" />
                    Friends
                  </TabsTrigger>
                </TabsList>
              </Tabs>

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
              <>
                {books.length === 0 ? (
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
                    onReorder={() => setBooks(getBooks())}
                  />
                )}
              </>
            )}

            {/* Notes tab */}
            {activeTab === 'notes' && (
              <>
                {filteredNotes.length === 0 ? (
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
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <NoteCard
                          note={note}
                          onDelete={() => handleDeleteNote(note.id)}
                          onUpdate={handleNoteUpdate}
                          showBookTitle={getBookTitle(note.bookId)}
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
    </div>
  );
};

export default Index;
