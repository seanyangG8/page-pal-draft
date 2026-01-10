import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      {/* Decorative icon container */}
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className="absolute inset-0 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
        
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center shadow-soft">
          <Icon className="w-9 h-9 text-muted-foreground/70" />
        </div>
      </div>
      
      <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          size="lg"
          className="rounded-xl shadow-soft hover:shadow-card transition-all"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
