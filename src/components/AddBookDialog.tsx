import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookFormat } from '@/types';
import { BookOpen, Smartphone, Headphones, Book, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const formatOptions: { value: BookFormat; label: string; icon: typeof Book; description: string }[] = [
  { value: 'physical', label: 'Physical', icon: Book, description: 'Paper book' },
  { value: 'ebook', label: 'E-book', icon: Smartphone, description: 'Digital reader' },
  { value: 'audiobook', label: 'Audiobook', icon: Headphones, description: 'Audio format' },
];

export function AddBookDialog({ open, onOpenChange, onAdd }: AddBookDialogProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState<BookFormat>('physical');
  const [coverUrl, setCoverUrl] = useState('');
  const [isbn, setIsbn] = useState('');
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search Open Library API when title changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (title.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`
        );
        const data = await response.json();
        
        const bookSuggestions: BookSuggestion[] = data.docs?.slice(0, 5).map((doc: any) => ({
          title: doc.title,
          author: doc.author_name?.[0] || 'Unknown Author',
          coverUrl: doc.cover_i 
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : undefined,
          isbn: doc.isbn?.[0],
        })) || [];
        
        setSuggestions(bookSuggestions);
        setShowSuggestions(bookSuggestions.length > 0);
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (suggestion: BookSuggestion) => {
    setTitle(suggestion.title);
    setAuthor(suggestion.author);
    if (suggestion.coverUrl) setCoverUrl(suggestion.coverUrl);
    if (suggestion.isbn) setIsbn(suggestion.isbn);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    
    onAdd({
      title: title.trim(),
      author: author.trim(),
      format,
      coverUrl: coverUrl.trim() || undefined,
      isbn: isbn.trim() || undefined,
    });
    
    setTitle('');
    setAuthor('');
    setFormat('physical');
    setCoverUrl('');
    setIsbn('');
    setSuggestions([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            Add a new book
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          {/* Title with suggestions */}
          <div className="space-y-2 relative" ref={suggestionsRef}>
            <Label htmlFor="title">Title</Label>
            <div className="relative">
              <Input
                id="title"
                placeholder="Start typing to search..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="bg-background pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left hover:bg-accent transition-colors",
                      index !== suggestions.length - 1 && "border-b border-border"
                    )}
                  >
                    {suggestion.coverUrl ? (
                      <img 
                        src={suggestion.coverUrl} 
                        alt={suggestion.title}
                        className="w-10 h-14 object-cover rounded shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                        <Book className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{suggestion.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{suggestion.author}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Who wrote it?"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Book format selector */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    format === value 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cover">Cover URL (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="cover"
                placeholder="https://..."
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="bg-background flex-1"
              />
              {coverUrl && (
                <img 
                  src={coverUrl} 
                  alt="Cover preview" 
                  className="w-11 h-11 object-cover rounded border border-border"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="isbn">ISBN (optional)</Label>
            <Input
              id="isbn"
              placeholder="978-..."
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !author.trim()}>
              Add book
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}