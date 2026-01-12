import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptic } from '@/hooks/use-haptic';
import { cn } from '@/lib/utils';

interface FloatingAddButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingAddButton({ onClick, label }: FloatingAddButtonProps) {
  const isMobile = useIsMobile();
  const { medium } = useHaptic();
  
  const handleClick = () => {
    medium();
    onClick();
  };
  
  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        "fixed right-4 md:right-6 h-14 rounded-full shadow-elevated hover:shadow-glow btn-glow gap-2 px-6 animate-fade-up z-40 transition-all duration-300 hover:scale-105 active:scale-95 group touch-manipulation",
        // Position above bottom tab bar on mobile
        isMobile ? "bottom-[calc(56px+env(safe-area-inset-bottom)+16px)]" : "bottom-6"
      )}
    >
      <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
}
