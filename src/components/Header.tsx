import { BookMarked, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export function Header({ showSearch, onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg gradient-amber flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow">
            <BookMarked className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-foreground">Marginalia</span>
        </a>

        <div className="flex items-center gap-2">
          {showSearch && onSearchClick && (
            <Button variant="ghost" size="icon" onClick={onSearchClick} className="md:hidden">
              <Search className="w-5 h-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
