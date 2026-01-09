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
  Wand2
} from 'lucide-react';

type AIAction = 'cleanup' | 'expand' | 'summarize' | 'flashcard';

interface AITextActionsProps {
  originalText: string;
  onTextChange: (text: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const aiActions: { action: AIAction; icon: typeof Sparkles; label: string; description: string }[] = [
  { action: 'cleanup', icon: Zap, label: 'Clean up', description: 'Fix grammar & structure' },
  { action: 'expand', icon: FileText, label: 'Expand', description: 'Add more detail' },
  { action: 'summarize', icon: Sparkles, label: 'Summarize', description: 'Make it concise' },
  { action: 'flashcard', icon: RotateCcw, label: 'Flashcard', description: 'Q&A format' },
];

// Simulated AI responses (placeholder until real AI integration)
function simulateAI(action: AIAction, text: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (action) {
        case 'cleanup':
          // Capitalize first letter, trim, normalize whitespace, add period if missing
          const cleaned = text.trim().replace(/\s+/g, ' ');
          const withPeriod = cleaned.endsWith('.') || cleaned.endsWith('!') || cleaned.endsWith('?') 
            ? cleaned 
            : cleaned + '.';
          resolve(withPeriod.charAt(0).toUpperCase() + withPeriod.slice(1));
          break;
        case 'expand':
          resolve(`${text}\n\nThis concept relates to the broader theme of understanding and knowledge acquisition. The key insight here is that we can deepen our comprehension by exploring the underlying principles and connecting them to what we already know.`);
          break;
        case 'summarize':
          const words = text.split(' ');
          if (words.length > 20) {
            resolve(words.slice(0, 15).join(' ') + '...');
          } else {
            resolve(text);
          }
          break;
        case 'flashcard':
          resolve(`Q: What is the main idea of this note?\n\nA: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
          break;
        default:
          resolve(text);
      }
    }, 800);
  });
}

export function AITextActions({ originalText, onTextChange, onBack, showBackButton }: AITextActionsProps) {
  const [editedText, setEditedText] = useState(originalText);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleTextChange = (value: string) => {
    setEditedText(value);
    setHasChanges(value !== originalText);
  };

  const handleAIAction = async (action: AIAction) => {
    setIsProcessing(true);
    setActiveAction(action);
    
    try {
      const result = await simulateAI(action, editedText);
      setEditedText(result);
      setHasChanges(result !== originalText);
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
        <p className="text-xs text-muted-foreground text-center">
          💡 Placeholder AI — Connect to Lovable Cloud for real AI features
        </p>
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
