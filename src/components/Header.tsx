import { BookMarked, Search, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface HeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  onShowWelcome?: () => void;
  hasBooks?: boolean;
}

interface UserProfile {
  name: string;
  username: string;
  avatarUrl: string;
}

const STORAGE_KEY = 'marginalia-user-profile';

export function Header({ showSearch, onSearchClick, onShowWelcome, hasBooks }: HeaderProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({ name: 'Reader', username: 'reader', avatarUrl: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile(parsed);
    }
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => {
            if (onShowWelcome) {
              onShowWelcome();
            } else {
              navigate('/');
            }
          }} 
          className="flex items-center gap-3 group"
        >
          <div className="relative w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card group-hover:shadow-elevated transition-all duration-300 group-hover:scale-105">
            <BookMarked className="w-5 h-5 text-primary-foreground" />
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-display text-xl font-bold text-foreground tracking-tight">
              Marginalia
            </span>
            <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest uppercase font-medium">
              Reading Notes
            </span>
          </div>
        </button>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {showSearch && onSearchClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSearchClick} 
              className="md:hidden rounded-full hover:bg-secondary"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          
          <ThemeToggle />
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full p-0">
                <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-primary/40 transition-all duration-200">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground text-sm font-semibold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">{profile.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">@{profile.username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer gap-2 py-2">
                <User className="w-4 h-4" />
                My Profile
              </DropdownMenuItem>
              {hasBooks && onShowWelcome && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onShowWelcome} className="cursor-pointer gap-2 py-2">
                    <Sparkles className="w-4 h-4" />
                    About Marginalia
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
