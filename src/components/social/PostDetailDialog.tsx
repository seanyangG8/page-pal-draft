import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Post by {feedItem.user.name}</DialogTitle>
        </DialogHeader>

        {/* User header */}
        <div className="flex items-start gap-3">
          <button 
            onClick={() => onProfileClick(feedItem.user.id)}
            className="flex-shrink-0 transition-transform hover:scale-105"
          >
            <Avatar className="h-12 w-12 ring-2 ring-transparent hover:ring-primary/30 transition-all">
              <AvatarImage src={feedItem.user.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {feedItem.user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <button 
              onClick={() => onProfileClick(feedItem.user.id)}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {feedItem.user.name}
            </button>
            <p className="text-sm text-muted-foreground">
              {getActivityText()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(feedItem.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Book info */}
        {feedItem.book && feedItem.type !== 'milestone' && (
          <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
            <div className="w-12 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{feedItem.book.title}</p>
              <p className="text-sm text-muted-foreground">{feedItem.book.author}</p>
            </div>
          </div>
        )}

        {/* Note content */}
        {feedItem.note && (
          <div className="p-4 bg-secondary/50 rounded-lg border border-border/30">
            <Badge className={`${getNoteTypeBadge()} text-xs mb-3`}>
              {feedItem.note.type}
            </Badge>
            <p className="text-foreground italic text-lg leading-relaxed">
              "{feedItem.note.content}"
            </p>
          </div>
        )}

        {/* Milestone celebration */}
        {feedItem.type === 'milestone' && feedItem.milestone && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">
              {feedItem.milestone.type === 'books_read' && '📚'}
              {feedItem.milestone.type === 'notes_count' && '📝'}
              {feedItem.milestone.type === 'streak' && '🔥'}
            </div>
            <p className="text-2xl font-display font-semibold text-foreground">
              {feedItem.milestone.value}
            </p>
            <p className="text-muted-foreground">
              {feedItem.milestone.type === 'books_read' && 'books read'}
              {feedItem.milestone.type === 'notes_count' && 'notes captured'}
              {feedItem.milestone.type === 'streak' && 'day streak'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-around pt-4 border-t border-border/50">
          <Button 
            variant="ghost" 
            className={`flex-1 gap-2 ${feedItem.isLiked ? 'text-rose-500' : ''}`}
            onClick={() => onLike(feedItem.id)}
          >
            <Heart className={`w-5 h-5 ${feedItem.isLiked ? 'fill-current' : ''}`} />
            <span>{feedItem.likes}</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex-1 gap-2"
            onClick={onComment}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{feedItem.comments}</span>
          </Button>
          <Button 
            variant="ghost" 
            className="flex-1 gap-2"
            onClick={onShare}
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
