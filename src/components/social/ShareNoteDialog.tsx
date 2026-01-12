import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Note } from '@/types';
import { Share2, Globe, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ShareNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  bookTitle?: string;
}

type Visibility = 'public' | 'friends' | 'private';

export function ShareNoteDialog({ open, onOpenChange, note, bookTitle }: ShareNoteDialogProps) {
  const [visibility, setVisibility] = useState<Visibility>('friends');
  const [caption, setCaption] = useState('');
  const [includeBook, setIncludeBook] = useState(true);

  const handleShare = () => {
    // This will connect to backend later
    toast.success('Note shared to your feed!');
    onOpenChange(false);
    setCaption('');
  };

  const visibilityOptions: { value: Visibility; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'public', label: 'Public', icon: <Globe className="w-4 h-4" />, description: 'Anyone can see this' },
    { value: 'friends', label: 'Friends', icon: <Users className="w-4 h-4" />, description: 'Only people you follow' },
    { value: 'private', label: 'Private', icon: <Lock className="w-4 h-4" />, description: 'Only you can see this' },
  ];

  if (!note) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Note
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Share this note with your reading community
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4">
          {/* Preview */}
          <div className="p-3 bg-secondary/50 rounded-xl border border-border/30">
            <p className="text-sm text-foreground italic line-clamp-3">
              {note.content}
            </p>
            {bookTitle && includeBook && (
              <p className="text-xs text-muted-foreground mt-2">
                From "{bookTitle}"
              </p>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm">Add a caption (optional)</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your thoughts about this note..."
              className="resize-none min-h-[60px]"
              rows={2}
            />
          </div>

          {/* Include book toggle */}
          {bookTitle && (
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="include-book" className="text-sm cursor-pointer">Include book information</Label>
              <Switch
                id="include-book"
                checked={includeBook}
                onCheckedChange={setIncludeBook}
              />
            </div>
          )}

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-sm">Who can see this?</Label>
            <div className="grid grid-cols-3 gap-2">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-center transition-colors touch-manipulation active:scale-95 ${
                    visibility === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {option.icon}
                    <span className="text-[11px] sm:text-xs font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground text-center mt-1">
              {visibilityOptions.find(o => o.value === visibility)?.description}
            </p>
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
            Cancel
          </Button>
          <Button onClick={handleShare} className="gap-2 flex-1 sm:flex-initial">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
