import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NoteType } from '@/types';
import { Quote, Lightbulb, HelpCircle, CheckCircle, PenLine } from 'lucide-react';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (note: { type: NoteType; content: string; location?: string; context?: string }) => void;
  bookTitle: string;
}

const noteTypes: { type: NoteType; icon: typeof Quote; label: string; description: string }[] = [
  { type: 'quote', icon: Quote, label: 'Quote', description: 'A passage worth remembering' },
  { type: 'idea', icon: Lightbulb, label: 'Idea', description: 'A thought or insight' },
  { type: 'question', icon: HelpCircle, label: 'Question', description: 'Something to explore' },
  { type: 'action', icon: CheckCircle, label: 'Action', description: 'Something to do' },
];

export function AddNoteDialog({ open, onOpenChange, onAdd, bookTitle }: AddNoteDialogProps) {
  const [type, setType] = useState<NoteType>('quote');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onAdd({
      type,
      content: content.trim(),
      location: location.trim() || undefined,
      context: context.trim() || undefined,
    });
    
    setType('quote');
    setContent('');
    setLocation('');
    setContext('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <PenLine className="w-5 h-5 text-primary" />
            Add note to <span className="text-primary">{bookTitle}</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Note type selector */}
          <div className="space-y-2">
            <Label>Note type</Label>
            <div className="grid grid-cols-2 gap-2">
              {noteTypes.map(({ type: t, icon: Icon, label }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    type === t 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {type === 'quote' ? 'The passage' : type === 'question' ? 'Your question' : 'Your note'}
            </Label>
            <Textarea
              id="content"
              placeholder={type === 'quote' ? 'Type or paste the quote...' : 'Write your note...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] bg-background resize-none"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              placeholder="Page 42, Chapter 3, 1:23:45..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Why it matters (optional)</Label>
            <Input
              id="context"
              placeholder="Brief note on why you're saving this..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim()}>
              Save note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
