// pages/AuthCallback.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false); // Flag to prevent duplicate processing

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent duplicate calls
      if (processingRef.current) {
        console.log('Auth callback already processing, skipping duplicate execution');
        return;
      }

      processingRef.current = true;
      console.log('Auth callback started');

      try {
        // Get the session after OAuth redirect
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          throw error;
        }

        console.log('Session retrieved:', session ? 'Session exists' : 'No session');

        if (session) {
          // Save tokens to the database
          const userId = session.user.id;
          console.log('User ID:', userId);

          const accessToken = session.provider_token;
          console.log('Access token exists:', !!accessToken);
          console.log('Access token length:', accessToken ? accessToken.length : 0);

          const refreshToken = session.provider_refresh_token;
          console.log('Refresh token exists:', !!refreshToken);
          console.log('Refresh token length:', refreshToken ? refreshToken.length : 0);

          // Fix: Convert expires_at properly
          // If expires_at is in seconds (as epoch), convert to milliseconds and create date
          const expiresAtTimestamp = session.expires_at
            ? session.expires_at * 1000 // Convert seconds to milliseconds
            : Date.now() + 3600 * 1000; // Default to 1 hour from now if missing

          const expiresAt = new Date(expiresAtTimestamp);
          console.log('Expires at:', expiresAt.toISOString(), 'Original timestamp:', session.expires_at);

          // Ensure we have both tokens before proceeding
          if (!accessToken || !refreshToken) {
            console.error('Missing required tokens:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken
            });
            throw new Error('Authentication incomplete: Missing required tokens');
          }
        }

        console.log('Auth callback completed, redirecting...');
        // Redirect to homepage after successful authentication
        navigate('/', { replace: true });
      } catch (err: any) {
        console.error('Error during auth callback:', err);
        setError(err.message || 'An error occurred during authentication');
      } finally {
        // Release the processing flag after a delay to prevent any race conditions
        setTimeout(() => {
          processingRef.current = false;
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-black/40 border-white/10 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-6 bg-black/40 border-white/10 rounded-xl">
        <h2 className="text-2xl font-bold text-white mb-4">Finalizing Authentication</h2>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
        <p className="text-white/60 mt-4">Please wait while we complete the Spotify authentication...</p>
      </div>
    </div>
  );
}

export default AuthCallback;