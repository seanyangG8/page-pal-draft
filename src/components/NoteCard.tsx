import { Note, NoteType } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Quote, Lightbulb, HelpCircle, CheckCircle, MoreVertical, Trash2, Bookmark, Image, Mic, Clock, Lock, Globe, Pencil } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

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

  return (
    <Card 
      className={`
        group relative overflow-hidden
        border-l-4 ${config.borderColor}
        bg-card hover:bg-card/80
        shadow-soft hover:shadow-elevated
        transition-all duration-300 ease-out
        hover:-translate-y-1 active:translate-y-0
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header with type badge */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="secondary" className={`${config.className} gap-1.5 text-xs font-medium px-2.5 py-1`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </Badge>
              {note.isPrivate && (
                <Badge variant="outline" className="gap-1 text-xs bg-muted/50 border-border/60">
                  <Lock className="w-3 h-3" />
                  Private
                </Badge>
              )}
              {note.mediaType === 'image' && (
                <Badge variant="outline" className="gap-1 text-xs border-border/60">
                  <Image className="w-3 h-3" />
                  Image
                </Badge>
              )}
              {note.mediaType === 'audio' && (
                <Badge variant="outline" className="gap-1 text-xs border-border/60">
                  <Mic className="w-3 h-3" />
                  Voice
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
              <div className="mb-4 rounded-xl overflow-hidden bg-secondary/50 shadow-soft">
                <img src={note.imageUrl} alt="Note capture" className="w-full max-h-52 object-cover" />
              </div>
            )}

            {/* Content - special styling for quotes */}
            {note.type === 'quote' ? (
              <div className="relative pl-5 py-1">
                <div className="absolute left-0 top-0 text-4xl font-display leading-none text-primary/25 select-none">"</div>
                <p className="font-display text-lg italic text-foreground/90 leading-relaxed">
                  {note.content}
                </p>
              </div>
            ) : (
              <p className="text-foreground leading-relaxed">
                {note.content}
              </p>
            )}

            {/* Extracted text */}
            {note.extractedText && note.extractedText !== note.content && (
              <div className="mt-3 p-3 text-sm text-muted-foreground bg-secondary/40 rounded-lg border-l-2 border-primary/25">
                {note.extractedText}
              </div>
            )}

            {/* Context if exists */}
            {note.context && (
              <p className="mt-3 text-sm text-muted-foreground border-l-2 border-accent/40 pl-4 italic">
                {note.context}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/40 flex-wrap">
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
                <div className="flex gap-1.5 flex-wrap">
                  {note.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="text-xs text-primary/90 bg-primary/10 px-2 py-0.5 rounded-full font-medium transition-colors hover:bg-primary/15"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions - stop propagation */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-secondary"
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
          </div>
        </div>
      </div>
    </Card>
  );
}
