
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { signOut as authSignOut, signIn as authSignIn, signUp as authSignUp } from '@/services/authService';
import { getIntentRaw, clearIntentRaw } from '@/hooks/useAuthIntent';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<void>;
  updateProfile?: (data: any) => Promise<void>;
  uploadAvatar?: (file: File) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Safe version that returns defaults instead of throwing - for contexts that depend on AuthProvider
export const useAuthSafe = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { user: null, session: null, profile: null, loading: true, signOut: async () => {}, signIn: async () => {}, signUp: async () => {} } as AuthContextType;
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle password recovery redirect
        if (event === 'PASSWORD_RECOVERY') {
          window.location.href = '/reset-password';
          return;
        }
        
        // Fetch profile data when user signs in
        if (session?.user && event === 'SIGNED_IN') {
          // Check for saved auth intent (e.g. from Google OAuth redirect)
          const savedRedirect = localStorage.getItem('redirect_after_auth');
          if (savedRedirect) {
            const intent = getIntentRaw();
            if (intent) {
              clearIntentRaw();
              // Delay to let React render, then redirect
              setTimeout(() => {
                window.location.href = intent.path;
              }, 500);
            }
          }

          setTimeout(async () => {
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              setProfile(data);
            } catch (error) {
              console.log('Profile not found, will be created on first interaction');
            }
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      const { data, error } = await authSignIn(email, password, captchaToken);
      if (error) throw error;
      // State will be updated by onAuthStateChange
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string, captchaToken?: string) => {
    try {
      const { data, error } = await authSignUp(email, password, captchaToken);
      if (error) throw error;
      // State will be updated by onAuthStateChange
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut: handleSignOut,
    signIn: handleSignIn,
    signUp: handleSignUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
