import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem, SocialUser } from './SocialFeed';

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedItem: FeedItem | null;
  onProfileClick: (userId: string, user?: SocialUser) => void;
  onLike: (id: string) => void;
  onComment: () => void;
  onShare: () => void;
}

export function PostDetailDialog({
  open,
  onOpenChange,
  feedItem,
  onProfileClick,
  onLike,
  onComment,
  onShare,
}: PostDetailDialogProps) {
  if (!feedItem) return null;

  const getActivityText = () => {
    if (feedItem.type === 'milestone' && feedItem.milestone) return getMilestoneText();
    if (feedItem.type === 'shared_note') return 'shared a note';
    return 'posted an update';
  };

  const getMilestoneText = () => {
    if (!feedItem.milestone) return '';
    switch (feedItem.milestone.type) {
      case 'books_read':
        return `reached ${feedItem.milestone.value} books read`;
      case 'notes_count':
        return `captured ${feedItem.milestone.value} notes`;
      case 'streak':
        return `is on a ${feedItem.milestone.value}-day streak`;
      default:
        return '';
    }
  };

  const userName = feedItem.user?.name || `User ${feedItem.userId.slice(0, 6)}`;
  const initials = (feedItem.user?.name || feedItem.user?.username || feedItem.userId).slice(0, 2).toUpperCase();

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>Post by {userName}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onProfileClick(feedItem.userId, feedItem.user)}
              className="flex-shrink-0 transition-transform active:scale-95 touch-manipulation"
            >
              <Avatar className="h-11 w-11 sm:h-12 sm:w-12 ring-2 ring-transparent hover:ring-primary/30 transition-all">
                <AvatarImage src={feedItem.user?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onProfileClick(feedItem.userId, feedItem.user)}
                className="font-semibold text-foreground hover:text-primary transition-colors touch-manipulation"
              >
                {userName}
              </button>
              {feedItem.user?.username && (
                <p className="text-sm text-muted-foreground">@{feedItem.user.username}</p>
              )}
              <p className="text-sm text-muted-foreground">{getActivityText()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(feedItem.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>

          {feedItem.content && (
            <div className="p-3 sm:p-4 bg-secondary/50 rounded-xl border border-border/30">
              <p className="text-foreground text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {feedItem.content}
              </p>
            </div>
          )}

          {feedItem.type === 'milestone' && feedItem.milestone && (
            <div className="text-center py-6 sm:py-8">
              <p className="text-muted-foreground text-sm sm:text-base">{getMilestoneText()}</p>
            </div>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="flex-row justify-around">
          <Button
            variant="ghost"
            className={`flex-1 gap-2 h-11 touch-manipulation ${feedItem.isLiked ? 'text-rose-500' : ''}`}
            onClick={() => onLike(feedItem.id)}
          >
            <Heart className={`w-5 h-5 ${feedItem.isLiked ? 'fill-current' : ''}`} />
            <span>{feedItem.likes}</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2 h-11 touch-manipulation"
            onClick={onComment}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{feedItem.comments}</span>
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2 h-11 touch-manipulation"
            onClick={onShare}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
