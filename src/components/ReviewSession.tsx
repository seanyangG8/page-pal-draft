import { useState, useEffect } from 'react';
import { Note, Book } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, ChevronRight, Check, X, RotateCcw, 
  Quote, Lightbulb, HelpCircle, CheckCircle, BookOpen,
  Sparkles, Brain
} from 'lucide-react';
import { getBooks, markNoteReviewed } from '@/lib/store';

interface ReviewSessionProps {
  notes: Note[];
  onComplete: () => void;
  onClose: () => void;
}

const noteTypeConfig = {
  quote: { icon: Quote, label: 'Quote', className: 'note-badge-quote' },
  idea: { icon: Lightbulb, label: 'Idea', className: 'note-badge-idea' },
  question: { icon: HelpCircle, label: 'Question', className: 'note-badge-question' },
  action: { icon: CheckCircle, label: 'Action', className: 'note-badge-action' },
};

export function ReviewSession({ notes, onComplete, onClose }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [showAnswer, setShowAnswer] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    setBooks(getBooks());
  }, []);

  const currentNote = notes[currentIndex];
  const book = books.find(b => b.id === currentNote?.bookId);
  const config = currentNote ? noteTypeConfig[currentNote.type] : null;
  const Icon = config?.icon;
  
  const progress = (reviewedIds.size / notes.length) * 100;

  const handleMarkReviewed = (remembered: boolean) => {
    if (remembered && currentNote) {
      markNoteReviewed(currentNote.id);
    }
    setReviewedIds(prev => new Set(prev).add(currentNote.id));
    setShowAnswer(false);
    
    if (currentIndex < notes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (reviewedIds.size + 1 >= notes.length) {
      onComplete();
    }
  };

  const goToNext = () => {
    if (currentIndex < notes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  if (!currentNote || !config || !Icon) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Review Session</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {reviewedIds.size} / {notes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
        <Card 
          className="w-full max-w-xl p-6 shadow-elevated cursor-pointer"
          onClick={() => !showAnswer && currentNote.aiFlashcard && setShowAnswer(true)}
        >
          {/* Book info */}
          {book && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <BookOpen className="w-4 h-4" />
              <span>{book.title}</span>
              <span className="text-border">•</span>
              <span>{book.author}</span>
            </div>
          )}

          {/* Note type badge */}
          <Badge variant="secondary" className={`${config.className} gap-1 mb-4`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>

          {/* Flashcard mode */}
          {currentNote.aiFlashcard ? (
            <div className="min-h-[200px] flex flex-col justify-center">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Flashcard
                </p>
                <p className="text-xl font-display font-medium mb-6">
                  {currentNote.aiFlashcard.question}
                </p>
                
                {showAnswer ? (
                  <div className="p-4 rounded-lg bg-secondary animate-fade-in">
                    <p className="text-lg">{currentNote.aiFlashcard.answer}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tap to reveal answer
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Regular note display */
            <div className="min-h-[150px]">
              {currentNote.content && (
                <p className={`text-lg leading-relaxed ${currentNote.type === 'quote' ? 'italic' : ''}`}>
                  {currentNote.type === 'quote' && '"'}
                  {currentNote.content}
                  {currentNote.type === 'quote' && '"'}
                </p>
              )}
              
              {currentNote.extractedText && (
                <blockquote className="mt-3 pl-3 border-l-2 border-primary/30 text-muted-foreground italic">
                  {currentNote.extractedText}
                </blockquote>
              )}

              {currentNote.context && (
                <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
                  💭 {currentNote.context}
                </p>
              )}
            </div>
          )}

          {/* Bookmark */}
          {currentNote.location && (
            <p className="text-xs text-muted-foreground mt-4">
              🔖 {currentNote.location}
            </p>
          )}
        </Card>
      </div>

      {/* Navigation and actions */}
      <div className="border-t border-border px-6 py-4">
        <div className="container max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            {/* Previous arrow pill */}
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
              onClick={goToPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            {/* Forgot button */}
            <Button 
              variant="outline" 
              className="gap-2 flex-1 max-w-[140px]"
              onClick={() => handleMarkReviewed(false)}
            >
              <X className="w-4 h-4" />
              Forgot
            </Button>

            {/* Remembered button */}
            <Button 
              className="gap-2 flex-1 max-w-[160px]"
              onClick={() => handleMarkReviewed(true)}
            >
              <Check className="w-4 h-4" />
              Remembered
            </Button>

            {/* Next arrow pill */}
            <Button 
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
              onClick={goToNext}
              disabled={currentIndex === notes.length - 1}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
