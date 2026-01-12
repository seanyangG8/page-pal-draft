import { Library, FileText, Rss, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabValue = 'library' | 'notes' | 'feed' | 'friends';

interface MobileTabBarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const tabs = [
  { value: 'library' as TabValue, label: 'Library', icon: Library },
  { value: 'notes' as TabValue, label: 'Notes', icon: FileText },
  { value: 'feed' as TabValue, label: 'Feed', icon: Rss },
  { value: 'friends' as TabValue, label: 'Friends', icon: Users },
];

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
      
      {/* Tab items */}
      <div className="relative flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] h-[calc(56px+env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-4 py-2 min-w-[64px] rounded-xl transition-all duration-200",
                "active:scale-95 touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-wide transition-all duration-200",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
