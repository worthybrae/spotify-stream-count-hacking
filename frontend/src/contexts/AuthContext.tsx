// lib/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUserProfile, signInWithSpotify, signOut, refreshSession } from '../lib/supabase';
import { Session as AuthSession } from '@supabase/supabase-js';


// Define the shape of our auth context
type AuthContextType = {
  session: AuthSession | null;
  user: any | null;
  spotifyToken: string | null;
  spotifyRefreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
};

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  spotifyToken: null,
  spotifyRefreshToken: null,
  isLoading: true,
  error: null,
  signIn: async () => {},
  logOut: async () => {},
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for existing session
        const profile = await getUserProfile();
        
        if (profile) {
          const { data } = await supabase.auth.getSession();
          setSession(data.session);
          setUser(profile.user);
          setSpotifyToken(profile.spotifyToken ?? null);
          setSpotifyRefreshToken(profile.spotifyRefreshToken ?? null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to initialize authentication.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
        
        if (currentSession) {
          setUser(currentSession.user);
          // Type assertion here since provider_token might not be on the Session type
          const providerToken = (currentSession as any).provider_token;
          const providerRefreshToken = (currentSession as any).provider_refresh_token;
          setSpotifyToken(providerToken === undefined ? null : providerToken);
          setSpotifyRefreshToken(providerRefreshToken === undefined ? null : providerRefreshToken);
        } else {
          setUser(null);
          setSpotifyToken(null);
          setSpotifyRefreshToken(null);
        }
        
        setIsLoading(false);
      }
    );

    // Set up token refresh
    let refreshTimer: number | undefined = undefined;
    
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000).getTime();
      const timeUntilExpiry = expiresAt - Date.now();
      
      // Refresh 5 minutes before expiry
      const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);
      
      if (refreshTime < 2147483647) { // Max safe setTimeout value
        refreshTimer = window.setTimeout(async () => {
          const refreshedSession = await refreshSession();
          if (refreshedSession) {
            setSession(refreshedSession);
            // Type assertion here for provider tokens
            const providerToken = (refreshedSession as any).provider_token;
            const providerRefreshToken = (refreshedSession as any).provider_refresh_token;
            setSpotifyToken(providerToken === undefined ? null : providerToken);
            setSpotifyRefreshToken(providerRefreshToken === undefined ? null : providerRefreshToken);
          }
        }, refreshTime);
      }
    }

    // Cleanup
    return () => {
      subscription?.unsubscribe();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  // Handle sign in
  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithSpotify();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in with Spotify.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign out
  const logOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setSession(null);
      setUser(null);
      setSpotifyToken(null);
      setSpotifyRefreshToken(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    session,
    user,
    spotifyToken,
    spotifyRefreshToken,
    isLoading,
    error,
    signIn,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};