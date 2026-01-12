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
import { useHaptic } from '@/hooks/use-haptic';

interface NoteCardProps {
  note: Note;
  onDelete: () => void;
  onUpdate?: (note: Note) => void;
  onEdit?: () => void;
  onClick?: () => void;
  showBookTitle?: string;
  onBookClick?: () => void;
}

const noteTypeConfig: Record<NoteType, { icon: typeof Quote; label: string; color: string; bgColor: string }> = {
  quote: { icon: Quote, label: 'Quote', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100/80 dark:bg-amber-900/30' },
  idea: { icon: Lightbulb, label: 'Idea', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100/80 dark:bg-sky-900/30' },
  question: { icon: HelpCircle, label: 'Question', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100/80 dark:bg-violet-900/30' },
  action: { icon: CheckCircle, label: 'Action', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100/80 dark:bg-emerald-900/30' },
};

export function NoteCard({ note, onDelete, onUpdate, onEdit, onClick, showBookTitle, onBookClick }: NoteCardProps) {
  const config = noteTypeConfig[note.type];
  const Icon = config.icon;
  const isMobile = useIsMobile();
  const { light, warning, error } = useHaptic();
  
  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [hasTriggeredThreshold, setHasTriggeredThreshold] = useState(false);
  const [hasTriggeredDelete, setHasTriggeredDelete] = useState(false);
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
    setHasTriggeredThreshold(false);
    setHasTriggeredDelete(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only swipe left, and only if more horizontal than vertical
    if (deltaX < 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setIsSwiping(true);
      const clampedX = Math.max(deltaX, -DELETE_THRESHOLD - 20);
      setSwipeX(clampedX);
      
      if (Math.abs(clampedX) >= SWIPE_THRESHOLD && !hasTriggeredThreshold) {
        light();
        setHasTriggeredThreshold(true);
      }
      if (Math.abs(clampedX) >= DELETE_THRESHOLD && !hasTriggeredDelete) {
        warning();
        setHasTriggeredDelete(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isSwiping) return;
    
    if (Math.abs(swipeX) >= DELETE_THRESHOLD) {
      error();
      onDelete();
    } else if (Math.abs(swipeX) >= SWIPE_THRESHOLD) {
      setSwipeX(-SWIPE_THRESHOLD);
    } else {
      setSwipeX(0);
    }
    setIsSwiping(false);
  };

  const handleCardClick = () => {
    if (Math.abs(swipeX) > 10) {
      setSwipeX(0);
      return;
    }
    onClick?.();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete action background - iOS style red */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-5 transition-colors",
          Math.abs(swipeX) >= DELETE_THRESHOLD 
            ? "bg-red-500" 
            : "bg-red-500/90"
        )}
        style={{ width: Math.abs(swipeX) + 20 }}
      >
        <div className="flex flex-col items-center gap-0.5 text-white">
          <Trash2 className={cn(
            "w-5 h-5 transition-transform",
            Math.abs(swipeX) >= DELETE_THRESHOLD && "scale-110"
          )} />
          <span className="text-xs font-medium">Delete</span>
        </div>
      </div>

      {/* iOS-style card */}
      <div 
        ref={cardRef}
        className={cn(
          "relative bg-card/95 backdrop-blur-sm",
          "rounded-2xl",
          "active:bg-secondary/80",
          !isMobile && "hover:bg-secondary/50 transition-colors",
          onClick && "cursor-pointer",
          isSwiping ? "transition-none" : "transition-transform duration-200 ease-out"
        )}
        style={{ 
          transform: `translateX(${swipeX}px)`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        }}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-3.5">
          {/* Type pill - iOS style */}
          <div className="flex items-center justify-between mb-2.5">
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
              config.bgColor,
              config.color
            )}>
              <Icon className="w-3.5 h-3.5" />
              {config.label}
            </div>
            
            {/* Right side indicators */}
            <div className="flex items-center gap-2">
              {note.isPrivate && (
                <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
              )}
              {note.mediaType === 'image' && (
                <Image className="w-3.5 h-3.5 text-muted-foreground/60" />
              )}
              {note.mediaType === 'audio' && (
                <Mic className="w-3.5 h-3.5 text-muted-foreground/60" />
              )}
              {isMobile && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
              )}
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} className="gap-2">
                        <Pencil className="w-4 h-4" />
                        Edit note
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onUpdate?.({ ...note, isPrivate: !note.isPrivate }); }}
                      className="gap-2"
                    >
                      {note.isPrivate ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      {note.isPrivate ? 'Make public' : 'Make private'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="text-destructive focus:text-destructive gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Image preview */}
          {note.imageUrl && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <img src={note.imageUrl} alt="Note capture" className="w-full max-h-44 object-cover" />
            </div>
          )}

          {/* Content */}
          <p className={cn(
            "text-[15px] leading-relaxed",
            note.type === 'quote' ? "font-serif italic text-foreground/90" : "text-foreground"
          )}>
            {note.content}
          </p>

          {/* Context */}
          {note.context && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              "{note.context}"
            </p>
          )}

          {/* Location/bookmark */}
          {note.location && (
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground">
              <Bookmark className="w-3 h-3" />
              {note.location}
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              {note.tags.map(tag => (
                <span 
                  key={tag} 
                  className="text-xs text-primary/80 bg-primary/8 px-2 py-0.5 rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer - date and book title */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/30">
            <span className="text-xs text-muted-foreground/70">
              {format(note.createdAt, 'MMM d, yyyy')}
            </span>
            {showBookTitle && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookClick?.();
                  }}
                  className="text-xs font-medium text-primary/80 active:text-primary"
                >
                  {showBookTitle}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
