import { useState, useEffect } from 'react';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Note, NoteType, BookFormat } from '@/types';
import { Quote, Lightbulb, HelpCircle, CheckCircle, Pencil, Lock, Globe, Save } from 'lucide-react';
import { TagInput } from './TagInput';
import { LocationInput, LocationData, formatLocation, parseLocation } from './LocationInput';
import { getTypeStyles } from '@/lib/noteTypeInference';
import { getNotes } from '@/lib/store';
import { useHaptic } from '@/hooks/use-haptic';
import { useMemo } from 'react';

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave: (note: Note) => void;
  bookFormat?: BookFormat;
}

const noteTypes: { type: NoteType; icon: typeof Quote; label: string }[] = [
  { type: 'quote', icon: Quote, label: 'Quote' },
  { type: 'idea', icon: Lightbulb, label: 'Idea' },
  { type: 'question', icon: HelpCircle, label: 'Question' },
  { type: 'action', icon: CheckCircle, label: 'Action' },
];

export function EditNoteDialog({ 
  open, 
  onOpenChange, 
  note,
  onSave,
  bookFormat = 'physical'
}: EditNoteDialogProps) {
  const { success } = useHaptic();
  const [content, setContent] = useState('');
  const [type, setType] = useState<NoteType>('idea');
  const [location, setLocation] = useState<LocationData>({});
  const [context, setContext] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);

  // Get existing tags for autocomplete
  const existingTags = useMemo(() => {
    const allNotes = getNotes();
    const tagSet = new Set<string>();
    allNotes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet);
  }, [open]);

  // Initialize form when note changes
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setType(note.type);
      setLocation(note.location ? parseLocation(note.location) : {});
      setContext(note.context || '');
      setTags(note.tags || []);
      setIsPrivate(note.isPrivate || false);
    }
  }, [note]);

  const handleSave = () => {
    if (!note || !content.trim()) return;
    
    success();
    const locationString = formatLocation(location);
    
    onSave({
      ...note,
      content: content.trim(),
      type,
      location: locationString || undefined,
      context: context.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isPrivate,
    });
    
    onOpenChange(false);
  };

  if (!note) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2 font-display text-xl">
            <Pencil className="w-5 h-5 text-primary" />
            Edit note
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        <ResponsiveDialogBody className="space-y-4">
          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="edit-content" className="text-sm font-medium">Content</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] sm:min-h-[120px] bg-background resize-none text-base"
              autoFocus
            />
          </div>

          {/* Note Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {noteTypes.map(({ type: t, icon: TypeIcon, label }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`${getTypeStyles(t, type === t)} touch-manipulation active:scale-95 transition-transform`}
                >
                  <TypeIcon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookmark */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bookmark</Label>
            <LocationInput
              value={location}
              onChange={setLocation}
              bookFormat={bookFormat}
              compact
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <TagInput
              tags={tags}
              onChange={setTags}
              existingTags={existingTags}
              placeholder="Add tags..."
            />
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="edit-context" className="text-sm font-medium">
              Why it matters <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="edit-context"
              placeholder="Brief note on why you saved this..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{isPrivate ? 'Private' : 'Public'}</p>
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? 'Only you can see this' : 'Visible to friends'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPrivate(!isPrivate)}
              className="touch-manipulation"
            >
              {isPrivate ? 'Make public' : 'Make private'}
            </Button>
          </div>
        </ResponsiveDialogBody>

        {/* Actions */}
        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex-1 sm:flex-initial gap-2"
          >
            <Save className="w-4 h-4" />
            Save changes
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
