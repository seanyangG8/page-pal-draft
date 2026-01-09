import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Users, 
  Edit2, 
  Save, 
  X, 
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { getBooks, getNotes } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

interface UserProfileData {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  joinedAt: Date;
}

const STORAGE_KEY = 'marginalia-user-profile';

const defaultProfile: UserProfileData = {
  name: 'Reader',
  username: 'reader',
  bio: 'Book lover and lifelong learner.',
  avatarUrl: '',
  joinedAt: new Date(),
};

export default function MyProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfileData>(defaultProfile);
  const [stats, setStats] = useState({
    booksRead: 0,
    totalNotes: 0,
    quotes: 0,
    ideas: 0,
    questions: 0,
    actions: 0,
  });

  useEffect(() => {
    // Load profile from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile({ ...parsed, joinedAt: new Date(parsed.joinedAt) });
      setEditForm({ ...parsed, joinedAt: new Date(parsed.joinedAt) });
    }

    // Calculate stats
    const books = getBooks();
    const notes = getNotes();
    setStats({
      booksRead: books.length,
      totalNotes: notes.length,
      quotes: notes.filter(n => n.type === 'quote').length,
      ideas: notes.filter(n => n.type === 'idea').length,
      questions: notes.filter(n => n.type === 'question').length,
      actions: notes.filter(n => n.type === 'action').length,
    });
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(editForm));
    setProfile(editForm);
    setIsEditing(false);
    toast.success('Profile updated!');
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-4xl py-8 px-4">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          ← Back to Library
        </Button>

        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-2xl font-semibold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        placeholder="username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Avatar URL (optional)</Label>
                    <Input
                      id="avatar"
                      value={editForm.avatarUrl}
                      onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="font-display text-2xl font-bold text-foreground">{profile.name}</h1>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsEditing(true)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-2">@{profile.username}</p>
                  <p className="text-foreground/80 max-w-md">{profile.bio}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Joined {profile.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.booksRead}</p>
            <p className="text-xs text-muted-foreground">Books</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalNotes}</p>
            <p className="text-xs text-muted-foreground">Total Notes</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.ideas}</p>
            <p className="text-xs text-muted-foreground">Ideas</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.quotes}</p>
            <p className="text-xs text-muted-foreground">Quotes</p>
          </Card>
        </div>

        {/* Tabs for more content */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="breakdown" className="flex-1 md:flex-none">Notes Breakdown</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1 md:flex-none">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="mt-4">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Notes by Type</h3>
              <div className="space-y-4">
                {[
                  { type: 'Quotes', count: stats.quotes, className: 'note-badge-quote', icon: '💬' },
                  { type: 'Ideas', count: stats.ideas, className: 'note-badge-idea', icon: '💡' },
                  { type: 'Questions', count: stats.questions, className: 'note-badge-question', icon: '❓' },
                  { type: 'Actions', count: stats.actions, className: 'note-badge-action', icon: '✅' },
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{item.type}</span>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.className} rounded-full transition-all duration-500`}
                          style={{ width: `${stats.totalNotes ? (item.count / stats.totalNotes) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Your Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'First Book', desc: 'Added your first book', unlocked: stats.booksRead >= 1, icon: '📚' },
                  { name: 'Note Taker', desc: 'Captured 10 notes', unlocked: stats.totalNotes >= 10, icon: '📝' },
                  { name: 'Bookworm', desc: 'Read 5 books', unlocked: stats.booksRead >= 5, icon: '🐛' },
                  { name: 'Quote Collector', desc: 'Saved 10 quotes', unlocked: stats.quotes >= 10, icon: '💬' },
                  { name: 'Idea Machine', desc: 'Captured 20 ideas', unlocked: stats.ideas >= 20, icon: '💡' },
                  { name: 'Scholar', desc: 'Read 10 books', unlocked: stats.booksRead >= 10, icon: '🎓' },
                ].map(achievement => (
                  <div 
                    key={achievement.name}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      achievement.unlocked 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-muted/30 border-border/50 opacity-50'
                    }`}
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <p className="font-medium text-sm text-foreground mt-2">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.desc}</p>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="mt-2 text-xs">Unlocked!</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
