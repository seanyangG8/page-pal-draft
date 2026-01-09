import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Quote, Calendar, Users, UserPlus, UserMinus, Settings } from 'lucide-react';
import { SocialUser } from './SocialFeed';

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
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const handleFollowToggle = () => {
    if (user.isFollowing) {
      onUnfollow?.(user.id);
    } else {
      onFollow?.(user.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{user.name}'s Profile</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-border/50">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="font-display text-xl font-semibold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          
          {user.bio && (
            <p className="text-sm text-foreground/80 mt-2 max-w-xs">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-semibold text-foreground">{user.booksRead}</p>
              <p className="text-xs text-muted-foreground">Books</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{user.notesCount}</p>
              <p className="text-xs text-muted-foreground">Notes</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{user.followers}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{user.following}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {user.isOwnProfile ? (
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <Button 
                variant={user.isFollowing ? "outline" : "default"} 
                size="sm" 
                className="gap-2"
                onClick={handleFollowToggle}
              >
                {user.isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">Public Notes</TabsTrigger>
            <TabsTrigger value="books" className="flex-1">Books</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Joined {user.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            
            {user.recentBooks && user.recentBooks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Recent Reads</h3>
                <div className="space-y-2">
                  {user.recentBooks.slice(0, 3).map(book => (
                    <div key={book.id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-3 mt-4">
            {user.publicNotes && user.publicNotes.length > 0 ? (
              user.publicNotes.map(note => (
                <Card key={note.id} className="p-3 bg-secondary/30">
                  <Badge variant="secondary" className="text-xs mb-2">{note.type}</Badge>
                  <p className="text-sm text-foreground italic">"{note.content}"</p>
                  <p className="text-xs text-muted-foreground mt-2">From {note.bookTitle}</p>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No public notes yet
              </p>
            )}
          </TabsContent>

          <TabsContent value="books" className="space-y-2 mt-4">
            {user.recentBooks && user.recentBooks.length > 0 ? (
              user.recentBooks.map(book => (
                <div key={book.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <div className="w-8 h-12 bg-gradient-to-br from-primary/20 to-primary/40 rounded flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No books yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
