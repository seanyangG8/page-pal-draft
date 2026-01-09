import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Book, BookFormat } from '@/types';
import { Pencil, Smartphone, Headphones, Book as BookIcon } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [format, setFormat] = useState<BookFormat>('physical');
  const [coverUrl, setCoverUrl] = useState('');
  const [isbn, setIsbn] = useState('');

  // Populate form when book changes
  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setFormat(book.format);
      setCoverUrl(book.coverUrl || '');
      setIsbn(book.isbn || '');
    }
  }, [book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !title.trim() || !author.trim()) return;
    
    onSave(book.id, {
      title: title.trim(),
      author: author.trim(),
      format,
      coverUrl: coverUrl.trim() || undefined,
      isbn: isbn.trim() || undefined,
    });
    
    onOpenChange(false);
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Pencil className="w-5 h-5 text-primary" />
            Edit book
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200 ${
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
            <Label htmlFor="edit-cover">Cover URL (optional)</Label>
            <Input
              id="edit-cover"
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
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
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !author.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
