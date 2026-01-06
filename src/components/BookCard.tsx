import { Book } from '@/types';
import { Card } from '@/components/ui/card';
import { BookOpen, MoreVertical, Trash2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onDelete: () => void;
}

export function BookCard({ book, onClick, onDelete }: BookCardProps) {
  return (
    <Card 
      className="group relative overflow-hidden shadow-card card-hover cursor-pointer border-border/50 bg-card"
      onClick={onClick}
    >
      {/* Book cover placeholder */}
      <div className="aspect-[2/3] w-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative overflow-hidden">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
      </div>
      
      {/* Book info */}
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-foreground line-clamp-2 leading-tight">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
          {book.author}
        </p>
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{book.notesCount} {book.notesCount === 1 ? 'note' : 'notes'}</span>
        </div>
      </div>

      {/* Actions dropdown */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-soft">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
    </Card>
  );
}
