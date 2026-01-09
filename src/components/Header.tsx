import { BookMarked, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export function Header({ showSearch, onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl gradient-amber flex items-center justify-center shadow-card group-hover:shadow-elevated transition-all duration-300 group-hover:scale-105 shine">
            <BookMarked className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-foreground tracking-tight">Marginalia</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-wide uppercase">Reading Notes</span>
          </div>
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
