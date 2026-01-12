import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Heart, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem, SocialUser } from './SocialFeed';

interface Comment {
  id: string;
  user: SocialUser;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
}

interface CommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedItem: FeedItem | null;
  onProfileClick: (userId: string) => void;
}

// Generate mock comments based on feedItem
const generateMockComments = (feedItem: FeedItem | null): Comment[] => {
  if (!feedItem) return [];
  
  const baseComments: Comment[] = [
    {
      id: '1',
      user: { id: '10', name: 'Jamie Brooks', username: 'jamiereads' },
      content: 'This is amazing! I need to add this to my reading list.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      likes: 3,
      isLiked: false,
    },
    {
      id: '2',
      user: { id: '11', name: 'Taylor Kim', username: 'bookish_taylor' },
      content: 'Great insight! I highlighted this same passage.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      likes: 7,
      isLiked: true,
    },
    {
      id: '3',
      user: { id: '12', name: 'Morgan Lee', username: 'morganreads' },
      content: 'Love seeing what everyone is reading!',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      likes: 2,
      isLiked: false,
    },
  ];
  
  return baseComments.slice(0, Math.min(feedItem.comments, 3));
};

export function CommentsDialog({ 
  open, 
  onOpenChange, 
  feedItem,
  onProfileClick 
}: CommentsDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  // Update comments when feedItem changes
  useEffect(() => {
    setComments(generateMockComments(feedItem));
  }, [feedItem]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      user: { id: 'current', name: 'You', username: 'yourprofile' },
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
    };
    
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => 
      prev.map(c => 
        c.id === commentId 
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  if (!feedItem) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Comments</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4">
          {/* Original post preview */}
          <div className="p-3 bg-secondary/30 rounded-xl border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => onProfileClick(feedItem.user.id)}
                className="flex items-center gap-2 active:opacity-70 transition-opacity touch-manipulation"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={feedItem.user.avatarUrl} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {feedItem.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hover:text-primary transition-colors">
                  {feedItem.user.name}
                </span>
              </button>
            </div>
            {feedItem.note && (
              <p className="text-sm text-foreground/80 italic line-clamp-2">"{feedItem.note.content}"</p>
            )}
            {feedItem.book && !feedItem.note && (
              <p className="text-sm text-foreground/80">{feedItem.book.title}</p>
            )}
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <button 
                    onClick={() => onProfileClick(comment.user.id)}
                    className="flex-shrink-0 active:scale-95 transition-transform touch-manipulation"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatarUrl} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {comment.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="bg-secondary/50 rounded-xl p-2.5">
                      <button 
                        onClick={() => onProfileClick(comment.user.id)}
                        className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors touch-manipulation"
                      >
                        {comment.user.name}
                      </button>
                      <p className="text-[13px] text-foreground mt-0.5">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 px-1">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                      </span>
                      <button 
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center gap-1 text-[11px] transition-colors touch-manipulation ${
                          comment.isLiked ? 'text-rose-500' : 'text-muted-foreground active:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                        {comment.likes > 0 && comment.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ResponsiveDialogBody>

        {/* Add comment input - pinned to bottom */}
        <ResponsiveDialogFooter className="flex-row gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            className="flex-1 h-10"
          />
          <Button 
            size="icon" 
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
