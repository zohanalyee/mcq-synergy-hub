
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { trackSignUp } from "@/utils/analytics";

// Auth redirects always follow the origin the user is actually on (production
// domain in production, preview domain in Lovable previews). The only
// normalisation is www → apex so it matches Supabase's redirect allow-list.
export const getAuthOrigin = (): string => {
  const { origin, hostname, protocol } = window.location;
  if (hostname === "www.mcqsai.com") return `${protocol}//mcqsai.com`;
  return origin;
};



// Sign up with email and password
export const signUp = async (email: string, password: string, captchaToken?: string) => {
  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        captchaToken,
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    trackSignUp('email');
    return { data, error: null };
  } catch (error) {
    console.error('Failed to sign up:', error);
    return { data: null, error };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string, captchaToken?: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Failed to sign in:', error);
    return { data: null, error };
  }
};

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/analytics`,
      },
    });

    if (error) {
      console.error('Google sign in error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Failed to sign in with Google:', error);
    return { data: null, error };
  }
};

// Sign in with Facebook OAuth
export const signInWithFacebook = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/analytics`,
      },
    });

    if (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Failed to sign in with Facebook:', error);
    return { data: null, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Failed to sign out:', error);
    return { error };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Get current session
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get current session:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};
