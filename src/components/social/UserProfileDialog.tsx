import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Quote, Calendar, UserPlus, UserMinus, Settings } from 'lucide-react';
import { SocialUser } from './SocialFeed';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface UserProfile extends SocialUser {
  bio?: string;
  joinedAt: Date;
  booksRead: number;
  notesCount: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  isOwnProfile?: boolean;
  recentBooks?: { id: string; title: string; author: string }[];
  publicNotes?: { id: string; content: string; type: string; bookTitle: string }[];
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

// Mock current user profile
export const mockCurrentUser: UserProfile = {
  id: 'current-user',
  name: 'You',
  username: 'yourprofile',
  avatarUrl: '',
  bio: 'Avid reader and lifelong learner. Currently exploring philosophy and science fiction.',
  joinedAt: new Date('2024-06-15'),
  booksRead: 23,
  notesCount: 156,
  followers: 42,
  following: 38,
  isFollowing: false,
  isOwnProfile: true,
  recentBooks: [
    { id: '1', title: 'Atomic Habits', author: 'James Clear' },
    { id: '2', title: 'Deep Work', author: 'Cal Newport' },
  ],
  publicNotes: [
    { id: '1', content: 'The key to building good habits is to start small.', type: 'idea', bookTitle: 'Atomic Habits' },
  ],
};

export function UserProfileDialog({ 
  open, 
  onOpenChange, 
  user, 
  onFollow, 
  onUnfollow 
}: UserProfileDialogProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'books'>('overview');
  const isMobile = useIsMobile();

  if (!user) return null;

  const handleFollowToggle = () => {
    if (user.isFollowing) {
      onUnfollow?.(user.id);
    } else {
      onFollow?.(user.id);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'notes' as const, label: 'Notes' },
    { id: 'books' as const, label: 'Books' },
  ];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          {/* Profile Header - Compact on mobile */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mb-2">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg sm:text-xl font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">{user.name}</h2>
            <p className="text-[13px] text-muted-foreground">@{user.username}</p>
            
            {user.bio && (
              <p className="text-[13px] sm:text-sm text-foreground/80 mt-1.5 max-w-xs leading-relaxed">{user.bio}</p>
            )}

            {/* Stats - Compact row */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 w-full">
              {[
                { value: user.booksRead, label: 'Books' },
                { value: user.notesCount, label: 'Notes' },
                { value: user.followers, label: 'Followers' },
                { value: user.following, label: 'Following' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-semibold text-[15px] text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Action button */}
            <div className="mt-3">
              {user.isOwnProfile ? (
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-[13px]">
                  <Settings className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  variant={user.isFollowing ? "outline" : "default"} 
                  size="sm" 
                  className="gap-1.5 h-8 text-[13px]"
                  onClick={handleFollowToggle}
                >
                  {user.isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* iOS Segmented Control for Tabs */}
          <div className="mt-4 bg-muted/60 p-1 rounded-[10px] flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all touch-manipulation",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Joined {user.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                
                {user.recentBooks && user.recentBooks.length > 0 && (
                  <div>
                    <h3 className="text-[13px] font-medium text-foreground mb-2">Recent Reads</h3>
                    <div className="space-y-1.5">
                      {user.recentBooks.slice(0, 3).map(book => (
                        <div key={book.id} className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl">
                          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-foreground truncate">{book.title}</p>
                            <p className="text-[11px] text-muted-foreground">{book.author}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-2">
                {user.publicNotes && user.publicNotes.length > 0 ? (
                  user.publicNotes.map(note => (
                    <Card key={note.id} className="p-3 bg-muted/40 border-0 rounded-xl">
                      <Badge variant="secondary" className="text-[11px] mb-1.5 h-5">{note.type}</Badge>
                      <p className="text-[13px] text-foreground italic leading-relaxed">"{note.content}"</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">From {note.bookTitle}</p>
                    </Card>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground text-center py-6">
                    No public notes yet
                  </p>
                )}
              </div>
            )}

            {activeTab === 'books' && (
              <div className="space-y-1.5">
                {user.recentBooks && user.recentBooks.length > 0 ? (
                  user.recentBooks.map(book => (
                    <div key={book.id} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-xl">
                      <div className="w-8 h-11 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground truncate">{book.title}</p>
                        <p className="text-[11px] text-muted-foreground">{book.author}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-muted-foreground text-center py-6">
                    No books yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
