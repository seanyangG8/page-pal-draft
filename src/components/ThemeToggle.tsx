import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "touch-manipulation",
            isMobile ? "h-9 w-9" : "h-9 w-9"
          )}
        >
          <Sun className={cn(
            "rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0",
            isMobile ? "h-5 w-5" : "h-4 w-4"
          )} />
          <Moon className={cn(
            "absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
            isMobile ? "h-5 w-5" : "h-4 w-4"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="py-2.5 touch-manipulation"
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="py-2.5 touch-manipulation"
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="py-2.5 touch-manipulation"
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
