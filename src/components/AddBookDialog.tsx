import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookFormat } from '@/types';
import { BookOpen, Smartphone, Headphones, Book } from 'lucide-react';

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (book: { title: string; author: string; format: BookFormat; coverUrl?: string; isbn?: string }) => void;
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
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2 px-8 pb-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="The book's title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
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
            <Input
              id="cover"
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="bg-background"
            />
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
          
          <DialogFooter className="mt-6 px-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !author.trim()}>
              Add book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
