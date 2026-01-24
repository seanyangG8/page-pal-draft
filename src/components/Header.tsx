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
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabaseClient';
import { getProfile, Profile } from '@/lib/supabaseProfile';

interface HeaderProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  onShowWelcome?: () => void;
  hasBooks?: boolean;
  title?: string;
  showLargeTitle?: boolean;
}

interface UserProfile {
  name: string;
  username: string;
  avatarUrl: string;
}

export function Header({ showSearch, onSearchClick, onShowWelcome, hasBooks, title, showLargeTitle = false }: HeaderProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<UserProfile>({ name: 'Reader', username: 'reader', avatarUrl: '' });
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const data = await getProfile();
      setProfile({
        name: data.display_name || 'Reader',
        username: data.username || 'reader',
        avatarUrl: data.avatar_url || '',
      });
    };
    loadProfile().catch((err) => console.error('Failed to load profile', err));
  }, []);

  // Track scroll position for visual effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        "bg-background/80 backdrop-blur-xl",
        "pt-[env(safe-area-inset-top)]",
        isScrolled 
          ? "border-b border-border/50 shadow-sm" 
          : "border-b border-transparent"
      )}
    >
      <div className={cn(
        "flex items-center justify-between transition-all duration-300",
        "px-4 md:px-6",
        isMobile ? "h-12" : "h-14"
      )}>
        {/* Logo */}
        <button 
          onClick={() => {
            if (onShowWelcome) {
              onShowWelcome();
            } else {
              navigate('/');
            }
          }} 
          className="flex items-center gap-2.5 group"
        >
          <div className={cn(
            "relative rounded-xl gradient-primary flex items-center justify-center shadow-card group-hover:shadow-elevated transition-all duration-300 group-hover:scale-105",
            isMobile ? "w-8 h-8" : "w-10 h-10"
          )}>
            <BookMarked className={cn(
              "text-primary-foreground",
              isMobile ? "w-4 h-4" : "w-5 h-5"
            )} />
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {/* Hide text on mobile when scrolled to save space */}
          <div className={cn(
            "flex flex-col text-left transition-all duration-200",
            isMobile && isScrolled && "hidden"
          )}>
            <span className={cn(
              "font-display font-bold text-foreground tracking-tight",
              isMobile ? "text-lg" : "text-xl"
            )}>
              Marginalia
            </span>
            {!isMobile && (
              <span className="text-[10px] text-muted-foreground -mt-0.5 tracking-widest uppercase font-medium">
                Reading Notes
              </span>
            )}
          </div>
        </button>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {showSearch && onSearchClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onSearchClick} 
              className={cn(
                "md:hidden rounded-full hover:bg-secondary",
                isMobile ? "h-9 w-9" : "h-10 w-10"
              )}
            >
              <Search className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
            </Button>
          )}
          
          <ThemeToggle />
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative rounded-full p-0",
                  isMobile ? "h-8 w-8" : "h-9 w-9"
                )}
              >
                <Avatar className={cn(
                  "ring-2 ring-border hover:ring-primary/40 transition-all duration-200",
                  isMobile ? "h-7 w-7" : "h-9 w-9"
                )}>
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback className={cn(
                    "bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
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

      {/* Large title for iOS-style headers (optional) */}
      {showLargeTitle && title && !isScrolled && (
        <div className="px-4 md:px-6 pb-3 pt-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h1>
        </div>
      )}
    </header>
  );
}
