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
    description: 'Turn messy notes into clear, structured text',
    placeholder: 'Cleaned up version will appear here...',
    resultKey: 'content' as const,
  },
  flashcard: {
    icon: RotateCcw,
    title: 'Create Flashcard',
    description: 'Generate a question-answer flashcard for review',
    placeholder: 'Q: Question\nA: Answer',
    resultKey: 'aiFlashcard' as const,
  },
};

// Simulated AI responses (placeholder until real AI integration)
function generateAIResponse(action: string, content: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case 'summarize':
          resolve(`Summary: ${content.slice(0, 100)}...`);
          break;
        case 'expand':
          resolve(`This note discusses: ${content}\n\nIn more detail, this means that the concepts presented here relate to broader themes of understanding and knowledge acquisition. The key insight is that ${content.slice(0, 50)}...`);
          break;
        case 'cleanup':
          resolve(content.charAt(0).toUpperCase() + content.slice(1).trim().replace(/\s+/g, ' ') + '.');
          break;
        case 'flashcard':
          resolve(`Q: What is the main idea of this note?\nA: ${content.slice(0, 80)}...`);
          break;
        default:
          resolve(content);
      }
    }, 1500);
  });
}

export function AIActionsDialog({ open, onOpenChange, note, action, onSave }: AIActionsDialogProps) {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = action ? actionConfig[action] : null;
  const Icon = config?.icon;

  const handleGenerate = async () => {
    if (!note || !action) return;
    
    setIsLoading(true);
    try {
      const response = await generateAIResponse(action, note.content || note.extractedText || '');
      setResult(response);
    } catch {
      setResult('Failed to generate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!note || !action || !result) return;

    if (action === 'flashcard') {
      // Parse Q&A format
      const lines = result.split('\n');
      const question = lines.find(l => l.startsWith('Q:'))?.replace('Q:', '').trim() || '';
      const answer = lines.find(l => l.startsWith('A:'))?.replace('A:', '').trim() || '';
      onSave(note.id, { aiFlashcard: { question, answer } });
    } else if (action === 'cleanup') {
      onSave(note.id, { content: result });
    } else if (action === 'summarize') {
      onSave(note.id, { aiSummary: result });
    } else if (action === 'expand') {
      onSave(note.id, { aiExpanded: result });
    }

    onOpenChange(false);
    setResult('');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setResult('');
    setIsLoading(false);
  };

  if (!config || !Icon || !note) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Original note preview */}
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Original note:</p>
            <p className="text-sm line-clamp-3">
              {note.content || note.extractedText || 'No text content'}
            </p>
          </div>

          {/* Generate button or result */}
          {!result && !isLoading && (
            <Button onClick={handleGenerate} className="w-full gap-2">
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </Button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Processing...</span>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Result:</p>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 This is a placeholder. Connect to Lovable Cloud for real AI features.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          {result && (
            <>
              <Button variant="outline" onClick={handleGenerate}>
                Regenerate
              </Button>
              <Button onClick={handleSave}>
                Save to note
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
