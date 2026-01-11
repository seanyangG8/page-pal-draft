import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookFormat } from '@/types';
import { BookOpen, Smartphone, Headphones, Book, Loader2, Search, Camera, Upload, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Search Google Books API when title changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (title.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=5`
        );
        
        if (!response.ok) {
          throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        const bookSuggestions: BookSuggestion[] = data.items?.slice(0, 5).map((item: any) => {
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
        setShowSuggestions(bookSuggestions.length > 0);
      } catch (error) {
        console.error('Failed to fetch book suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
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

  const startCamera = async () => {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessingImage(true);
    // TODO: When Cloud is enabled, send image to AI for book recognition
    // For now, just show the captured image as a preview
    setTimeout(() => {
      setIsProcessingImage(false);
      // Placeholder: In the future, AI will extract title, author, etc.
    }, 1000);
  };

  const clearCapturedImage = () => {
    setCapturedImage(null);
    setIsProcessingImage(false);
  };

  // Clean up camera on unmount or dialog close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setIsCameraOpen(false);
    }
  }, [open]);

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
          {/* Camera/Upload section - compact inline style */}
          <Collapsible open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
                  isCameraOpen && "text-foreground"
                )}
              >
                <div className="p-1.5 rounded-md bg-muted group-hover:bg-accent transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <span>Scan cover</span>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  isCameraOpen && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 animate-in slide-in-from-top-2 duration-200">
              <div className="rounded-xl border border-dashed border-border p-4 space-y-3 bg-gradient-to-b from-muted/50 to-transparent">
                {capturedImage ? (
                  <div className="relative">
                    <img 
                      src={capturedImage} 
                      alt="Captured book cover" 
                      className="w-full max-h-48 object-contain rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={clearCapturedImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {isProcessingImage && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing cover...
                        </div>
                      </div>
                    )}
                  </div>
                ) : streamRef.current ? (
                  <div className="relative">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full rounded-lg"
                    />
                    <div className="flex justify-center gap-2 mt-2">
                      <Button
                        type="button"
                        onClick={captureFromCamera}
                        className="gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Capture
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={stopCamera}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all group"
                      >
                        <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Take Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:bg-accent hover:border-primary/30 transition-all group"
                      >
                        <div className="p-3 rounded-full bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Upload</span>
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Photo of the book cover
                    </p>
                  </div>
                )}
                {capturedImage && (
                  <p className="text-xs text-muted-foreground text-center">
                    AI recognition requires Cloud to be enabled
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
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