import { BookMarked, Search, User } from 'lucide-react';
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
}

interface UserProfile {
  name: string;
  username: string;
  avatarUrl: string;
}

const STORAGE_KEY = 'marginalia-user-profile';

export function Header({ showSearch, onSearchClick }: HeaderProps) {
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
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/30 transition-all">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">@{profile.username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
