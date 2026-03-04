import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, Users, UserCheck } from 'lucide-react';
import { UserProfileDialog, UserProfile } from './UserProfileDialog';
import type { SocialUser } from './SocialFeed';
import {
  useFollowingProfiles,
  useSuggestedProfiles,
  useSocialMutations,
} from '@/api/hooks';
import { fetchProfileSummary, type BasicProfile } from '@/api/social';
import { toast } from 'sonner';

type FriendProfile = SocialUser & {
  bio?: string | null;
  joinedAt?: Date;
  isFollowing: boolean;
  isDemo?: boolean;
};

function toFriendProfile(profile: BasicProfile, isFollowing: boolean): FriendProfile {
  return {
    id: profile.id,
    name: profile.displayName || profile.username || 'Reader',
    username: profile.username || profile.id.slice(0, 10),
    avatarUrl: profile.avatarUrl || undefined,
    bio: profile.bio,
    joinedAt: profile.createdAt,
    isFollowing,
  };
}

const DEMO_FOLLOWING: FriendProfile[] = [
  {
    id: 'demo-ari',
    name: 'Ari Winters',
    username: 'ari.writes',
    avatarUrl: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Ari',
    bio: 'Reads non-fiction and shares annotated highlights.',
    joinedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    isFollowing: true,
    isDemo: true,
  },
  {
    id: 'demo-lena',
    name: 'Lena Park',
    username: 'lenareads',
    avatarUrl: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Lena',
    bio: 'Poetry + essays; building a commonplace book.',
    joinedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    isFollowing: true,
    isDemo: true,
  },
];

const DEMO_SUGGESTIONS: FriendProfile[] = [
  {
    id: 'demo-omar',
    name: 'Omar Saleh',
    username: 'omar_notes',
    avatarUrl: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Omar',
    bio: 'Engineering notes from "Build" mapped into systems diagrams.',
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isFollowing: false,
    isDemo: true,
  },
  {
    id: 'demo-rosie',
    name: 'Rosie Patel',
    username: 'rosie.learning',
    avatarUrl: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Rosie',
    bio: 'Design history references shared daily.',
    joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    isFollowing: false,
    isDemo: true,
  },
  {
    id: 'demo-jules',
    name: 'Jules Martin',
    username: 'julesreads',
    avatarUrl: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Jules',
    bio: 'Audiobook power user tagging quotes for essays.',
    joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    isFollowing: false,
    isDemo: true,
  },
];

function FriendCard({
  friend,
  onToggleFollow,
  onProfileClick,
}: {
  friend: FriendProfile;
  onToggleFollow: (id: string, isFollowing: boolean) => void;
  onProfileClick: (friend: FriendProfile) => void;
}) {
  const initials =
    friend.name?.split(' ').map((n) => n[0]).join('').toUpperCase() ||
    friend.username?.slice(0, 2).toUpperCase();

  return (
    <Card
      className="p-3 sm:p-4 bg-card border-border/50 hover:shadow-card transition-all duration-200 cursor-pointer hover:bg-accent/5 active:scale-[0.98]"
      onClick={() => onProfileClick(friend)}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0">
          <AvatarImage src={friend.avatarUrl} alt={friend.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[15px] text-foreground leading-tight line-clamp-1">
                {friend.name}
              </p>
              <p className="text-[13px] text-muted-foreground line-clamp-1">@{friend.username}</p>
              {friend.bio && (
                <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{friend.bio}</p>
              )}
            </div>

            <Button
              variant={friend.isFollowing ? 'secondary' : 'default'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFollow(friend.id, friend.isFollowing);
              }}
              className="flex-shrink-0 h-8 text-xs px-3"
            >
              {friend.isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FriendsPanel() {
  const { data: followingData = [], isLoading: followingLoading } = useFollowingProfiles();
  const { data: suggestedData = [], isLoading: suggestionsLoading } = useSuggestedProfiles();
  const { follow, unfollow } = useSocialMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const showDemoFollowing = !followingLoading && followingData.length === 0;
  const showDemoSuggestions = !suggestionsLoading && suggestedData.length === 0;

  const following = useMemo(
    () => (showDemoFollowing ? DEMO_FOLLOWING : followingData.map((p) => toFriendProfile(p, true))),
    [showDemoFollowing, followingData],
  );

  const followingIds = useMemo(() => new Set(following.map((f) => f.id)), [following]);
  const suggestions = useMemo(
    () =>
      showDemoSuggestions
        ? DEMO_SUGGESTIONS.map((p) => ({ ...p, isFollowing: followingIds.has(p.id) }))
        : suggestedData.map((p) => toFriendProfile(p, followingIds.has(p.id))),
    [showDemoSuggestions, suggestedData, followingIds],
  );

  const demoProfileIds = useMemo(
    () => new Set([...following, ...suggestions].filter((p) => p.isDemo).map((p) => p.id)),
    [following, suggestions],
  );

  const filteredFollowing = useMemo(
    () =>
      following.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.username ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [following, searchQuery],
  );

  const handleToggleFollow = (id: string, isFollowing: boolean) => {
    if (demoProfileIds.has(id)) {
      toast.info('Demo example-interactions are disabled.');
      return;
    }
    if (isFollowing) {
      unfollow.mutate(id, {
        onError: () => toast.error('Failed to unfollow'),
      });
    } else {
      follow.mutate(id, {
        onError: () => toast.error('Failed to follow'),
      });
    }
  };

  const handleProfileClick = async (friend: FriendProfile) => {
    const fallback: UserProfile = {
      id: friend.id,
      name: friend.name,
      username: friend.username || friend.id.slice(0, 10),
      avatarUrl: friend.avatarUrl || '',
      bio: friend.bio || '',
      joinedAt: friend.joinedAt || new Date(),
      booksRead: 0,
      notesCount: 0,
      followers: 0,
      following: 0,
      isFollowing: friend.isFollowing,
      recentBooks: [],
      publicNotes: [],
    };
    setSelectedProfile(fallback);
    setProfileDialogOpen(true);

    if (friend.isDemo) {
      return;
    }

    try {
      const profile = await fetchProfileSummary(friend.id);
      setSelectedProfile({
        id: profile.id,
        name: profile.displayName || profile.username || fallback.name,
        username: profile.username || fallback.username,
        avatarUrl: profile.avatarUrl || '',
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

  const handleFollowFromDialog = (userId: string) => {
    if (demoProfileIds.has(userId)) {
      toast.info('Demo example-interactions are disabled.');
      return;
    }
    follow.mutate(userId, {
      onSuccess: () =>
        setSelectedProfile((prev) =>
          prev ? { ...prev, isFollowing: true, followers: prev.followers + 1 } : null,
        ),
      onError: () => toast.error('Failed to follow'),
    });
  };

  const handleUnfollowFromDialog = (userId: string) => {
    if (demoProfileIds.has(userId)) {
      toast.info('Demo example-interactions are disabled.');
      return;
    }
    unfollow.mutate(userId, {
      onSuccess: () =>
        setSelectedProfile((prev) =>
          prev ? { ...prev, isFollowing: false, followers: Math.max(0, prev.followers - 1) } : null,
        ),
      onError: () => toast.error('Failed to unfollow'),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search following..."
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="following" className="w-full">
        <TabsList className="w-full bg-secondary/50 mb-4">
          <TabsTrigger value="following" className="flex-1 gap-2">
            <Users className="w-4 h-4" />
            Following ({following.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex-1 gap-2">
            <UserPlus className="w-4 h-4" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-3">
          {showDemoFollowing && !followingLoading && (
            <p className="text-xs text-muted-foreground">Showing demo friends until you follow real people.</p>
          )}
          {followingLoading ? (
            <p className="text-sm text-muted-foreground">Loading your follows...</p>
          ) : filteredFollowing.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No follows yet</p>
              <p className="text-sm">Discover readers to follow in the Discover tab</p>
            </div>
          ) : (
            filteredFollowing.map((friend, index) => (
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
            People you might want to follow
          </p>
          {showDemoSuggestions && !suggestionsLoading && (
            <p className="text-xs text-muted-foreground -mt-2">
              Demo suggestions are shown until recommendations load.
            </p>
          )}
          {suggestionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading suggestions...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions right now.</p>
          ) : (
            suggestions.map((friend, index) => (
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
      </Tabs>

      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={selectedProfile}
        onFollow={handleFollowFromDialog}
        onUnfollow={handleUnfollowFromDialog}
      />
    </div>
  );
}

