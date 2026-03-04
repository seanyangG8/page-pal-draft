import { supabase } from './supabaseClient';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    // Prevent an indefinite loading state when auth/session bootstrap hangs.
    const loadingTimeout = window.setTimeout(() => {
      if (isActive) {
        console.error('Auth initialization timed out. Continuing as signed out.');
        setLoading(false);
      }
    }, 8000);

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isActive) return;
        if (error) {
          console.error('Failed to read auth session:', error);
        } else {
          setSession(data.session);
        }
      } catch (error) {
        if (!isActive) return;
        console.error('Auth initialization failed:', error);
      } finally {
        if (!isActive) return;
        window.clearTimeout(loadingTimeout);
        setLoading(false);
      }
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!isActive) return;
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      isActive = false;
      window.clearTimeout(loadingTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
