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
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Edit2, 
  Save, 
  X, 
  TrendingUp,
  Award,
  Target,
  Flame,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { getBooks, getNotes, getReadingGoals, saveReadingGoals, calculateStreak, getBooksReadThisYear, getActivityDates } from '@/lib/store';
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
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(12);
  const [stats, setStats] = useState({
    booksRead: 0,
    totalNotes: 0,
    quotes: 0,
    ideas: 0,
    questions: 0,
    actions: 0,
  });
  const [goals, setGoals] = useState({ yearlyBookTarget: 12, year: new Date().getFullYear() });
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [booksThisYear, setBooksThisYear] = useState(0);
  const [activityDays, setActivityDays] = useState(0);

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

    // Load goals and streak
    const savedGoals = getReadingGoals();
    setGoals(savedGoals);
    setGoalInput(savedGoals.yearlyBookTarget);
    setStreak(calculateStreak());
    setBooksThisYear(getBooksReadThisYear());
    setActivityDays(getActivityDates().length);
  }, []);

  const handleSaveGoal = () => {
    const newGoals = { yearlyBookTarget: goalInput, year: new Date().getFullYear() };
    saveReadingGoals(newGoals);
    setGoals(newGoals);
    setIsEditingGoal(false);
    toast.success('Reading goal updated!');
  };

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
          className="mb-6 -ml-2 gap-2 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Button>

        {/* Profile Header */}
        <Card className="relative overflow-hidden p-8 mb-8 animate-fade-in">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar with decorative ring */}
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-sm" />
              <Avatar className="relative h-28 w-28 ring-4 ring-card shadow-elevated">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/30 text-foreground text-3xl font-display font-bold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-4 animate-fade-in">
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
                  <div className="flex gap-3">
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
                    <h1 className="font-display text-3xl font-bold text-foreground">{profile.name}</h1>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsEditing(true)}
                      className="h-9 w-9 rounded-full hover:bg-secondary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-lg mb-3">@{profile.username}</p>
                  <p className="text-foreground/80 max-w-md leading-relaxed">{profile.bio}</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Joined {profile.joinedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Reading Goals & Streak Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Yearly Reading Goal */}
          <Card className="relative overflow-hidden p-6 hover:shadow-card transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground">{new Date().getFullYear()} Goal</h3>
              </div>
              {!isEditingGoal && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsEditingGoal(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {isEditingGoal ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={goalInput}
                    onChange={(e) => setGoalInput(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">books this year</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveGoal}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsEditingGoal(false); setGoalInput(goals.yearlyBookTarget); }}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold text-foreground">{booksThisYear}</span>
                  <span className="text-muted-foreground text-lg">/ {goals.yearlyBookTarget} books</span>
                </div>
                <Progress 
                  value={Math.min((booksThisYear / goals.yearlyBookTarget) * 100, 100)} 
                  className="h-3 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {booksThisYear >= goals.yearlyBookTarget 
                    ? '🎉 Goal reached! Amazing work!' 
                    : `${goals.yearlyBookTarget - booksThisYear} more to go`
                  }
                </p>
              </>
            )}
          </Card>

          {/* Reading Streak */}
          <Card className="relative overflow-hidden p-6 hover:shadow-card transition-shadow">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400/50 via-orange-500 to-orange-400/50" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground">Reading Streak</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold text-foreground">{streak.current}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Current streak</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-2xl font-bold text-foreground">{streak.longest}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Longest streak</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                {streak.current > 0 
                  ? `🔥 Keep it up! You're on fire!`
                  : 'Add a book or note today to start your streak!'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {activityDays} total active days
              </p>
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen, label: 'Books', value: stats.booksRead, color: 'text-primary', bg: 'bg-primary/10' },
            { icon: FileText, label: 'Total Notes', value: stats.totalNotes, color: 'text-primary', bg: 'bg-primary/10' },
            { icon: TrendingUp, label: 'Ideas', value: stats.ideas, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: Award, label: 'Quotes', value: stats.quotes, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((stat, index) => (
            <Card 
              key={stat.label} 
              className="p-5 text-center hover:shadow-card transition-all hover:-translate-y-0.5 animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Tabs for more content */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="w-full md:w-auto bg-secondary/70 p-1.5 rounded-xl">
            <TabsTrigger value="breakdown" className="flex-1 md:flex-none rounded-lg data-[state=active]:shadow-card data-[state=active]:bg-card">
              Notes Breakdown
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1 md:flex-none rounded-lg data-[state=active]:shadow-card data-[state=active]:bg-card">
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="mt-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-6">Notes by Type</h3>
              <div className="space-y-5">
                {[
                  { type: 'Quotes', count: stats.quotes, color: 'bg-amber-500', icon: '💬' },
                  { type: 'Ideas', count: stats.ideas, color: 'bg-sky-500', icon: '💡' },
                  { type: 'Questions', count: stats.questions, color: 'bg-violet-500', icon: '❓' },
                  { type: 'Actions', count: stats.actions, color: 'bg-emerald-500', icon: '✅' },
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-4">
                    <span className="text-2xl w-8 text-center">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{item.type}</span>
                        <span className="text-sm font-semibold text-foreground">{item.count}</span>
                      </div>
                      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${stats.totalNotes ? (item.count / stats.totalNotes) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6 animate-fade-in">
            <Card className="p-6">
              <h3 className="font-display font-semibold text-lg text-foreground mb-6">Your Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: 'First Book', desc: 'Added your first book', unlocked: stats.booksRead >= 1, icon: '📚' },
                  { name: 'Note Taker', desc: 'Captured 10 notes', unlocked: stats.totalNotes >= 10, icon: '📝' },
                  { name: 'Bookworm', desc: 'Read 5 books', unlocked: stats.booksRead >= 5, icon: '🐛' },
                  { name: 'Quote Collector', desc: 'Saved 10 quotes', unlocked: stats.quotes >= 10, icon: '💬' },
                  { name: 'Idea Machine', desc: 'Captured 20 ideas', unlocked: stats.ideas >= 20, icon: '💡' },
                  { name: 'Scholar', desc: 'Read 10 books', unlocked: stats.booksRead >= 10, icon: '🎓' },
                  { name: 'On Fire', desc: '7-day reading streak', unlocked: streak.longest >= 7, icon: '🔥' },
                  { name: 'Dedicated', desc: '30-day reading streak', unlocked: streak.longest >= 30, icon: '💪' },
                  { name: 'Goal Getter', desc: 'Reach yearly goal', unlocked: booksThisYear >= goals.yearlyBookTarget, icon: '🏆' },
                ].map((achievement, index) => (
                  <div 
                    key={achievement.name}
                    className={`relative p-5 rounded-xl border text-center transition-all duration-300 hover:-translate-y-0.5 animate-fade-up ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-soft' 
                        : 'bg-muted/20 border-border/50 opacity-60'
                    }`}
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <p className="font-semibold text-foreground mt-3">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.desc}</p>
                    {achievement.unlocked && (
                      <Badge className="mt-3 bg-primary/20 text-primary border-0 text-xs">
                        ✓ Unlocked
                      </Badge>
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
