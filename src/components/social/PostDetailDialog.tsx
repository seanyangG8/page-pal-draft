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
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem } from './SocialFeed';

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedItem: FeedItem | null;
  onProfileClick: (userId: string) => void;
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
    switch (feedItem.type) {
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
    if (!feedItem.milestone) return '';
    switch (feedItem.milestone.type) {
      case 'books_read':
        return `reached ${feedItem.milestone.value} books read! 🎉`;
      case 'notes_count':
        return `captured ${feedItem.milestone.value} notes! 📝`;
      case 'streak':
        return `is on a ${feedItem.milestone.value}-day reading streak! 🔥`;
      default:
        return '';
    }
  };

  const getNoteTypeBadge = () => {
    if (!feedItem.note) return null;
    const badges = {
      quote: 'note-badge-quote',
      idea: 'note-badge-idea',
      question: 'note-badge-question',
      action: 'note-badge-action',
    };
    return badges[feedItem.note.type];
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>Post by {feedItem.user.name}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4">
          {/* User header */}
          <div className="flex items-start gap-3">
            <button 
              onClick={() => onProfileClick(feedItem.user.id)}
              className="flex-shrink-0 transition-transform active:scale-95 touch-manipulation"
            >
              <Avatar className="h-11 w-11 sm:h-12 sm:w-12 ring-2 ring-transparent hover:ring-primary/30 transition-all">
                <AvatarImage src={feedItem.user.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {feedItem.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </button>
            <div className="flex-1 min-w-0">
              <button 
                onClick={() => onProfileClick(feedItem.user.id)}
                className="font-semibold text-foreground hover:text-primary transition-colors touch-manipulation"
              >
                {feedItem.user.name}
              </button>
              <p className="text-sm text-muted-foreground">
                {getActivityText()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(feedItem.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Book info */}
          {feedItem.book && feedItem.type !== 'milestone' && (
            <div className="flex items-center gap-3 p-3 sm:p-4 bg-secondary/30 rounded-xl">
              <div className="w-10 h-14 sm:w-12 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-[15px] truncate">{feedItem.book.title}</p>
                <p className="text-sm text-muted-foreground">{feedItem.book.author}</p>
              </div>
            </div>
          )}

          {/* Note content */}
          {feedItem.note && (
            <div className="p-3 sm:p-4 bg-secondary/50 rounded-xl border border-border/30">
              <Badge className={`${getNoteTypeBadge()} text-xs mb-2 sm:mb-3`}>
                {feedItem.note.type}
              </Badge>
              <p className="text-foreground italic text-base sm:text-lg leading-relaxed">
                "{feedItem.note.content}"
              </p>
            </div>
          )}

          {/* Milestone celebration */}
          {feedItem.type === 'milestone' && feedItem.milestone && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">
                {feedItem.milestone.type === 'books_read' && '📚'}
                {feedItem.milestone.type === 'notes_count' && '📝'}
                {feedItem.milestone.type === 'streak' && '🔥'}
              </div>
              <p className="text-xl sm:text-2xl font-display font-semibold text-foreground">
                {feedItem.milestone.value}
              </p>
              <p className="text-muted-foreground text-sm sm:text-base">
                {feedItem.milestone.type === 'books_read' && 'books read'}
                {feedItem.milestone.type === 'notes_count' && 'notes captured'}
                {feedItem.milestone.type === 'streak' && 'day streak'}
              </p>
            </div>
          )}
        </ResponsiveDialogBody>

        {/* Actions */}
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
