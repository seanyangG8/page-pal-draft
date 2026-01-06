import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BookCard } from '@/components/BookCard';
import { NoteCard } from '@/components/NoteCard';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { AddBookDialog } from '@/components/AddBookDialog';
import { FloatingAddButton } from '@/components/FloatingAddButton';
import { Book, Note } from '@/types';
import { getBooks, addBook, deleteBook, getNotes, deleteNote, searchNotes } from '@/lib/store';
import { BookOpen, Search, Library, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'notes'>('library');

  useEffect(() => {
    setBooks(getBooks());
    setNotes(getNotes());
  }, []);

  const handleAddBook = (bookData: { title: string; author: string; coverUrl?: string }) => {
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

  const filteredNotes = searchQuery 
    ? searchNotes(searchQuery) 
    : notes;

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
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'library' | 'notes')} className="w-full sm:w-auto">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="library" className="gap-2">
                    <Library className="w-4 h-4" />
                    Library
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <Search className="w-4 h-4" />
                    All Notes
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="w-full sm:w-72">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={activeTab === 'library' ? 'Search books...' : 'Search notes...'}
                />
              </div>
            </div>

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
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {books
                      .filter(b => 
                        !searchQuery || 
                        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.author.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((book, index) => (
                        <div 
                          key={book.id} 
                          className="animate-fade-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <BookCard
                            book={book}
                            onClick={() => navigate(`/book/${book.id}`)}
                            onDelete={() => handleDeleteBook(book.id)}
                          />
                        </div>
                      ))
                    }
                  </div>
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
                          showBookTitle={getBookTitle(note.bookId)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
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
    </div>
  );
};

export default Index;
