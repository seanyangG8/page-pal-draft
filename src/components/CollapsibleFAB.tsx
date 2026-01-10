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
    >
      {/* Action buttons - arc pattern: top, diagonal-left, left */}
      {/* Top - Voice Recording */}
      <Button
        data-action="record"
        size="icon"
        onClick={() => handleAction(onStartRecording)}
        onMouseEnter={() => setIsExpanded(true)}
        className={cn(
          "absolute h-11 w-11 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90",
          isExpanded 
            ? "opacity-100 -translate-y-16 translate-x-0 pointer-events-auto" 
            : "opacity-0 translate-y-0 translate-x-0 pointer-events-none",
          dragTarget === 'record' && "scale-110 ring-4 ring-primary/30"
        )}
        style={{ bottom: '0', right: '0' }}
      >
        <Mic className="w-5 h-5" />
      </Button>

      {/* Diagonal top-left - Camera */}
      <Button
        data-action="camera"
        size="icon"
        onClick={() => handleAction(onOpenCamera)}
        onMouseEnter={() => setIsExpanded(true)}
        className={cn(
          "absolute h-11 w-11 rounded-full shadow-lg transition-all duration-300",
          "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
          isExpanded 
            ? "opacity-100 -translate-y-12 -translate-x-12 pointer-events-auto" 
            : "opacity-0 translate-y-0 translate-x-0 pointer-events-none",
          dragTarget === 'camera' && "scale-110 ring-4 ring-secondary/50"
        )}
        style={{ bottom: '0', right: '0' }}
      >
        <Camera className="w-5 h-5" />
      </Button>

      {/* Left - Write Note */}
      <Button
        data-action="note"
        size="icon"
        variant="outline"
        onClick={() => handleAction(onAddNote)}
        onMouseEnter={() => setIsExpanded(true)}
        className={cn(
          "absolute h-11 w-11 rounded-full shadow-lg bg-background transition-all duration-300",
          isExpanded 
            ? "opacity-100 translate-y-0 -translate-x-16 pointer-events-auto" 
            : "opacity-0 translate-y-0 translate-x-0 pointer-events-none",
          dragTarget === 'note' && "scale-110 ring-4 ring-accent/30 border-accent"
        )}
        style={{ bottom: '0', right: '0' }}
      >
        <PenLine className="w-5 h-5" />
      </Button>

      {/* Main FAB button */}
      <Button
        size="icon"
        onClick={handleMainClick}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => !isDragging && setIsExpanded(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative h-14 w-14 rounded-full shadow-xl transition-all duration-300",
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
