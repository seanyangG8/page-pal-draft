import { useState } from 'react';
import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, FileText, Zap, RotateCcw, Loader2, Copy, Check } from 'lucide-react';
import { runAIAction } from '@/api/ai';
import { parseLocation } from '@/components/LocationInput';

interface AIActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  action: 'summarize' | 'expand' | 'cleanup' | 'flashcard' | null;
  onSave: (noteId: string, updates: Partial<Note>) => void;
}

const actionConfig = {
  summarize: {
    icon: Sparkles,
    title: 'Summarize Note',
    description: 'Create a concise summary of this note',
    placeholder: 'AI-generated summary will appear here...',
    resultKey: 'aiSummary' as const,
  },
  expand: {
    icon: FileText,
    title: 'Expand & Explain',
    description: 'Get a detailed explanation of the concepts in this note',
    placeholder: 'AI-generated explanation will appear here...',
    resultKey: 'aiExpanded' as const,
  },
  cleanup: {
    icon: Zap,
    title: 'Clean Up Note',
    description: 'Fix grammar and improve clarity',
    placeholder: 'AI-enhanced text will appear here...',
    resultKey: 'content' as const,
  },
  flashcard: {
    icon: RotateCcw,
    title: 'Create Flashcard',
    description: 'Generate a Q&A pair from this note',
    placeholder: 'AI-generated flashcard will appear here...',
    resultKey: 'aiFlashcard' as const,
  },
};

export function AIActionsDialog({ open, onOpenChange, note, action, onSave }: AIActionsDialogProps) {
  const [result, setResult] = useState('');
  const [flashcard, setFlashcard] = useState<{ question: string; answer: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!note || !action) return null;

  const cfg = actionConfig[action];
  const Icon = cfg.icon;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCopied(false);
    try {
      const locationData = note.location ? parseLocation(note.location) : {};
      const res = await runAIAction(action, note.content || note.extractedText || '', {
        chapterOrSection: note.chapter || locationData.chapter,
        page: locationData.page,
      });
      if (action === 'flashcard' && res.flashcard) {
        setFlashcard(res.flashcard);
        setResult(`${res.flashcard.question}\n\n${res.flashcard.answer}`);
      } else if (res.text) {
        setResult(res.text);
      }
    } catch (error) {
      console.error('AI generation failed', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!note) return;
    if (action === 'flashcard' && flashcard) {
      onSave(note.id, { aiFlashcard: flashcard });
    } else if (action === 'cleanup' && result) {
      onSave(note.id, { content: result });
    } else if (action === 'summarize' && result) {
      onSave(note.id, { aiSummary: result });
    } else if (action === 'expand' && result) {
      onSave(note.id, { aiExpanded: result });
    }
    onOpenChange(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {cfg.title}
          </DialogTitle>
          <DialogDescription>{cfg.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>

          <Textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder={cfg.placeholder}
            className="min-h-[180px]"
          />

          {action === 'flashcard' && flashcard && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Q:</strong> {flashcard.question}</p>
              <p><strong>A:</strong> {flashcard.answer}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleCopy} disabled={!result}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!result && !(action === 'flashcard' && flashcard)}>
              Save to note
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
