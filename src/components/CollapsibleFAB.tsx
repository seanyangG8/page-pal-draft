import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Mic, Camera, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleFABProps {
  onAddNote: () => void;
  onStartRecording: () => void;
  onOpenCamera: () => void;
  cameraInputRef: React.RefObject<HTMLInputElement>;
}

export function CollapsibleFAB({ 
  onAddNote, 
  onStartRecording, 
  onOpenCamera,
  cameraInputRef 
}: CollapsibleFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Handle touch start for long press
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    
    longPressTimerRef.current = window.setTimeout(() => {
      setIsDragging(true);
      setIsExpanded(true);
    }, 300);
  };

  // Handle touch move for drag selection
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Find which action button we're over
    const actionButton = elements.find(el => el.hasAttribute('data-action'));
    if (actionButton) {
      setDragTarget(actionButton.getAttribute('data-action'));
    } else {
      setDragTarget(null);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging && dragTarget) {
      // Execute the action
      switch (dragTarget) {
        case 'record':
          onStartRecording();
          break;
        case 'camera':
          onOpenCamera();
          break;
        case 'note':
          onAddNote();
          break;
      }
      setIsExpanded(false);
    }
    
    setIsDragging(false);
    setDragTarget(null);
    touchStartRef.current = null;
  };

  const handleMainClick = () => {
    if (!isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => !isDragging && setIsExpanded(true)}
      onMouseLeave={() => !isDragging && setIsExpanded(false)}
    >
      {/* Action buttons - appear on expand */}
      <div 
        className={cn(
          "absolute bottom-16 right-0 flex flex-col gap-3 items-end transition-all duration-300",
          isExpanded 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Voice Recording */}
        <div className="flex items-center gap-3">
          <span 
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg bg-card shadow-md border border-border transition-all",
              dragTarget === 'record' ? "bg-primary text-primary-foreground scale-105" : "text-foreground"
            )}
          >
            Voice memo
          </span>
          <Button
            data-action="record"
            size="icon"
            onClick={() => handleAction(onStartRecording)}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
              dragTarget === 'record' 
                ? "bg-primary scale-110 ring-4 ring-primary/30" 
                : "bg-primary hover:bg-primary/90"
            )}
          >
            <Mic className="w-5 h-5" />
          </Button>
        </div>

        {/* Camera Capture */}
        <div className="flex items-center gap-3">
          <span 
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg bg-card shadow-md border border-border transition-all",
              dragTarget === 'camera' ? "bg-secondary scale-105" : "text-foreground"
            )}
          >
            Take photo
          </span>
          <Button
            data-action="camera"
            size="icon"
            onClick={() => handleAction(onOpenCamera)}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
              dragTarget === 'camera' 
                ? "bg-secondary scale-110 ring-4 ring-secondary/50" 
                : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            )}
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>

        {/* Add Note */}
        <div className="flex items-center gap-3">
          <span 
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-lg bg-card shadow-md border border-border transition-all",
              dragTarget === 'note' ? "bg-accent text-accent-foreground scale-105" : "text-foreground"
            )}
          >
            Write note
          </span>
          <Button
            data-action="note"
            size="icon"
            variant="outline"
            onClick={() => handleAction(onAddNote)}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg bg-background transition-all duration-200",
              dragTarget === 'note' 
                ? "scale-110 ring-4 ring-accent/30 border-accent" 
                : ""
            )}
          >
            <PenLine className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        onClick={handleMainClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
          isExpanded 
            ? "bg-muted hover:bg-muted/90 text-muted-foreground rotate-45" 
            : "bg-primary hover:bg-primary/90 rotate-0",
          isDragging && "scale-110"
        )}
      >
        <Plus className="w-6 h-6 transition-transform duration-300" />
      </Button>

      {/* Drag hint for mobile */}
      {isDragging && (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-sm pointer-events-none z-[-1]" />
      )}
    </div>
  );
}
