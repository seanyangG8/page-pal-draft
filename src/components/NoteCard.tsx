import { Note, NoteType } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Quote, Lightbulb, HelpCircle, CheckCircle, MoreVertical, Trash2, Bookmark, Image, Mic, Clock, Lock, Globe, Pencil, ChevronRight } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NoteCardProps {
  note: Note;
  onDelete: () => void;
  onUpdate?: (note: Note) => void;
  onEdit?: () => void;
  onClick?: () => void;
  showBookTitle?: string;
  onBookClick?: () => void;
}

const noteTypeConfig: Record<NoteType, { icon: typeof Quote; label: string; className: string; borderColor: string }> = {
  quote: { icon: Quote, label: 'Quote', className: 'note-badge-quote', borderColor: 'border-l-amber-500 dark:border-l-amber-400' },
  idea: { icon: Lightbulb, label: 'Idea', className: 'note-badge-idea', borderColor: 'border-l-sky-500 dark:border-l-sky-400' },
  question: { icon: HelpCircle, label: 'Question', className: 'note-badge-question', borderColor: 'border-l-violet-500 dark:border-l-violet-400' },
  action: { icon: CheckCircle, label: 'Action', className: 'note-badge-action', borderColor: 'border-l-emerald-500 dark:border-l-emerald-400' },
};

export function NoteCard({ note, onDelete, onUpdate, onEdit, onClick, showBookTitle, onBookClick }: NoteCardProps) {
  const config = noteTypeConfig[note.type];
  const Icon = config.icon;
  const isMobile = useIsMobile();
  
  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 80;
  const DELETE_THRESHOLD = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only swipe left, and only if more horizontal than vertical
    if (deltaX < 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsSwiping(true);
      // Limit swipe to -DELETE_THRESHOLD with resistance
      const clampedX = Math.max(deltaX, -DELETE_THRESHOLD - 20);
      setSwipeX(clampedX);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isSwiping) return;
    
    if (Math.abs(swipeX) >= DELETE_THRESHOLD) {
      // Delete action
      onDelete();
    } else if (Math.abs(swipeX) >= SWIPE_THRESHOLD) {
      // Snap to show actions
      setSwipeX(-SWIPE_THRESHOLD);
    } else {
      // Snap back
      setSwipeX(0);
    }
    setIsSwiping(false);
  };

  const handleCardClick = () => {
    if (Math.abs(swipeX) > 10) {
      // Reset swipe on tap when actions are shown
      setSwipeX(0);
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete action background */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-all duration-200",
          Math.abs(swipeX) >= DELETE_THRESHOLD 
            ? "bg-destructive" 
            : "bg-destructive/80"
        )}
        style={{ width: Math.abs(swipeX) + 20 }}
      >
        <div className="flex items-center gap-2 text-destructive-foreground">
          <Trash2 className={cn(
            "w-5 h-5 transition-transform duration-200",
            Math.abs(swipeX) >= DELETE_THRESHOLD && "scale-125"
          )} />
          {Math.abs(swipeX) >= SWIPE_THRESHOLD && (
            <span className="text-sm font-medium">Delete</span>
          )}
        </div>
      </div>

      <Card 
        ref={cardRef}
        className={cn(
          "group relative overflow-hidden",
          `border-l-4 ${config.borderColor}`,
          "bg-card",
          "shadow-soft",
          "transition-all duration-200 ease-out",
          !isMobile && "hover:bg-card/80 hover:shadow-elevated hover:-translate-y-1",
          onClick ? 'cursor-pointer' : '',
          isSwiping ? 'transition-none' : 'transition-transform duration-200'
        )}
        style={{ transform: `translateX(${swipeX}px)` }}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative p-4 md:p-5">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              {/* Header with type badge */}
              <div className="flex items-center gap-1.5 md:gap-2 mb-2.5 md:mb-3 flex-wrap">
                <Badge variant="secondary" className={cn(
                  config.className,
                  "gap-1 md:gap-1.5 text-xs font-medium px-2 md:px-2.5 py-0.5 md:py-1"
                )}>
                  <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {config.label}
                </Badge>
                {note.isPrivate && (
                  <Badge variant="outline" className="gap-1 text-xs bg-muted/50 border-border/60 px-1.5 py-0.5">
                    <Lock className="w-3 h-3" />
                    <span className="hidden sm:inline">Private</span>
                  </Badge>
                )}
                {note.mediaType === 'image' && (
                  <Badge variant="outline" className="gap-1 text-xs border-border/60 px-1.5 py-0.5">
                    <Image className="w-3 h-3" />
                    <span className="hidden sm:inline">Image</span>
                  </Badge>
                )}
                {note.mediaType === 'audio' && (
                  <Badge variant="outline" className="gap-1 text-xs border-border/60 px-1.5 py-0.5">
                    <Mic className="w-3 h-3" />
                    <span className="hidden sm:inline">Voice</span>
                  </Badge>
                )}
                {note.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Bookmark className="w-3 h-3" />
                    {note.location}
                  </span>
                )}
                {note.timestamp && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {note.timestamp}
                  </span>
                )}
              </div>

              {/* Image preview */}
              {note.imageUrl && (
                <div className="mb-3 md:mb-4 rounded-lg md:rounded-xl overflow-hidden bg-secondary/50 shadow-soft">
                  <img src={note.imageUrl} alt="Note capture" className="w-full max-h-48 md:max-h-52 object-cover" />
                </div>
              )}

              {/* Content - special styling for quotes */}
              {note.type === 'quote' ? (
                <div className="relative pl-4 md:pl-5 py-1">
                  <div className="absolute left-0 top-0 text-3xl md:text-4xl font-display leading-none text-primary/25 select-none">"</div>
                  <p className="font-display text-base md:text-lg italic text-foreground/90 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ) : (
                <p className="text-sm md:text-base text-foreground leading-relaxed">
                  {note.content}
                </p>
              )}

              {/* Extracted text */}
              {note.extractedText && note.extractedText !== note.content && (
                <div className="mt-2.5 md:mt-3 p-2.5 md:p-3 text-xs md:text-sm text-muted-foreground bg-secondary/40 rounded-lg border-l-2 border-primary/25">
                  {note.extractedText}
                </div>
              )}

              {/* Context if exists */}
              {note.context && (
                <p className="mt-2.5 md:mt-3 text-xs md:text-sm text-muted-foreground border-l-2 border-accent/40 pl-3 md:pl-4 italic">
                  {note.context}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-border/40 flex-wrap">
                {showBookTitle && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookClick?.();
                    }}
                    className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors link-animated"
                  >
                    {showBookTitle}
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(note.createdAt, 'MMM d, yyyy')}
                </span>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 md:gap-1.5 flex-wrap">
                    {note.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="text-xs text-primary/90 bg-primary/10 px-1.5 md:px-2 py-0.5 rounded-full font-medium transition-colors hover:bg-primary/15"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              {/* Mobile: always show a subtle indicator */}
              {isMobile && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              )}
              
              {/* Desktop: dropdown menu */}
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-secondary"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {onEdit && (
                      <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" />
                        Edit note
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => onUpdate?.({ ...note, isPrivate: !note.isPrivate })}
                      className="gap-2 cursor-pointer"
                    >
                      {note.isPrivate ? (
                        <>
                          <Globe className="w-4 h-4" />
                          Make public
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Make private
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile swipe hint - only show on first few notes */}
        {isMobile && swipeX === 0 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-active:opacity-40 transition-opacity pointer-events-none">
            <ChevronRight className="w-5 h-5 text-muted-foreground animate-pulse" />
          </div>
        )}
      </Card>
    </div>
  );
}
