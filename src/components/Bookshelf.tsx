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
import type { CSSProperties } from 'react';
import { reorderBooks } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  isMobile?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onLongPress?: () => void;
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
  isMobile,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onLongPress,
  bookRef,
}: BookSpineProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const bookDimensions: CSSProperties = {
    width: '100%',
    minWidth: 'var(--book-min, 72px)',
    maxWidth: 'var(--book-max, 120px)',
    aspectRatio: '2 / 3',
  };

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

  const handleTouchStartInternal = (e: React.TouchEvent) => {
    setIsPressed(true);
    
    // Long press for context menu on mobile
    longPressRef.current = setTimeout(() => {
      setShowMobileMenu(true);
      onLongPress?.();
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
    
    onTouchStart?.(e);
  };

  const handleTouchEndInternal = (e: React.TouchEvent) => {
    setIsPressed(false);
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    onTouchEnd?.(e);
  };

  const handleTouchMoveInternal = (e: React.TouchEvent) => {
    // Cancel long press on move
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    setIsPressed(false);
    onTouchMove?.(e);
  };

  return (
    <div 
      ref={bookRef}
      className={cn(
        "group relative transition-all duration-300 ease-out",
        isDragging || isTouchDragging ? 'opacity-40 scale-90 z-50' : '',
        isDragOver ? 'translate-x-4' : '',
        isMobile ? 'touch-manipulation' : 'touch-none'
      )}
      style={{ width: '100%' }}
      draggable={!isMobile}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onTouchStart={handleTouchStartInternal}
      onTouchMove={handleTouchMoveInternal}
      onTouchEnd={handleTouchEndInternal}
    >
      {/* Drop indicator */}
      {isDragOver && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary rounded-full animate-pulse z-20" />
      )}
      
      {/* Drag handle indicator - desktop only */}
      {!isMobile && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity z-10 cursor-grab">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
      
      {/* Book standing upright */}
      <div 
        className={cn(
          "relative cursor-pointer transition-all duration-300",
          "hover:-translate-y-3 hover:scale-105",
          "active:-translate-y-1.5 active:scale-[1.02]",
          isPressed && "-translate-y-1.5 scale-[1.02]",
          "[&:hover_.book-cover]:!transform-none [&:hover_.book-cover]:[transform:rotateY(-5deg)_!important]"
        )}
        onClick={() => !showMobileMenu && onClick()}
      >
        {/* Book with cover image or colored spine */}
        {book.coverUrl ? (
          // Show book cover at a slight angle - larger touch target on mobile
          <div 
            className="relative"
            style={{
              ...bookDimensions,
              perspective: '400px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Book cover - fixed dimensions */}
            <div
              className="book-cover absolute inset-0 rounded-sm shadow-lg overflow-hidden transition-transform duration-300"
              style={{
                transform: 'rotateY(-20deg)',
                transformOrigin: 'left center',
                boxShadow: '4px 2px 10px rgba(0,0,0,0.35)',
              }}
            >
              <img 
                src={book.coverUrl} 
                alt={book.title}
                className="w-full h-full object-cover pointer-events-none"
              />
              {/* Lighting overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
            </div>
            {/* Page edges */}
            <div 
              className="absolute top-1 right-0 h-[calc(100%-8px)] w-1.5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-100 dark:to-amber-200 rounded-r-sm"
              style={{
                boxShadow: '1px 0 3px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        ) : (
          // Show colored spine (no cover) - same fixed size and angle
          <div 
            className="relative"
            style={{
              ...bookDimensions,
              perspective: '400px',
              transformStyle: 'preserve-3d',
            }}
          >
            <div 
              className={`book-cover absolute inset-0 bg-gradient-to-b ${getSpineColor(book.title)} rounded-sm shadow-lg flex flex-col items-center justify-center overflow-hidden transition-transform duration-300`}
              style={{
                transform: 'rotateY(-20deg)',
                transformOrigin: 'left center',
                boxShadow: '4px 2px 10px rgba(0,0,0,0.35), inset -2px 0 4px rgba(255,255,255,0.1)',
              }}
            >
              {/* Spine texture overlay */}
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)]" />
              
              {/* Title on spine (rotated) */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                <span className={cn(
                  "font-medium text-white/90 px-1 text-center leading-tight line-clamp-3 rotate-180",
                  isMobile ? "text-[10px]" : "text-[10px] sm:text-xs"
                )}>
                  {book.title}
                </span>
              </div>
              
              {/* Decorative lines */}
              <div className="absolute top-3 left-1 right-1 h-0.5 bg-amber-300/30 rounded-full" />
              <div className="absolute bottom-3 left-1 right-1 h-0.5 bg-amber-300/30 rounded-full" />
            </div>
            
            {/* Page edges */}
            <div 
              className="absolute top-1 right-0 h-[calc(100%-8px)] w-1.5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-100 dark:to-amber-200 rounded-r-sm"
              style={{
                boxShadow: '1px 0 3px rgba(0,0,0,0.15)',
              }}
            />
          </div>
        )}
      </div>

      {/* Actions - Desktop: hover dropdown, Mobile: only on long press */}
      <div className={cn(
        "absolute -top-2 left-1/2 -translate-x-1/2 z-10 transition-opacity",
        isMobile 
          ? (showMobileMenu ? "opacity-100" : "opacity-0 pointer-events-none")
          : "opacity-0 group-hover:opacity-100"
      )}>
        <DropdownMenu open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="secondary" 
              size="icon" 
              className={cn(
                "shadow-md touch-manipulation",
                isMobile ? "h-7 w-7" : "h-6 w-6"
              )}
            >
              <MoreVertical className={isMobile ? "w-3.5 h-3.5" : "w-3 h-3"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[140px]">
            {onEdit && (
              <>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMobileMenu(false);
                    onEdit();
                  }}
                  className="gap-2 py-2.5 touch-manipulation"
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
                setShowMobileMenu(false);
                onDelete();
              }}
              className="text-destructive focus:text-destructive gap-2 py-2.5 touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
              Delete book
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Note count badge */}
      {book.notesCount > 0 && (
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-medium rounded-full shadow-sm",
          isMobile ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0.5"
        )}>
          {book.notesCount}
        </div>
      )}
    </div>
  );
}

export function Bookshelf({ books, onBookClick, onDeleteBook, onEditBook, onReorder }: BookshelfProps) {
  const isMobile = useIsMobile();
  const [draggedBookId, setDraggedBookId] = useState<string | null>(null);
  const [dragOverBookId, setDragOverBookId] = useState<string | null>(null);
  const [localBooks, setLocalBooks] = useState<Book[]>(books);
  const [touchDragId, setTouchDragId] = useState<string | null>(null);
  
  const bookRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const bookSizeVars: CSSProperties = {
    '--book-min': isMobile ? '60px' : '78px',
    '--book-max': isMobile ? '86px' : '104px',
    '--book-gap': isMobile ? '0.65rem' : '0.95rem',
    '--shelf-cols': isMobile ? 4 : 8,
  };

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

  // Touch handlers for mobile reordering
  const handleTouchStart = useCallback((e: React.TouchEvent, bookId: string) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Long press to start drag (for reordering)
    longPressTimer.current = setTimeout(() => {
      setTouchDragId(bookId);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
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
  const booksPerShelf = isMobile ? 4 : 8;
  const shelves: Book[][] = [];
  
  for (let i = 0; i < localBooks.length; i += booksPerShelf) {
    shelves.push(localBooks.slice(i, i + booksPerShelf));
  }

  // Ensure at least one shelf even if empty
  if (shelves.length === 0) {
    shelves.push([]);
  }

  return (
    <div className="space-y-3">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div 
          key={shelfIndex}
          className="relative animate-fade-up"
          style={{ animationDelay: `${shelfIndex * 100}ms` }}
        >
          {/* Shelf with books */}
          <div className="relative">
            {/* Books container */}
            <div 
              className={cn(
                "grid items-end justify-start scrollbar-hide",
                isMobile ? "px-2" : "px-3 sm:px-4"
              )}
              style={{
                ...bookSizeVars,
                gridTemplateColumns: 'repeat(var(--shelf-cols), minmax(var(--book-min), 1fr))',
                gridAutoFlow: 'column',
                gap: 'var(--book-gap)',
                alignItems: 'end',
                justifyItems: 'center',
                justifyContent: 'start',
                overflowX: 'hidden',
                overflowY: 'visible',
                paddingTop: isMobile ? '1rem' : '1.2rem',
                paddingBottom: isMobile ? '0.7rem' : '0.85rem',
                minHeight: isMobile ? '9rem' : '11rem',
                marginTop: isMobile ? '0.1rem' : '0.15rem',
              }}
            >
              {shelfBooks.map((book, bookIndex) => (
                <div 
                  key={book.id}
                  className="w-full h-full flex items-end justify-center animate-fade-up"
                  style={{ animationDelay: `${bookIndex * 50}ms` }}
                >
                  <BookSpine 
                    book={book} 
                    onClick={() => !touchDragId && onBookClick(book.id)}
                    onDelete={() => onDeleteBook(book.id)}
                    onEdit={onEditBook ? () => onEditBook(book) : undefined}
                    isDragging={draggedBookId === book.id}
                    isDragOver={dragOverBookId === book.id && draggedBookId !== book.id && touchDragId !== book.id}
                    isTouchDragging={touchDragId === book.id}
                    isMobile={isMobile}
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
                <div className="flex items-center justify-center w-full h-44 md:h-52 text-muted-foreground/50">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8" />
                    <span className="text-sm">Your shelf awaits...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Wooden shelf */}
            <div className="relative h-4 sm:h-5 bg-gradient-to-b from-amber-800 via-amber-700 to-amber-900 dark:from-amber-900 dark:via-amber-800 dark:to-amber-950 rounded-sm shadow-lg">
              {/* Wood grain texture */}
              <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_20px,rgba(0,0,0,0.1)_20px,rgba(0,0,0,0.1)_40px)]" />
              
              {/* Shelf highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-amber-600/50 to-transparent rounded-t-sm" />
              
              {/* Shelf shadow underneath */}
              <div className="absolute -bottom-2 left-2 right-2 h-2 bg-gradient-to-b from-black/20 to-transparent blur-sm" />
            </div>
            
            {/* Shelf bracket left */}
            <div className="absolute -bottom-3 left-4 w-3 h-6 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-sm shadow-md" />
            
            {/* Shelf bracket right */}
            <div className="absolute -bottom-3 right-4 w-3 h-6 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-sm shadow-md" />
          </div>
        </div>
      ))}
      
      {/* Touch drag instruction toast */}
      {touchDragId && (
        <div className="fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 bg-foreground/90 text-background px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 animate-fade-in">
          Drag to reorder • Release to drop
        </div>
      )}
    </div>
  );
}
