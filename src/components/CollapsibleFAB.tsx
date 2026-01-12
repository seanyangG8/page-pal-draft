import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Mic, Camera, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptic } from '@/hooks/use-haptic';

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
  const isMobile = useIsMobile();
  const { light, medium, selection } = useHaptic();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [prevDragTarget, setPrevDragTarget] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isDragging) return;
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, 150);
  };

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
      medium();
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
    const newTarget = actionButton ? actionButton.getAttribute('data-action') : null;
    
    // Haptic feedback when changing targets
    if (newTarget !== prevDragTarget && newTarget) {
      selection();
      setPrevDragTarget(newTarget);
    }
    
    setDragTarget(newTarget);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging && dragTarget) {
      // Execute the action with haptic
      light();
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
    setPrevDragTarget(null);
    touchStartRef.current = null;
  };

  const handleMainClick = () => {
    if (!isDragging) {
      // Direct click opens add note dialog
      medium();
      onAddNote();
      setIsExpanded(false);
    }
  };

  const handleAction = (action: () => void) => {
    light();
    action();
    setIsExpanded(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed right-4 md:right-6 z-50",
        // Position above bottom tab bar on mobile
        isMobile ? "bottom-[calc(56px+env(safe-area-inset-bottom)+16px)]" : "bottom-6"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover buffer so you can move from + to the icons without collapsing */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute bottom-0 right-0 h-44 w-44 bg-background/0",
          isExpanded ? "pointer-events-auto" : "pointer-events-none"
        )}
      />

      {/* Action buttons - arc pattern: top, diagonal-left, left */}
      {/* Top - Voice Recording */}
      <Button
        data-action="record"
        size="icon"
        onClick={() => handleAction(onStartRecording)}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleAction(onStartRecording);
        }}
        onMouseEnter={() => setIsExpanded(true)}
        className={cn(
          "absolute h-12 w-12 md:h-11 md:w-11 rounded-full shadow-lg transition-all duration-300 touch-manipulation",
          "bg-[hsl(0_45%_85%)] text-[hsl(0_40%_35%)] hover:bg-[hsl(0_50%_75%)] hover:scale-105",
          "dark:bg-[hsl(0_35%_30%)] dark:text-[hsl(0_30%_85%)] dark:hover:bg-[hsl(0_40%_40%)]",
          isExpanded 
            ? "opacity-100 -translate-y-16 translate-x-0 pointer-events-auto" 
            : "opacity-0 translate-y-0 translate-x-0 pointer-events-none",
          dragTarget === 'record' && "scale-110 ring-4 ring-[hsl(0_40%_70%)]/30"
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
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleAction(onOpenCamera);
        }}
        onMouseEnter={() => setIsExpanded(true)}
        className={cn(
          "absolute h-12 w-12 md:h-11 md:w-11 rounded-full shadow-lg transition-all duration-300 touch-manipulation",
          "bg-[hsl(40_15%_86%)] text-[hsl(40_15%_40%)] hover:bg-[hsl(40_18%_76%)] hover:scale-105",
          "dark:bg-[hsl(40_12%_25%)] dark:text-[hsl(40_12%_80%)] dark:hover:bg-[hsl(40_15%_35%)]",
          isExpanded 
            ? "opacity-100 -translate-y-12 -translate-x-12 pointer-events-auto" 
            : "opacity-0 translate-y-0 translate-x-0 pointer-events-none",
          dragTarget === 'camera' && "scale-110 ring-4 ring-[hsl(40_15%_70%)]/30"
        )}
        style={{ bottom: '0', right: '0' }}
      >
        <Camera className="w-5 h-5" />
      </Button>

      {/* Left - Write Note */}
      <Button
        data-action="note"
        size="icon"
        onClick={() => handleAction(onAddNote)}
        onTouchEnd={(e) => {
          e.stopPropagation();
          handleAction(onAddNote);
        }}
        onMouseEnter={() => setIsExpanded(true)}
        className={cn(
          "absolute h-12 w-12 md:h-11 md:w-11 rounded-full shadow-lg transition-all duration-300 touch-manipulation",
          "bg-[hsl(35_40%_88%)] text-[hsl(35_40%_35%)] hover:bg-[hsl(35_45%_78%)] hover:scale-105",
          "dark:bg-[hsl(35_30%_25%)] dark:text-[hsl(35_30%_85%)] dark:hover:bg-[hsl(35_35%_35%)]",
          isExpanded 
            ? "opacity-100 translate-y-0 -translate-x-16 pointer-events-auto" 
            : "opacity-0 translate-y-0 translate-x-0 pointer-events-none",
          dragTarget === 'note' && "scale-110 ring-4 ring-[hsl(35_40%_70%)]/30"
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative h-14 w-14 rounded-full shadow-xl transition-all duration-300 touch-manipulation",
          "bg-primary hover:bg-primary/90",
          isDragging && "scale-110"
        )}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Drag hint for mobile */}
      {isDragging && (
        <div className="fixed inset-0 bg-background/20 backdrop-blur-sm pointer-events-none z-[-1]" />
      )}
    </div>
  );
}
