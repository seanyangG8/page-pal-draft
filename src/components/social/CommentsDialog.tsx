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
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedItem, SocialUser } from './SocialFeed';
import { useComments, useCommentsMutations } from '@/api/hooks';

export function CommentsDialog({ 
  open, 
  onOpenChange, 
  feedItem,
  onProfileClick 
}: { open: boolean; onOpenChange: (open: boolean) => void; feedItem: FeedItem | null; onProfileClick: (userId: string, user?: SocialUser) => void; }) {
  const [newComment, setNewComment] = useState('');
  const postId = feedItem?.id;
  const { data: commentsData } = useComments(postId || '');
  const { addComment } = useCommentsMutations();

  useEffect(() => {
    setNewComment('');
  }, [postId]);

  const handleAddComment = () => {
    if (!postId || !newComment.trim()) return;
    addComment.mutate(
      { postId, content: newComment.trim() },
      {
        onSuccess: () => setNewComment(''),
      },
    );
  };

  if (!feedItem) return null;

  const getDisplayName = (userId: string, user?: { displayName: string | null; username: string | null }) =>
    user?.displayName || user?.username || `User ${userId.slice(0, 6)}`;
  const getInitials = (userId: string, user?: { displayName: string | null; username: string | null }) => {
    const source = user?.displayName || user?.username || userId;
    return source.slice(0, 2).toUpperCase();
  };

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
                onClick={() => onProfileClick(feedItem.userId, feedItem.user)}
                className="flex items-center gap-2 active:opacity-70 transition-opacity touch-manipulation"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={feedItem.user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(feedItem.userId, feedItem.user ? { displayName: feedItem.user.name, username: feedItem.user.username ?? null } : undefined)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hover:text-primary transition-colors">
                  {getDisplayName(feedItem.userId, feedItem.user ? { displayName: feedItem.user.name, username: feedItem.user.username ?? null } : undefined)}
                </span>
              </button>
            </div>
            {feedItem.content && (
              <p className="text-sm text-foreground/80 italic line-clamp-2">"{feedItem.content}"</p>
            )}
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {!commentsData || commentsData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              commentsData.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <button 
                    onClick={() =>
                      onProfileClick(comment.userId, comment.user
                        ? {
                            id: comment.user.id,
                            name: comment.user.displayName || comment.user.username || `User ${comment.user.id.slice(0, 6)}`,
                            username: comment.user.username,
                            avatarUrl: comment.user.avatarUrl || undefined,
                          }
                        : undefined)
                    }
                    className="flex-shrink-0 active:scale-95 transition-transform touch-manipulation"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(comment.userId, comment.user)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="bg-secondary/50 rounded-xl p-2.5">
                      <button 
                        onClick={() =>
                          onProfileClick(comment.userId, comment.user
                            ? {
                                id: comment.user.id,
                                name: comment.user.displayName || comment.user.username || `User ${comment.user.id.slice(0, 6)}`,
                                username: comment.user.username,
                                avatarUrl: comment.user.avatarUrl || undefined,
                              }
                            : undefined)
                        }
                        className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors touch-manipulation"
                      >
                        {getDisplayName(comment.userId, comment.user)}
                      </button>
                      <p className="text-[13px] text-foreground mt-0.5">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1 px-1">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
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
