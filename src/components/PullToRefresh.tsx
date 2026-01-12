import { useState, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptic } from '@/hooks/use-haptic';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const { light, success } = useHaptic();
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const isAtTop = useRef(true);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isRefreshing) return;
    
    // Check if we're scrolled to top
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    isAtTop.current = scrollTop <= 0;
    
    if (isAtTop.current) {
      touchStartY.current = e.touches[0].clientY;
      setHasTriggeredHaptic(false);
    }
  }, [isMobile, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isRefreshing || !isAtTop.current) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    // Only pull down
    if (diff > 0) {
      // Apply resistance
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);
      
      // Haptic when crossing threshold
      if (distance >= PULL_THRESHOLD && !hasTriggeredHaptic) {
        light();
        setHasTriggeredHaptic(true);
      }
    }
  }, [isMobile, isRefreshing, hasTriggeredHaptic, light]);

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile || isRefreshing) return;
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
        success();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isMobile, isRefreshing, pullDistance, onRefresh, success]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-opacity duration-200 z-10",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: 0,
          height: `${pullDistance}px`,
          minHeight: isRefreshing ? `${PULL_THRESHOLD}px` : 0,
        }}
      >
        <div 
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-md transition-all duration-200",
            isRefreshing && "animate-pulse"
          )}
          style={{
            transform: `rotate(${progress * 180}deg) scale(${0.8 + progress * 0.2})`,
          }}
        >
          <Loader2 
            className={cn(
              "w-5 h-5 text-primary",
              isRefreshing && "animate-spin"
            )} 
          />
        </div>
      </div>

      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 && !isRefreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
