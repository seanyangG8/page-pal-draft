import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserProfileDialog, UserProfile } from './UserProfileDialog';
import { CommentsDialog } from './CommentsDialog';
import { ShareDialog } from './ShareDialog';
import { PostDetailDialog } from './PostDetailDialog';

// Types for social features (will be connected to backend later)
export interface SocialUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface FeedItem {
  id: string;
  type: 'started_reading' | 'shared_note' | 'finished_book' | 'milestone';
  user: SocialUser;
  timestamp: Date;
  book?: {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
  };
  note?: {
    content: string;
    type: 'quote' | 'idea' | 'question' | 'action';
  };
  milestone?: {
    type: 'books_read' | 'notes_count' | 'streak';
    value: number;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
}

// Mock user profiles for clickable avatars
const mockUserProfiles: Record<string, UserProfile> = {
  '1': {
    id: '1',
    name: 'Sarah Chen',
    username: 'sarahreads',
    avatarUrl: '',
    bio: 'Book lover and productivity enthusiast. Always reading something new.',
    joinedAt: new Date('2024-03-10'),
    booksRead: 47,
    notesCount: 234,
    followers: 156,
    following: 89,
    isFollowing: true,
    recentBooks: [
      { id: '1', title: 'Atomic Habits', author: 'James Clear' },
      { id: '2', title: 'The 4-Hour Workweek', author: 'Tim Ferriss' },
    ],
    publicNotes: [
      { id: '1', content: 'You do not rise to the level of your goals. You fall to the level of your systems.', type: 'quote', bookTitle: 'Atomic Habits' },
    ],
  },
  '2': {
    id: '2',
    name: 'Marcus Johnson',
    username: 'bookworm_mj',
    avatarUrl: '',
    bio: 'Finance and psychology geek. Learning through books.',
    joinedAt: new Date('2024-01-20'),
    booksRead: 32,
    notesCount: 178,
    followers: 89,
    following: 124,
    isFollowing: false,
    recentBooks: [
      { id: '1', title: 'The Psychology of Money', author: 'Morgan Housel' },
    ],
    publicNotes: [],
  },
  '3': {
    id: '3',
    name: 'Emma Wilson',
    username: 'emmareads',
    avatarUrl: '',
    bio: 'Reached 50 books this year! Fiction and non-fiction equally.',
    joinedAt: new Date('2023-08-15'),
    booksRead: 50,
    notesCount: 312,
    followers: 423,
    following: 201,
    isFollowing: true,
    recentBooks: [
      { id: '1', title: 'Project Hail Mary', author: 'Andy Weir' },
      { id: '2', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
    ],
    publicNotes: [
      { id: '1', content: 'The best ideas often come from unexpected places.', type: 'idea', bookTitle: 'Thinking, Fast and Slow' },
    ],
  },
  '4': {
    id: '4',
    name: 'Alex Rivera',
    username: 'alexlitlife',
    avatarUrl: '',
    bio: 'Deep work advocate. Building better focus one book at a time.',
    joinedAt: new Date('2024-02-01'),
    booksRead: 18,
    notesCount: 95,
    followers: 67,
    following: 45,
    isFollowing: false,
    recentBooks: [
      { id: '1', title: 'Deep Work', author: 'Cal Newport' },
    ],
    publicNotes: [],
  },
};

// Mock data for demonstration
const mockFeedItems: FeedItem[] = [
  {
    id: '1',
    type: 'shared_note',
    user: { id: '1', name: 'Sarah Chen', username: 'sarahreads', avatarUrl: '' },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    book: { id: '1', title: 'Atomic Habits', author: 'James Clear' },
    note: { content: '"You do not rise to the level of your goals. You fall to the level of your systems."', type: 'quote' },
    likes: 24,
    comments: 5,
    isLiked: false,
  },
  {
    id: '2',
    type: 'started_reading',
    user: { id: '2', name: 'Marcus Johnson', username: 'bookworm_mj' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    book: { id: '2', title: 'The Psychology of Money', author: 'Morgan Housel' },
    likes: 8,
    comments: 2,
    isLiked: true,
  },
  {
    id: '3',
    type: 'milestone',
    user: { id: '3', name: 'Emma Wilson', username: 'emmareads' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    milestone: { type: 'books_read', value: 50 },
    likes: 156,
    comments: 23,
    isLiked: false,
  },
  {
    id: '4',
    type: 'finished_book',
    user: { id: '4', name: 'Alex Rivera', username: 'alexlitlife' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    book: { id: '3', title: 'Deep Work', author: 'Cal Newport' },
    likes: 42,
    comments: 8,
    isLiked: false,
  },
];

function FeedItemCard({ 
  item, 
  onLike, 
  onProfileClick,
  onPostClick,
  onCommentClick,
  onShareClick,
}: { 
  item: FeedItem; 
  onLike: (id: string) => void;
  onProfileClick: (userId: string) => void;
  onPostClick: (item: FeedItem) => void;
  onCommentClick: (item: FeedItem) => void;
  onShareClick: (item: FeedItem) => void;
}) {
  const getActivityText = () => {
    switch (item.type) {
      case 'started_reading':
        return 'started reading';
      case 'finished_book':
        return 'finished reading';
      case 'shared_note':
        return 'shared a note from';
      case 'milestone':
        return getMilestoneText();
      default:
        return '';
    }
  };

  const getMilestoneText = () => {
    if (!item.milestone) return '';
    switch (item.milestone.type) {
      case 'books_read':
        return `reached ${item.milestone.value} books read! 🎉`;
      case 'notes_count':
        return `captured ${item.milestone.value} notes! 📝`;
      case 'streak':
        return `is on a ${item.milestone.value}-day reading streak! 🔥`;
      default:
        return '';
    }
  };

  const getNoteTypeBadge = () => {
    if (!item.note) return null;
    const badges = {
      quote: 'note-badge-quote',
      idea: 'note-badge-idea',
      question: 'note-badge-question',
      action: 'note-badge-action',
    };
    return badges[item.note.type];
  };

  return (
    <Card 
      className="p-4 bg-card border-border/50 hover:shadow-card transition-all cursor-pointer hover:bg-accent/5"
      onClick={() => onPostClick(item)}
    >
      <div className="flex gap-3">
        {/* Clickable Avatar - stops propagation to open profile instead */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick(item.user.id);
          }}
          className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
        >
          <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-primary/30 transition-all">
            <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {item.user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </button>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onProfileClick(item.user.id);
                    }}
                    className="font-semibold text-foreground hover:text-primary transition-colors hover:underline"
                  >
                    {item.user.name}
                  </button>
                  <span className="text-muted-foreground"> {getActivityText()}</span>
                </p>
                {item.book && item.type !== 'milestone' && (
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {item.book.title}
                    <span className="text-muted-foreground font-normal"> by {item.book.author}</span>
                  </p>
                )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Note content - now just visual since card is clickable */}
          {item.note && (
            <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border/30">
              <span className={`inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full mb-2 ${getNoteTypeBadge()}`}>
                {item.note.type}
              </span>
              <p className="text-sm text-foreground italic">
                {item.note.content}
              </p>
            </div>
          )}

          {/* Book visual for started/finished */}
          {(item.type === 'started_reading' || item.type === 'finished_book') && item.book && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-secondary/50 dark:bg-secondary/30 rounded-lg border border-border/30">
              <div className="w-10 h-14 bg-gradient-to-br from-primary/20 to-primary/30 rounded flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.book.title}</p>
                <p className="text-xs text-muted-foreground">{item.book.author}</p>
              </div>
            </div>
          )}

          {/* Milestone */}
          {item.type === 'milestone' && (
            <div className="mt-3 p-4 bg-gradient-to-r from-secondary to-muted dark:from-amber-950/30 dark:to-amber-900/20 rounded-lg text-center border border-border/30">
              <span className="text-2xl">
                {item.milestone?.type === 'books_read' && '📚'}
                {item.milestone?.type === 'notes_count' && '📝'}
                {item.milestone?.type === 'streak' && '🔥'}
              </span>
              <p className="text-lg font-semibold text-foreground mt-1">{item.milestone?.value}</p>
              <p className="text-xs text-muted-foreground">
                {item.milestone?.type === 'books_read' && 'books read'}
                {item.milestone?.type === 'notes_count' && 'notes captured'}
                {item.milestone?.type === 'streak' && 'day streak'}
              </p>
            </div>
          )}

          {/* Actions - stop propagation so they don't trigger card click */}
          <div className="flex items-center gap-4 mt-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-8 px-2 gap-1.5 ${item.isLiked ? 'text-rose-500' : 'text-muted-foreground'}`}
              onClick={() => onLike(item.id)}
            >
              <Heart className={`h-4 w-4 ${item.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{item.likes}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-primary"
              onClick={() => onCommentClick(item)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{item.comments}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-primary"
              onClick={() => onShareClick(item)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SocialFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(mockFeedItems);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);
  const [postDetailOpen, setPostDetailOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleLike = (id: string) => {
    setFeedItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
    // Also update selectedPost if it's the same
    if (selectedPost?.id === id) {
      setSelectedPost(prev => prev ? { ...prev, isLiked: !prev.isLiked, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1 } : null);
    }
  };

  const handleProfileClick = (userId: string) => {
    const profile = mockUserProfiles[userId];
    if (profile) {
      setSelectedProfile(profile);
      setProfileDialogOpen(true);
    }
  };

  const handlePostClick = (item: FeedItem) => {
    setSelectedPost(item);
    setPostDetailOpen(true);
  };

  const handleCommentClick = (item: FeedItem) => {
    setSelectedPost(item);
    setCommentsOpen(true);
  };

  const handleShareClick = (item: FeedItem) => {
    setSelectedPost(item);
    setShareOpen(true);
  };

  const handleFollow = (userId: string) => {
    setSelectedProfile(prev => prev ? { ...prev, isFollowing: true, followers: prev.followers + 1 } : null);
  };

  const handleUnfollow = (userId: string) => {
    setSelectedProfile(prev => prev ? { ...prev, isFollowing: false, followers: prev.followers - 1 } : null);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">Reading Feed</h2>
        <Button variant="outline" size="sm">
          Find Friends
        </Button>
      </div>
      
      {feedItems.map((item, index) => (
        <div 
          key={item.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <FeedItemCard 
            item={item} 
            onLike={handleLike} 
            onProfileClick={handleProfileClick}
            onPostClick={handlePostClick}
            onCommentClick={handleCommentClick}
            onShareClick={handleShareClick}
          />
        </div>
      ))}

      <UserProfileDialog 
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={selectedProfile}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />

      <PostDetailDialog
        open={postDetailOpen}
        onOpenChange={setPostDetailOpen}
        feedItem={selectedPost}
        onProfileClick={handleProfileClick}
        onLike={handleLike}
        onComment={() => {
          setPostDetailOpen(false);
          setCommentsOpen(true);
        }}
        onShare={() => {
          setPostDetailOpen(false);
          setShareOpen(true);
        }}
      />

      <CommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        feedItem={selectedPost}
        onProfileClick={handleProfileClick}
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        feedItem={selectedPost}
      />
    </div>
  );
}
