import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, BookOpen, Users, UserCheck } from 'lucide-react';
import { UserProfileDialog, UserProfile } from './UserProfileDialog';
import type { SocialUser } from './SocialFeed';

interface Friend extends SocialUser {
  booksRead: number;
  currentlyReading?: string;
  isFollowing: boolean;
  bio?: string;
  joinedAt?: Date;
  notesCount?: number;
  followers?: number;
  following?: number;
}

// Mock data with full profile info
const mockFriends: Friend[] = [
  { 
    id: '1', 
    name: 'Sarah Chen', 
    username: 'sarahreads', 
    booksRead: 42, 
    currentlyReading: 'Atomic Habits', 
    isFollowing: true,
    bio: 'Book lover and productivity enthusiast. Always reading something new.',
    joinedAt: new Date('2024-03-10'),
    notesCount: 234,
    followers: 156,
    following: 89,
  },
  { 
    id: '2', 
    name: 'Marcus Johnson', 
    username: 'bookworm_mj', 
    booksRead: 28, 
    currentlyReading: 'The Psychology of Money', 
    isFollowing: true,
    bio: 'Finance and psychology geek. Learning through books.',
    joinedAt: new Date('2024-01-20'),
    notesCount: 178,
    followers: 89,
    following: 124,
  },
  { 
    id: '3', 
    name: 'Emma Wilson', 
    username: 'emmareads', 
    booksRead: 56, 
    isFollowing: true,
    bio: 'Reached 50 books this year! Fiction and non-fiction equally.',
    joinedAt: new Date('2023-08-15'),
    notesCount: 312,
    followers: 423,
    following: 201,
  },
];

const mockSuggestions: Friend[] = [
  { 
    id: '4', 
    name: 'Alex Rivera', 
    username: 'alexlitlife', 
    booksRead: 34, 
    currentlyReading: 'Deep Work', 
    isFollowing: false,
    bio: 'Deep work advocate. Building better focus one book at a time.',
    joinedAt: new Date('2024-02-01'),
    notesCount: 95,
    followers: 67,
    following: 45,
  },
  { 
    id: '5', 
    name: 'Jordan Lee', 
    username: 'jordanreads', 
    booksRead: 19, 
    isFollowing: false,
    bio: 'Just started my reading journey. Recommendations welcome!',
    joinedAt: new Date('2024-05-01'),
    notesCount: 42,
    followers: 23,
    following: 56,
  },
  { 
    id: '6', 
    name: 'Casey Morgan', 
    username: 'bookishcasey', 
    booksRead: 67, 
    currentlyReading: 'Project Hail Mary', 
    isFollowing: false,
    bio: 'Sci-fi enthusiast and amateur astronomer. Books are my telescope.',
    joinedAt: new Date('2023-03-20'),
    notesCount: 456,
    followers: 234,
    following: 123,
  },
];

function FriendCard({ 
  friend, 
  onToggleFollow,
  onProfileClick 
}: { 
  friend: Friend; 
  onToggleFollow: (id: string) => void;
  onProfileClick: (friend: Friend) => void;
}) {
  return (
    <Card 
      className="p-4 bg-card border-border/50 hover:shadow-card transition-all duration-200 cursor-pointer hover:bg-accent/5"
      onClick={() => onProfileClick(friend)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
            <AvatarImage src={friend.avatarUrl} alt={friend.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {friend.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {friend.name}
          </p>
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {friend.booksRead} books
            </span>
            {friend.currentlyReading && (
              <span className="truncate">Reading: {friend.currentlyReading}</span>
            )}
          </div>
        </div>
        
        <Button 
          variant={friend.isFollowing ? "secondary" : "default"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFollow(friend.id);
          }}
          className="flex-shrink-0"
        >
          {friend.isFollowing ? (
            <>
              <UserCheck className="w-4 h-4 mr-1" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Follow
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export function FriendsPanel() {
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [suggestions, setSuggestions] = useState<Friend[]>(mockSuggestions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleToggleFollow = (id: string) => {
    // Check if in friends
    const friendIndex = friends.findIndex(f => f.id === id);
    if (friendIndex !== -1) {
      const friend = friends[friendIndex];
      setFriends(prev => prev.filter(f => f.id !== id));
      setSuggestions(prev => [...prev, { ...friend, isFollowing: false }]);
      return;
    }

    // Check if in suggestions
    const suggestionIndex = suggestions.findIndex(f => f.id === id);
    if (suggestionIndex !== -1) {
      const suggestion = suggestions[suggestionIndex];
      setSuggestions(prev => prev.filter(f => f.id !== id));
      setFriends(prev => [...prev, { ...suggestion, isFollowing: true }]);
    }
  };

  const handleProfileClick = (friend: Friend) => {
    const profile: UserProfile = {
      id: friend.id,
      name: friend.name,
      username: friend.username,
      avatarUrl: friend.avatarUrl,
      bio: friend.bio || '',
      joinedAt: friend.joinedAt || new Date(),
      booksRead: friend.booksRead,
      notesCount: friend.notesCount || 0,
      followers: friend.followers || 0,
      following: friend.following || 0,
      isFollowing: friend.isFollowing,
      recentBooks: friend.currentlyReading 
        ? [{ id: '1', title: friend.currentlyReading, author: 'Author' }] 
        : [],
      publicNotes: [],
    };
    setSelectedProfile(profile);
    setProfileDialogOpen(true);
  };

  const handleFollow = (userId: string) => {
    setSelectedProfile(prev => prev ? { ...prev, isFollowing: true, followers: prev.followers + 1 } : null);
    // Also update in friends/suggestions lists
    const suggestionIndex = suggestions.findIndex(f => f.id === userId);
    if (suggestionIndex !== -1) {
      const suggestion = suggestions[suggestionIndex];
      setSuggestions(prev => prev.filter(f => f.id !== userId));
      setFriends(prev => [...prev, { ...suggestion, isFollowing: true }]);
    }
  };

  const handleUnfollow = (userId: string) => {
    setSelectedProfile(prev => prev ? { ...prev, isFollowing: false, followers: prev.followers - 1 } : null);
    // Also update in friends/suggestions lists
    const friendIndex = friends.findIndex(f => f.id === userId);
    if (friendIndex !== -1) {
      const friend = friends[friendIndex];
      setFriends(prev => prev.filter(f => f.id !== userId));
      setSuggestions(prev => [...prev, { ...friend, isFollowing: false }]);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="following" className="w-full">
        <TabsList className="w-full bg-secondary/50 mb-4">
          <TabsTrigger value="following" className="flex-1 gap-2">
            <Users className="w-4 h-4" />
            Following ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex-1 gap-2">
            <UserPlus className="w-4 h-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-3">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No friends yet</p>
              <p className="text-sm">Discover readers to follow in the Discover tab</p>
            </div>
          ) : (
            filteredFriends.map((friend, index) => (
              <div 
                key={friend.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <FriendCard 
                  friend={friend} 
                  onToggleFollow={handleToggleFollow}
                  onProfileClick={handleProfileClick}
                />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            People you might want to follow based on reading interests
          </p>
          {suggestions.map((friend, index) => (
            <div 
              key={friend.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <FriendCard 
                friend={friend} 
                onToggleFollow={handleToggleFollow}
                onProfileClick={handleProfileClick}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <UserProfileDialog 
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={selectedProfile}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />
    </div>
  );
}
