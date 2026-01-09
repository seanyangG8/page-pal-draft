import { Book } from '@/types';
import { BookOpen, MoreVertical, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface BookshelfProps {
  books: Book[];
  onBookClick: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
}

function BookSpine({ book, onClick, onDelete }: { book: Book; onClick: () => void; onDelete: () => void }) {
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
    <div className="group relative">
      {/* Book standing upright */}
      <div 
        className="relative cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:rotate-[-2deg]"
        onClick={onClick}
      >
        {/* Book spine (visible part) */}
        <div 
          className={`relative w-12 sm:w-14 md:w-16 h-44 sm:h-52 md:h-60 bg-gradient-to-b ${getSpineColor(book.title)} rounded-sm shadow-lg flex flex-col items-center justify-center overflow-hidden`}
          style={{
            transform: 'perspective(200px) rotateY(-5deg)',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.3), inset -2px 0 4px rgba(255,255,255,0.1)',
          }}
        >
          {/* Spine texture overlay */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)]" />
          
          {/* Title on spine (rotated) */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <span className="text-[10px] sm:text-xs font-medium text-white/90 px-1 text-center leading-tight line-clamp-3 rotate-180">
              {book.title}
            </span>
          </div>
          
          {/* Decorative lines */}
          <div className="absolute top-3 left-1 right-1 h-0.5 bg-amber-300/30 rounded-full" />
          <div className="absolute bottom-3 left-1 right-1 h-0.5 bg-amber-300/30 rounded-full" />
        </div>
        
        {/* Book cover edge (slight 3D effect) */}
        <div 
          className="absolute top-0 right-0 w-2 h-full bg-gradient-to-r from-transparent to-white/10 rounded-r-sm"
          style={{ transform: 'perspective(200px) rotateY(45deg)' }}
        />
        
        {/* Book pages edge */}
        <div 
          className="absolute top-1 -right-1 w-1.5 h-[calc(100%-8px)] bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-100 dark:to-amber-200"
          style={{
            boxShadow: 'inset 0 0 2px rgba(0,0,0,0.1)',
          }}
        />
      </div>

      {/* Hover actions */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-6 w-6 shadow-md">
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete book
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Note count badge */}
      {book.notesCount > 0 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm">
          {book.notesCount}
        </div>
      )}
    </div>
  );
}

export function Bookshelf({ books, onBookClick, onDeleteBook }: BookshelfProps) {
  // Group books into shelves (max 8 per shelf for good visual)
  const booksPerShelf = 8;
  const shelves: Book[][] = [];
  
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf));
  }

  // Ensure at least one shelf even if empty
  if (shelves.length === 0) {
    shelves.push([]);
  }

  return (
    <div className="space-y-2">
      {shelves.map((shelfBooks, shelfIndex) => (
        <div 
          key={shelfIndex}
          className="relative animate-fade-up"
          style={{ animationDelay: `${shelfIndex * 100}ms` }}
        >
          {/* Shelf with books */}
          <div className="relative">
            {/* Books container */}
            <div className="flex items-end justify-start gap-1 sm:gap-2 px-4 pb-3 min-h-[15rem] sm:min-h-[17rem] md:min-h-[19rem] overflow-x-auto scrollbar-hide">
              {shelfBooks.map((book, bookIndex) => (
                <div 
                  key={book.id}
                  className="flex-shrink-0 animate-fade-up"
                  style={{ animationDelay: `${bookIndex * 50}ms` }}
                >
                  <BookSpine 
                    book={book} 
                    onClick={() => onBookClick(book.id)}
                    onDelete={() => onDeleteBook(book.id)}
                  />
                </div>
              ))}
              
              {/* Empty shelf message */}
              {shelfBooks.length === 0 && (
                <div className="flex items-center justify-center w-full h-52 text-muted-foreground/50">
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
    </div>
  );
}
