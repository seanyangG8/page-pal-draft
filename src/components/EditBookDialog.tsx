import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Book, BookFormat } from '@/types';
import { Pencil, Smartphone, Headphones, Book as BookIcon, Save } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

interface EditBookDialogProps {
  book: Book | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bookId: string, updates: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => void;
}

const formatOptions: { value: BookFormat; label: string; icon: typeof BookIcon; description: string }[] = [
  { value: 'physical', label: 'Physical', icon: BookIcon, description: 'Paper book' },
  { value: 'ebook', label: 'E-book', icon: Smartphone, description: 'Digital reader' },
  { value: 'audiobook', label: 'Audiobook', icon: Headphones, description: 'Audio format' },
];

export function EditBookDialog({ book, open, onOpenChange, onSave }: EditBookDialogProps) {
  const { success } = useHaptic();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState<BookFormat>('physical');
  const [coverUrl, setCoverUrl] = useState('');
  const [searchCoverUrl, setSearchCoverUrl] = useState<string | null>(null);
  const [coverChoice, setCoverChoice] = useState<'existing' | 'search'>('existing');
  const [isbn, setIsbn] = useState('');

  // Populate form when book changes
  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setFormat(book.format);
      setCoverUrl(book.coverUrl || '');
      setCoverChoice('existing');
      setSearchCoverUrl(null);
      setIsbn(book.isbn || '');
    }
  }, [book]);

  // Fetch a suggested cover from Google Books based on title
  useEffect(() => {
    const controller = new AbortController();
    const fetchCover = async () => {
      if (!title || title.trim().length < 2) {
        setSearchCoverUrl(null);
        return;
      }
      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title.trim())}&maxResults=1`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        const cover =
          data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') ||
          data.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail?.replace('http:', 'https:');
        setSearchCoverUrl(cover || null);
      } catch {
        // ignore fetch errors (cancel or network)
      }
    };
    const timer = setTimeout(fetchCover, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [title]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !title.trim() || !author.trim()) return;

    const selectedCover =
      coverChoice === 'search' && searchCoverUrl
        ? searchCoverUrl
        : coverUrl.trim() || undefined;

    success();
    onSave(book.id, {
      title: title.trim(),
      author: author.trim(),
      format,
      coverUrl: selectedCover,
      isbn: isbn.trim() || undefined,
    });
    
    onOpenChange(false);
  };

  if (!book) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 font-display text-xl">
            <Pencil className="w-5 h-5 text-primary" />
            Edit book
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        <form onSubmit={handleSubmit} className="contents">
          <ResponsiveDialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="The book's title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
                maxLength={200}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-author">Author</Label>
              <Input
                id="edit-author"
                placeholder="Who wrote it?"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-background"
                maxLength={100}
              />
            </div>

            {/* Book format selector */}
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="grid grid-cols-3 gap-2">
                {formatOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormat(value)}
                    className={`flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl border transition-all duration-200 touch-manipulation active:scale-95 ${
                      format === value 
                        ? 'border-primary bg-primary/5 text-primary shadow-soft' 
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
              <Label>Cover</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCoverChoice('existing')}
                  className={`relative overflow-hidden w-16 h-22 sm:w-20 sm:h-28 rounded-lg border transition-all ${
                    coverChoice === 'existing'
                      ? 'border-primary shadow-soft'
                      : 'border-border hover:border-primary/50'
                  }`}
                  aria-label="Use current/custom cover"
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt="Current cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center font-medium bg-background/80 rounded px-1">
                    Current
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCoverChoice('search')}
                  disabled={!searchCoverUrl}
                  className={`relative overflow-hidden w-16 h-22 sm:w-20 sm:h-28 rounded-lg border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    coverChoice === 'search'
                      ? 'border-primary shadow-soft'
                      : 'border-border hover:border-primary/50'
                  }`}
                  aria-label="Use searched cover"
                >
                  {searchCoverUrl ? (
                    <img src={searchCoverUrl} alt="Search cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] text-center font-medium bg-background/80 rounded px-1">
                    Search
                  </span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Tap to switch covers. Edit the URL below to set a custom image.
              </p>
              <Input
                id="edit-cover"
                placeholder="https://..."
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  setCoverChoice('existing');
                }}
                className="bg-background"
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-isbn">ISBN (optional)</Label>
              <Input
                id="edit-isbn"
                placeholder="978-..."
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="bg-background"
                maxLength={20}
              />
            </div>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !author.trim()} className="flex-1 sm:flex-initial gap-2">
              <Save className="w-4 h-4" />
              Save changes
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
