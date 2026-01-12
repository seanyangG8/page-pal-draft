import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Facebook, Link2, MessageCircle, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import type { FeedItem } from './SocialFeed';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedItem: FeedItem | null;
}

export function ShareDialog({ open, onOpenChange, feedItem }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!feedItem) return null;

  const shareUrl = `https://marginalia.app/post/${feedItem.id}`;
  const shareText = feedItem.note 
    ? `"${feedItem.note.content}" - shared on Marginalia`
    : feedItem.book 
      ? `Check out "${feedItem.book.title}" by ${feedItem.book.author} on Marginalia`
      : 'Check out this post on Marginalia';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareMessage = () => {
    const url = `sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.location.href = url;
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Share Post</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4 pb-6">
          {/* Post preview */}
          <div className="p-3 sm:p-4 bg-secondary/30 rounded-xl border border-border/30">
            <p className="text-sm font-medium text-foreground mb-1">{feedItem.user.name}</p>
            {feedItem.note && (
              <p className="text-sm text-foreground/80 italic line-clamp-3">"{feedItem.note.content}"</p>
            )}
            {feedItem.book && !feedItem.note && (
              <p className="text-sm text-foreground/80">{feedItem.book.title} by {feedItem.book.author}</p>
            )}
            {feedItem.milestone && (
              <p className="text-sm text-foreground/80">🎉 {feedItem.user.name} reached a milestone!</p>
            )}
          </div>

          {/* Share options */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 h-auto py-3 sm:py-4 touch-manipulation active:scale-95 transition-transform"
              onClick={handleShareTwitter}
            >
              <Twitter className="w-5 h-5" />
              <span className="text-[11px] sm:text-xs">Twitter</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 h-auto py-3 sm:py-4 touch-manipulation active:scale-95 transition-transform"
              onClick={handleShareFacebook}
            >
              <Facebook className="w-5 h-5" />
              <span className="text-[11px] sm:text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 h-auto py-3 sm:py-4 touch-manipulation active:scale-95 transition-transform"
              onClick={handleShareMessage}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-[11px] sm:text-xs">Message</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-1.5 sm:gap-2 h-auto py-3 sm:py-4 touch-manipulation active:scale-95 transition-transform"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Link2 className="w-5 h-5" />}
              <span className="text-[11px] sm:text-xs">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>

          {/* Copy link input */}
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1 text-sm h-10"
            />
            <Button variant="secondary" onClick={handleCopyLink} className="h-10 touch-manipulation">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
