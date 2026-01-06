import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingAddButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingAddButton({ onClick, label }: FloatingAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 h-14 rounded-full shadow-elevated hover:shadow-glow btn-glow gap-2 px-6 animate-fade-up z-40"
    >
      <Plus className="w-5 h-5" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
}
