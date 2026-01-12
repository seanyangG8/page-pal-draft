import { useState, useEffect, useRef } from 'react';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookFormat } from '@/types';
import { BookOpen, Smartphone, Headphones, Book, Loader2, Search, Camera, X, ArrowLeft, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/use-haptic';

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (book: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => void;
}

interface BookSuggestion {
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
}

const formatOptions: { value: BookFormat; label: string; icon: typeof Book }[] = [
  { value: 'physical', label: 'Physical', icon: Book },
  { value: 'ebook', label: 'E-book', icon: Smartphone },
  { value: 'audiobook', label: 'Audiobook', icon: Headphones },
];

type ViewState = 'search' | 'camera' | 'confirm';

export function AddBookDialog({ open, onOpenChange, onAdd }: AddBookDialogProps) {
  const { success } = useHaptic();
  const [view, setView] = useState<ViewState>('search');
  const [title, setTitle] = useState('');
  const [selectedBook, setSelectedBook] = useState<BookSuggestion | null>(null);
  const [format, setFormat] = useState<BookFormat>('physical');
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search Google Books API when title changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (title.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=6`
        );
        
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        
        const bookSuggestions: BookSuggestion[] = data.items?.slice(0, 6).map((item: any) => {
          const volumeInfo = item.volumeInfo;
          return {
            title: volumeInfo.title,
            author: volumeInfo.authors?.[0] || 'Unknown Author',
            coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
            isbn: volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
                  volumeInfo.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier,
          };
        }) || [];
        
        setSuggestions(bookSuggestions);
      } catch (error) {
        console.error('Failed to fetch book suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [title]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && view === 'search') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, view]);

  const selectBook = (book: BookSuggestion) => {
    setSelectedBook(book);
    setView('confirm');
  };

  const startCamera = async () => {
    setView('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to access camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFromCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessingImage(true);
    // TODO: When Cloud is enabled, send image to AI for book recognition
    setTimeout(() => {
      setIsProcessingImage(false);
    }, 1500);
  };

  const resetDialog = () => {
    setView('search');
    setTitle('');
    setSelectedBook(null);
    setFormat('physical');
    setSuggestions([]);
    setCapturedImage(null);
    stopCamera();
  };

  // Clean up on dialog close
  useEffect(() => {
    if (!open) {
      resetDialog();
    }
  }, [open]);

  const handleSubmit = () => {
    if (!selectedBook) return;
    
    success();
    onAdd({
      title: selectedBook.title,
      author: selectedBook.author,
      format,
      coverUrl: selectedBook.coverUrl,
      isbn: selectedBook.isbn,
    });
    
    resetDialog();
    onOpenChange(false);
  };

  const goBack = () => {
    if (view === 'confirm') {
      setSelectedBook(null);
      setView('search');
    } else if (view === 'camera') {
      stopCamera();
      setCapturedImage(null);
      setView('search');
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md overflow-hidden">
        <ResponsiveDialogHeader className="pb-0">
          <ResponsiveDialogTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
            {view !== 'search' && (
              <button 
                onClick={goBack}
                className="p-1 -ml-1 rounded-md hover:bg-accent transition-colors touch-manipulation active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <BookOpen className="w-5 h-5 text-primary" />
            {view === 'confirm' ? 'Confirm book' : 'Add a book'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        <ResponsiveDialogBody>
          {/* Search View */}
          {view === 'search' && (
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Search by title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background pr-10 h-11 sm:h-12 text-base"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Results */}
              {suggestions.length > 0 ? (
                <div className="space-y-2 max-h-[240px] sm:max-h-[280px] overflow-y-auto ios-scroll overscroll-contain">
                  {suggestions.map((book, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectBook(book)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left touch-manipulation active:scale-[0.98]"
                    >
                      {book.coverUrl ? (
                        <img 
                          src={book.coverUrl} 
                          alt={book.title}
                          className="w-11 h-14 sm:w-12 sm:h-16 object-cover rounded-md shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-14 sm:w-12 sm:h-16 bg-muted rounded-md flex items-center justify-center">
                          <Book className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{book.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : title.length >= 2 && !isSearching ? (
                <p className="text-sm text-muted-foreground text-center py-6 sm:py-8">
                  No books found. Try a different search.
                </p>
              ) : (
                <div className="py-6 sm:py-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Start typing to search for books
                  </p>
                  <div className="flex items-center gap-3 justify-center">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </div>
              )}

              {/* Camera/Upload options */}
              {(suggestions.length === 0 || title.length < 2) && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border hover:bg-accent hover:border-primary/30 transition-all group touch-manipulation active:scale-95"
                >
                  <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Take Photo</span>
                </button>
              </div>
              )}
            </div>
          )}

          {/* Camera View */}
          {view === 'camera' && (
            <div className="space-y-4">
              {capturedImage ? (
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured book cover" 
                    className="w-full aspect-[3/4] object-contain rounded-xl bg-muted"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 touch-manipulation"
                    onClick={() => setCapturedImage(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {isProcessingImage && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-xl gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-sm font-medium">Analyzing cover...</p>
                    </div>
                  )}
                  {!isProcessingImage && (
                    <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-dashed border-border text-center">
                      <p className="text-sm text-muted-foreground">
                        AI recognition requires Cloud to be enabled
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 touch-manipulation"
                        onClick={goBack}
                      >
                        Search manually instead
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full aspect-[3/4] object-cover rounded-xl bg-muted"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <Button
                      type="button"
                      size="lg"
                      onClick={captureFromCamera}
                      className="rounded-full w-16 h-16 p-0 touch-manipulation active:scale-95"
                    >
                      <Camera className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm View */}
          {view === 'confirm' && selectedBook && (
            <div className="space-y-4 sm:space-y-5">
              {/* Book preview */}
              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border relative">
                {selectedBook.coverUrl ? (
                  <img 
                    src={selectedBook.coverUrl} 
                    alt={selectedBook.title}
                    className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-16 h-22 sm:w-20 sm:h-28 bg-muted rounded-lg flex items-center justify-center">
                    <Book className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0 py-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={editAuthor}
                        onChange={(e) => setEditAuthor(e.target.value)}
                        placeholder="Author"
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs touch-manipulation"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs touch-manipulation"
                          onClick={() => {
                            if (editTitle.trim() && editAuthor.trim()) {
                              setSelectedBook({
                                ...selectedBook,
                                title: editTitle.trim(),
                                author: editAuthor.trim(),
                              });
                              setIsEditing(false);
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-[15px] sm:text-base line-clamp-2">{selectedBook.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{selectedBook.author}</p>
                      {selectedBook.isbn && (
                        <p className="text-xs text-muted-foreground mt-2">ISBN: {selectedBook.isbn}</p>
                      )}
                    </>
                  )}
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTitle(selectedBook.title);
                      setEditAuthor(selectedBook.author);
                      setIsEditing(true);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors touch-manipulation"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Format selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Format</p>
                <div className="grid grid-cols-3 gap-2">
                  {formatOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormat(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border transition-all touch-manipulation active:scale-95",
                        format === value 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border hover:border-primary/50 hover:bg-accent'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ResponsiveDialogBody>

        {/* Confirm view footer */}
        {view === 'confirm' && selectedBook && (
          <ResponsiveDialogFooter>
            <Button 
              onClick={handleSubmit} 
              className="w-full h-11 sm:h-12 text-base gap-2 touch-manipulation"
            >
              <Check className="w-5 h-5" />
              Add to library
            </Button>
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
