import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserProfileDialog, type UserProfile } from './UserProfileDialog';
import { CommentsDialog } from './CommentsDialog';
import { ShareDialog } from './ShareDialog';
import { PostDetailDialog } from './PostDetailDialog';
import { useFeed, useSocialMutations, useMyLikes } from '@/api/hooks';
import { fetchProfileSummary } from '@/api/social';
import { toast } from 'sonner';

export type SocialUser = {
  id: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
};

export interface FeedItem {
  id: string;
  type: 'shared_note' | 'status' | 'milestone';
  userId: string;
  user?: SocialUser;
  timestamp: Date;
  content?: string | null;
  likes: number;
  comments: number;
  isLiked: boolean;
  milestone?: { type: 'books_read' | 'notes_count' | 'streak'; value: number };
}

function getUserName(user: SocialUser | undefined, fallbackId: string) {
  return user?.name || `User ${fallbackId.slice(0, 6)}`;
}

function getUserInitials(user: SocialUser | undefined, fallbackId: string) {
  const source = user?.name || user?.username || fallbackId;
  return source.slice(0, 2).toUpperCase();
}

function FeedItemCard({
  item,
  onLike,
  onUnlike,
  onProfileClick,
  onPostClick,
  onCommentClick,
  onShareClick,
}: {
  item: FeedItem;
  onLike: (id: string) => void;
  onUnlike: (id: string) => void;
  onProfileClick: (userId: string, user?: SocialUser) => void;
  onPostClick: (item: FeedItem) => void;
  onCommentClick: (item: FeedItem) => void;
  onShareClick: (item: FeedItem) => void;
}) {
  return (
    <Card
      className="p-4 bg-card border-border/50 hover:shadow-card transition-all cursor-pointer hover:bg-accent/5"
      onClick={() => onPostClick(item)}
    >
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick(item.userId, item.user);
          }}
          className="flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
        >
          <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-primary/30 transition-all">
            <AvatarImage src={item.user?.avatarUrl ?? undefined} alt={item.user?.name ?? 'User'} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getUserInitials(item.user, item.userId)}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {getUserName(item.user, item.userId)}
              </p>
              {item.user?.username && (
                <p className="text-xs text-muted-foreground">@{item.user.username}</p>
              )}
              {item.content && <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>}
              {item.milestone && (
                <p className="text-sm text-muted-foreground">
                  {item.milestone.type === 'books_read' && `Reached ${item.milestone.value} books read`}
                  {item.milestone.type === 'notes_count' && `Captured ${item.milestone.value} notes`}
                  {item.milestone.type === 'streak' && `On a ${item.milestone.value}-day streak`}
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

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 gap-1.5 ${item.isLiked ? 'text-rose-500' : 'text-muted-foreground'}`}
              onClick={() => (item.isLiked ? onUnlike(item.id) : onLike(item.id))}
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
  const { data: feedData, isLoading } = useFeed();
  const { data: myLikes } = useMyLikes();
  const { like, unlike, follow, unfollow } = useSocialMutations();

  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FeedItem | null>(null);
  const [postDetailOpen, setPostDetailOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const feedItems: FeedItem[] = useMemo(() => {
    if (!feedData) return [];
    const likedSet = new Set(myLikes || []);
    return feedData.map((p) => ({
      id: p.id,
      type: p.type,
      userId: p.userId,
      user: p.user
        ? {
            id: p.user.id,
            name: p.user.displayName || p.user.username || `User ${p.user.id.slice(0, 6)}`,
            username: p.user.username,
            avatarUrl: p.user.avatarUrl ?? undefined,
          }
        : undefined,
      timestamp: p.createdAt,
      content: p.content,
      milestone: p.milestoneType ? { type: p.milestoneType, value: p.milestoneValue ?? 0 } : undefined,
      likes: p.likeCount,
      comments: p.commentCount,
      isLiked: likedSet.has(p.id),
    }));
  }, [feedData, myLikes]);

  const handleLike = (id: string) => {
    like.mutate(id, { onError: () => toast.error('Failed to like post') });
  };

  const handleUnlike = (id: string) => {
    unlike.mutate(id, { onError: () => toast.error('Failed to unlike post') });
  };

  const handleProfileClick = async (userId: string, user?: SocialUser) => {
    const fallbackProfile: UserProfile = {
      id: userId,
      name: getUserName(user, userId),
      username: user?.username || userId.slice(0, 10),
      avatarUrl: user?.avatarUrl || '',
      bio: '',
      joinedAt: new Date(),
      booksRead: 0,
      notesCount: 0,
      followers: 0,
      following: 0,
      isFollowing: false,
      isOwnProfile: false,
      recentBooks: [],
      publicNotes: [],
    };
    setSelectedProfile(fallbackProfile);
    setProfileDialogOpen(true);
    try {
      const profile = await fetchProfileSummary(userId);
      setSelectedProfile({
        id: profile.id,
        name: profile.displayName || profile.username || getUserName(user, userId),
        username: profile.username || user?.username || userId.slice(0, 10),
        avatarUrl: profile.avatarUrl || user?.avatarUrl || '',
        bio: profile.bio || '',
        joinedAt: profile.createdAt,
        booksRead: profile.booksCount ?? 0,
        notesCount: profile.notesCount ?? 0,
        followers: profile.followers,
        following: profile.following,
        isFollowing: profile.isFollowing,
        isOwnProfile: profile.isSelf,
        recentBooks: [],
        publicNotes: [],
      });
    } catch (err) {
      console.error(err);
      toast.error('Could not load profile');
    }
  };

  const handleFollowUser = (userId: string) => {
    if (!selectedProfile || selectedProfile.isOwnProfile || selectedProfile.isFollowing) return;
    follow.mutate(userId, {
      onSuccess: () =>
        setSelectedProfile((prev) =>
          prev && prev.id === userId
            ? { ...prev, isFollowing: true, followers: prev.followers + 1 }
            : prev
        ),
      onError: () => toast.error('Failed to follow'),
    });
  };

  const handleUnfollowUser = (userId: string) => {
    if (!selectedProfile || selectedProfile.isOwnProfile || !selectedProfile.isFollowing) return;
    unfollow.mutate(userId, {
      onSuccess: () =>
        setSelectedProfile((prev) =>
          prev && prev.id === userId
            ? { ...prev, isFollowing: false, followers: Math.max(0, prev.followers - 1) }
            : prev
        ),
      onError: () => toast.error('Failed to unfollow'),
    });
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

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground">Reading Feed</h2>
        <Button variant="outline" size="sm">
          Find Friends
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading feed...</p>}
      {!isLoading && feedItems.length === 0 && (
        <p className="text-sm text-muted-foreground">No posts yet. Share a note to get started.</p>
      )}

      {feedItems.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <FeedItemCard
            item={item}
            onLike={handleLike}
            onUnlike={handleUnlike}
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
        onFollow={handleFollowUser}
        onUnfollow={handleUnfollowUser}
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

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} feedItem={selectedPost} />
    </div>
  );
}
