// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { type Session } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types for auth
export type AuthSession = Session | null;

// Helper function to get user profile after authentication
export const getUserProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  // The Spotify token and user info will be in the session
  return {
    user: session.user,
    spotifyToken: session.provider_token, // Access token from Spotify
    spotifyRefreshToken: session.provider_refresh_token, // Refresh token from Spotify
    expiresAt: new Date(session.expires_at || 0).getTime()
  };
};

// Helper function to refresh tokens when needed
export const refreshSession = async () => {
    try {
      console.log('Attempting to refresh session');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
      
      const session = data.session;
      
      return session;
    } catch (refreshError) {
      console.error('Unexpected error during session refresh:', refreshError);
      return null;
    }
  };

// Sign in with Spotify
export const signInWithSpotify = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'spotify',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'user-read-email user-top-read user-read-recently-played' // Add any additional scopes you need
    }
  });
  
  if (error) {
    console.error('Error signing in with Spotify:', error);
    return null;
  }
  
  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  
  return true;
};