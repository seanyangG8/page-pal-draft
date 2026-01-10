import { Book } from '@/types';
import { BookOpen, MoreVertical, Trash2, GripVertical, Pencil } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState, useRef, useCallback } from 'react';
import { reorderBooks } from '@/lib/store';

interface BookshelfProps {
  books: Book[];
  onBookClick: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onEditBook?: (book: Book) => void;
  onReorder?: () => void;
}

interface BookSpineProps {
  book: Book;
  onClick: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  isTouchDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  bookRef?: (el: HTMLDivElement | null) => void;
}

function BookSpine({ 
  book, 
  onClick, 
  onDelete,
  onEdit,
  isDragging,
  isDragOver,
  isTouchDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  bookRef,
}: BookSpineProps) {
  // Generate a consistent color based on book title for variety
  const getSpineColor = (title: string) => {
    const colors = [
      'from-amber-700 to-amber-900',
      'from-emerald-700 to-emerald-900',
      'from-blue-700 to-blue-900',
      'from-rose-700 to-rose-900',
      'from-purple-700 to-purple-900',
      'from-slate-600 to-slate-800',
      'from-orange-700 to-orange-900',
      'from-teal-700 to-teal-900',
    ];
    const index = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div 
      ref={bookRef}
      className={`group relative transition-all duration-300 ease-out touch-none ${isDragging || isTouchDragging ? 'opacity-40 scale-90 z-50' : ''} ${isDragOver ? 'translate-x-4' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Drop indicator */}
      {isDragOver && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary rounded-full animate-pulse z-20" />
      )}
      
      {/* Drag handle indicator */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 sm:group-hover:opacity-60 transition-opacity z-10 cursor-grab">
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>
      
      {/* Book standing upright */}
      <div 
        className="relative cursor-pointer transition-all duration-300 group-hover:-translate-y-3"
        onClick={onClick}
        style={{ perspective: '600px' }}
      >
        {/* Book with cover image or colored spine */}
        {book.coverUrl ? (
          // Show book cover at an angle - fixed size container
          <div 
            className="relative w-14 sm:w-16 md:w-20 h-24 sm:h-28 md:h-36"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Book cover - starts tilted, straightens on hover */}
            <div
              className="book-cover absolute inset-0 rounded-sm shadow-lg overflow-hidden transition-transform duration-300 group-hover:[transform:rotateY(-3deg)]"
              style={{
                transform: 'rotateY(-18deg)',
                transformOrigin: 'left center',
              }}
            >
              <img 
                src={book.coverUrl} 
                alt={book.title}
                className="w-full h-full object-cover pointer-events-none"
              />
              {/* Lighting overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10" />
            </div>
            {/* Page edges - more visible with shadow */}
            <div 
              className="absolute top-1 -right-1 h-[calc(100%-8px)] w-3 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-50 dark:from-stone-300 dark:via-stone-200 dark:to-stone-100 rounded-r-sm shadow-md border-r border-stone-300/50"
              style={{
                transform: 'translateZ(-2px)',
              }}
            >
              {/* Page lines */}
              <div className="absolute inset-y-2 left-0 w-px bg-stone-300/50" />
              <div className="absolute inset-y-2 left-0.5 w-px bg-stone-300/30" />
            </div>
          </div>
        ) : (
          // Show colored spine (no cover) - same fixed size and angle
          <div 
            className="relative w-14 sm:w-16 md:w-20 h-24 sm:h-28 md:h-36"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            <div 
              className={`book-cover absolute inset-0 bg-gradient-to-b ${getSpineColor(book.title)} rounded-sm shadow-lg flex flex-col items-center justify-center overflow-hidden transition-transform duration-300 group-hover:[transform:rotateY(-3deg)]`}
              style={{
                transform: 'rotateY(-18deg)',
                transformOrigin: 'left center',
              }}
            >
              {/* Spine texture overlay */}
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)]" />
              
              {/* Title on spine (rotated) */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                <span className="text-[9px] sm:text-[10px] font-medium text-white/90 px-1 text-center leading-tight line-clamp-3 rotate-180">
                  {book.title}
                </span>
              </div>
              
              {/* Decorative lines */}
              <div className="absolute top-2 left-1 right-1 h-0.5 bg-amber-300/30 rounded-full" />
              <div className="absolute bottom-2 left-1 right-1 h-0.5 bg-amber-300/30 rounded-full" />
            </div>
            
            {/* Page edges - more visible with shadow */}
            <div 
              className="absolute top-1 -right-1 h-[calc(100%-8px)] w-3 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-50 dark:from-stone-300 dark:via-stone-200 dark:to-stone-100 rounded-r-sm shadow-md border-r border-stone-300/50"
              style={{
                transform: 'translateZ(-2px)',
              }}
            >
              {/* Page lines */}
              <div className="absolute inset-y-2 left-0 w-px bg-stone-300/50" />
              <div className="absolute inset-y-2 left-0.5 w-px bg-stone-300/30" />
            </div>
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-7 w-7 shadow-card rounded-full">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-36">
            {onEdit && (
              <>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  Edit book
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete book
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Note count badge */}
      {book.notesCount > 0 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-soft">
          {book.notesCount}
        </div>
      )}
    </div>
  );
}

export function Bookshelf({ books, onBookClick, onDeleteBook, onEditBook, onReorder }: BookshelfProps) {
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null);
  const [localBooks, setLocalBooks] = useState<Book[]>(books);
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  
  const bookRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when books prop changes
  if (books !== localBooks && !draggedBookId && !touchDragId) {
    setLocalBooks(books);
  }

  const setBookRef = useCallback((bookId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      bookRefs.current.set(bookId, el);
    } else {
      bookRefs.current.delete(bookId);
    }
  }, []);

  const handleDragStart = (e: React.DragEvent, bookId: string) => {
    setDraggedBookId(bookId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    if (draggedBookId && dragOverBookId && draggedBookId !== dragOverBookId) {
      reorderBooksInternal(draggedBookId, dragOverBookId);
    }
    setDraggedBookId(null);
    setDragOverBookId(null);
  };

  const handleDragOver = (e: React.DragEvent, bookId: string) => {
    e.preventDefault();
    if (dragOverBookId !== bookId && draggedBookId !== bookId) {
      setDragOverBookId(bookId);
    }
  };

  const handleDragLeave = () => {
    setDragOverBookId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, bookId: string) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Long press to start drag
    longPressTimer.current = setTimeout(() => {
      setTouchDragId(bookId);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 300);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, bookId: string) => {
    if (!touchDragId) {
      // Cancel long press if moved too much before drag started
      if (longPressTimer.current && touchStartPos.current) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    
    // Find which book we're over
    let foundBookId: string | null = null;
    bookRefs.current.forEach((el, id) => {
      if (id !== touchDragId) {
        const rect = el.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          foundBookId = id;
        }
      }
    });
    
    if (foundBookId !== dragOverBookId) {
      setDragOverBookId(foundBookId);
    }
  }, [touchDragId, dragOverBookId]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (touchDragId && dragOverBookId && touchDragId !== dragOverBookId) {
      reorderBooksInternal(touchDragId, dragOverBookId);
    }
    
    setTouchDragId(null);
    setDragOverBookId(null);
    touchStartPos.current = null;
  }, [touchDragId, dragOverBookId]);

  const reorderBooksInternal = (fromId: string, toId: string) => {
    const newBooks = [...localBooks];
    const draggedIndex = newBooks.findIndex(b => b.id === fromId);
    const targetIndex = newBooks.findIndex(b => b.id === toId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newBooks.splice(draggedIndex, 1);
      newBooks.splice(targetIndex, 0, removed);
      setLocalBooks(newBooks);
      reorderBooks(newBooks.map(b => b.id));
      onReorder?.();
    }
  };

  // Group books into shelves (max 8 per shelf for good visual)
  const booksPerShelf = 8;
  const shelves: Book[][] = [];
  
  for (let i = 0; i < localBooks.length; i += booksPerShelf) {
    shelves.push(localBooks.slice(i, i + booksPerShelf));
  }

  // Ensure at least one shelf even if empty
  if (shelves.length === 0) {
    shelves.push([]);
  }

  return (
    <div className="space-y-4">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div 
          key={shelfIndex}
          className="relative animate-fade-up"
          style={{ animationDelay: `${shelfIndex * 100}ms` }}
        >
          {/* Shelf with books */}
          <div className="relative">
            {/* Books container */}
            <div className="flex items-end justify-start gap-2 sm:gap-3 px-6 pb-4 min-h-[9rem] sm:min-h-[11rem] md:min-h-[13rem] overflow-x-auto overflow-y-hidden scrollbar-hide">
              {shelfBooks.map((book, bookIndex) => (
                <div 
                  key={book.id}
                  className="flex-shrink-0 animate-fade-up"
                  style={{ animationDelay: `${bookIndex * 60}ms` }}
                >
                  <BookSpine 
                    book={book} 
                    onClick={() => !touchDragId && onBookClick(book.id)}
                    onDelete={() => onDeleteBook(book.id)}
                    onEdit={onEditBook ? () => onEditBook(book) : undefined}
                    isDragging={draggedBookId === book.id}
                    isDragOver={dragOverBookId === book.id && draggedBookId !== book.id && touchDragId !== book.id}
                    isTouchDragging={touchDragId === book.id}
                    onDragStart={(e) => handleDragStart(e, book.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, book.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onTouchStart={(e) => handleTouchStart(e, book.id)}
                    onTouchMove={(e) => handleTouchMove(e, book.id)}
                    onTouchEnd={handleTouchEnd}
                    bookRef={setBookRef(book.id)}
                  />
                </div>
              ))}
              
              {/* Empty shelf message */}
              {shelfBooks.length === 0 && (
                <div className="flex items-center justify-center w-full h-52 text-muted-foreground/50">
                  <div className="flex flex-col items-center gap-3">
                    <BookOpen className="w-10 h-10" />
                    <span className="text-sm font-medium">Your shelf awaits...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Wooden shelf - subtle and refined */}
            <div className="relative h-3 sm:h-4 bg-gradient-to-b from-stone-400 to-stone-500 dark:from-stone-600 dark:to-stone-700 rounded-sm shadow-md">
              {/* Shelf highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white/20 to-transparent rounded-t-sm" />
              
              {/* Shelf front edge */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20" />
              
              {/* Shelf shadow underneath */}
              <div className="absolute -bottom-2 left-6 right-6 h-2 bg-gradient-to-b from-black/10 to-transparent blur-sm" />
            </div>
            
            {/* Shelf bracket left */}
            <div className="absolute -bottom-3 left-8 w-3 h-5 bg-gradient-to-b from-stone-500 to-stone-600 dark:from-stone-600 dark:to-stone-700 rounded-b-sm shadow-sm">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10" />
            </div>
            
            {/* Shelf bracket right */}
            <div className="absolute -bottom-3 right-8 w-3 h-5 bg-gradient-to-b from-stone-500 to-stone-600 dark:from-stone-600 dark:to-stone-700 rounded-b-sm shadow-sm">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10" />
            </div>
          </div>
        </div>
      ))}
      
      {/* Touch drag instruction toast */}
      {touchDragId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-foreground/90 text-background px-5 py-2.5 rounded-full text-sm font-medium shadow-float z-50 animate-fade-in">
          Drag to reorder • Release to drop
        </div>
      )}
    </div>
  );
}
