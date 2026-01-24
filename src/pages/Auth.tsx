import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookMarked, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'reset' | 'recovery';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from?.pathname || '/';
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  // Detect recovery link from Supabase (type=recovery) or mode=recovery in query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const modeParam = params.get('mode');
    if (type === 'recovery' || modeParam === 'recovery') {
      setMode('recovery');
      setInfo('Enter a new password to complete your reset.');
    }
  }, [location.search]);

  const showEmail = useMemo(() => mode !== 'recovery' ? true : false, [mode]);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in');
        navigate(redirectTo, { replace: true });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        toast.success('Account created. Check your email to verify before signing in.');
        setInfo('Check your email for a verification link. After verifying, sign in.');
        setMode('signin');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=recovery`,
        });
        if (error) throw error;
        toast.success('Reset link sent. Check your email.');
        setInfo('Reset link sent. Open it from this device to set a new password.');
        setMode('signin');
      } else if (mode === 'recovery') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success('Password updated. You are signed in.');
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => {
      if (m === 'signin') return 'signup';
      if (m === 'signup') return 'signin';
      return 'signin';
    });
    setInfo(null);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <BookMarked className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground text-center">
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
            {mode === 'recovery' && 'Set a new password'}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {mode === 'signin' && 'Sign in to continue to your library.'}
            {mode === 'signup' && 'Sign up to start capturing your reading notes.'}
            {mode === 'reset' && 'We will email you a reset link.'}
            {mode === 'recovery' && 'Enter a new password to complete your reset.'}
          </p>
          {info && <p className="text-xs text-primary text-center">{info}</p>}
        </div>

        <Card className="p-6 shadow-lg bg-card/90">
          <div className="space-y-4">
            {mode !== 'recovery' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="text-base"
                  autoComplete="email"
                />
              </div>
            )}
            {(mode === 'signin' || mode === 'signup' || mode === 'recovery') && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="text-base"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>
            )}
            <Button
              className="w-full h-11 text-base"
              onClick={handleAuth}
              disabled={
                isLoading ||
                ((mode === 'signin' || mode === 'signup') && (!email || !password)) ||
                (mode === 'reset' && !email) ||
                (mode === 'recovery' && !password)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'signin' && 'Signing in...'}
                  {mode === 'signup' && 'Creating account...'}
                  {mode === 'reset' && 'Sending reset...'}
                  {mode === 'recovery' && 'Updating password...'}
                </>
              ) : (
                <>
                  {mode === 'signin' && 'Sign in'}
                  {mode === 'signup' && 'Sign up'}
                  {mode === 'reset' && 'Send reset link'}
                  {mode === 'recovery' && 'Set new password'}
                </>
              )}
            </Button>
            {mode === 'signin' && (
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full h-10" onClick={switchMode}>
                  {"Don't have an account? Sign up"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-10 text-primary"
                  onClick={() => {
                    setMode('reset');
                    setInfo(null);
                  }}
                >
                  Forgot password?
                </Button>
              </div>
            )}
            {(mode === 'signup' || mode === 'reset' || mode === 'recovery') && (
              <Button variant="ghost" className="w-full h-10" onClick={() => { setMode('signin'); setInfo(null); }}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
