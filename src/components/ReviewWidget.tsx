import { useState, useEffect } from 'react';
import { Note } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ChevronRight, Sparkles } from 'lucide-react';
import { getNotesForReview } from '@/lib/store';

interface ReviewWidgetProps {
  onStartReview: (notes: Note[]) => void;
}

export function ReviewWidget({ onStartReview }: ReviewWidgetProps) {
  const [dueNotes, setDueNotes] = useState<Note[]>([]);

  useEffect(() => {
    setDueNotes(getNotesForReview(10));
  }, []);

  if (dueNotes.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground">
            Time to review!
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dueNotes.length} note{dueNotes.length !== 1 ? 's' : ''} ready for review
          </p>
          <Button 
            size="sm" 
            className="mt-3 gap-2"
            onClick={() => onStartReview(dueNotes.slice(0, 5))}
          >
            <Sparkles className="w-4 h-4" />
            Review now
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
