import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import * as api from '../utils/api';

const supabase = getSupabaseClient();

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  supabase: typeof supabase;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && session.access_token) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
        });
        setAccessToken(session.access_token);
      } else if (!session) {
        setUser(null);
        setAccessToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user && session.access_token) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
        });
        setAccessToken(session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    if (data.session?.user && data.session.access_token) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email || '',
        name: data.session.user.user_metadata?.name,
      });
      setAccessToken(data.session.access_token);
    } else {
      throw new Error('Ingen session returnert');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    await api.signup(email, password, name);
    await signIn(email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
