import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Zap,
  FileText,
  RotateCcw,
  Check,
  Loader2,
  ArrowLeft,
  Wand2,
} from 'lucide-react';
import { runAIAction, type AIAction } from '@/api/ai';

interface AITextActionsProps {
  originalText: string;
  onTextChange: (text: string, flashcard?: { question: string; answer: string }) => void;
  context?: {
    bookTitle?: string;
    bookAuthor?: string;
    chapterOrSection?: string;
    page?: string;
    highlight?: string;
  } | string;
  onBack?: () => void;
  showBackButton?: boolean;
}

const aiActions: { action: AIAction; icon: typeof Sparkles; label: string; description: string }[] = [
  { action: 'cleanup', icon: Zap, label: 'Clean up', description: 'Fix grammar & structure' },
  { action: 'expand', icon: FileText, label: 'Expand', description: 'Add more detail' },
  { action: 'summarize', icon: Sparkles, label: 'Summarize', description: 'Make it concise' },
  { action: 'flashcard', icon: RotateCcw, label: 'Flashcard', description: 'Q&A format' },
];

export function AITextActions({ originalText, onTextChange, context, onBack, showBackButton }: AITextActionsProps) {
  const [editedText, setEditedText] = useState(originalText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleTextChange = (value: string) => {
    setEditedText(value);
    setHasChanges(value !== originalText);
  };

  const handleAIAction = async (action: AIAction) => {
    if (!editedText.trim()) return;
    setIsProcessing(true);
    setActiveAction(action);

    try {
      const result = await runAIAction(action, editedText, context);
      if (action === 'flashcard' && result.flashcard) {
        onTextChange(editedText, result.flashcard);
      } else if (result.text) {
        setEditedText(result.text);
        setHasChanges(result.text !== originalText);
      }
    } catch (error) {
      console.error('AI action failed:', error);
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  const handleApply = () => {
    onTextChange(editedText);
  };

  const handleReset = () => {
    setEditedText(originalText);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      {showBackButton && onBack && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      )}

      {/* Editable text area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Edit your note</p>
          {hasChanges && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>
        <Textarea
          value={editedText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[120px] bg-background resize-none"
          placeholder="Your note text..."
          disabled={isProcessing}
        />
      </div>

      {/* AI Action buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">AI Actions</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {aiActions.map(({ action, icon: Icon, label, description }) => (
            <button
              key={action}
              type="button"
              disabled={isProcessing || !editedText.trim()}
              onClick={() => handleAIAction(action)}
              className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                isProcessing && activeAction === action
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <div className="mt-0.5">
                {isProcessing && activeAction === action ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Apply button */}
      {hasChanges && (
        <Button
          type="button"
          className="w-full gap-2"
          onClick={handleApply}
        >
          <Check className="w-4 h-4" />
          Use this text
        </Button>
      )}
    </div>
  );
}
