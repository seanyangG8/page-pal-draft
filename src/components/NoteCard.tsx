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
  showBookTitle?: string;
  onBookClick?: () => void;
}

const noteTypeConfig: Record<NoteType, { icon: typeof Quote; label: string; className: string }> = {
  quote: { icon: Quote, label: 'Quote', className: 'note-badge-quote' },
  idea: { icon: Lightbulb, label: 'Idea', className: 'note-badge-idea' },
  question: { icon: HelpCircle, label: 'Question', className: 'note-badge-question' },
  action: { icon: CheckCircle, label: 'Action', className: 'note-badge-action' },
};

export function NoteCard({ note, onDelete, onUpdate, onEdit, showBookTitle, onBookClick }: NoteCardProps) {
  const config = noteTypeConfig[note.type];
  const Icon = config.icon;

  return (
    <Card className="group relative p-4 shadow-soft hover:shadow-card transition-all duration-300 border-border/50 bg-card hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with type badge */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className={`${config.className} gap-1 text-xs font-medium`}>
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
            {note.isPrivate && (
              <Badge variant="outline" className="gap-1 text-xs bg-muted/50">
                <Lock className="w-3 h-3" />
                Private
              </Badge>
            )}
            {note.mediaType === 'image' && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Image className="w-3 h-3" />
                Image
              </Badge>
            )}
            {note.mediaType === 'audio' && (
              <Badge variant="outline" className="gap-1 text-xs">
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
            <div className="mb-3 rounded-lg overflow-hidden bg-secondary">
              <img src={note.imageUrl} alt="Note capture" className="w-full max-h-48 object-cover" />
            </div>
          )}

          {/* Content */}
          <p className={`text-foreground leading-relaxed ${note.type === 'quote' ? 'font-display italic' : ''}`}>
            {note.type === 'quote' && '"'}
            {note.content}
            {note.type === 'quote' && '"'}
          </p>

          {/* Extracted text */}
          {note.extractedText && note.extractedText !== note.content && (
            <p className="mt-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded border-l-2 border-primary/30">
              {note.extractedText}
            </p>
          )}

          {/* Context if exists */}
          {note.context && (
            <p className="mt-2 text-sm text-muted-foreground border-l-2 border-accent/30 pl-3">
              {note.context}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {showBookTitle && (
              <button 
                onClick={onBookClick}
                className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                {showBookTitle}
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {format(note.createdAt, 'MMM d, yyyy')}
            </span>
            {note.tags && note.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {note.tags.map(tag => (
                  <span key={tag} className="text-xs text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="w-4 h-4" />
                Edit note
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => onUpdate?.({ ...note, isPrivate: !note.isPrivate })}
              className="gap-2"
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
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
