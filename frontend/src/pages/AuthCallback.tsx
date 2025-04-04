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
          
          const refreshToken = session.provider_refresh_token;
          console.log('Refresh token exists:', !!refreshToken);
          
          // Fix: Convert expires_at properly
          // If expires_at is in seconds (as epoch), convert to milliseconds and create date
          const expiresAt = session.expires_at 
            ? new Date(session.expires_at * 1000) // Convert seconds to milliseconds
            : new Date(Date.now() + 3600 * 1000); // Default to 1 hour from now if missing
            
          console.log('Expires at:', expiresAt.toISOString());
          
          // Ensure we have both tokens before proceeding
          if (!accessToken || !refreshToken) {
            console.error('Missing required tokens:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken
            });
            throw new Error('Authentication incomplete: Missing required tokens');
          }
          
          try {
            // Simply insert a new token record without checking for existing ones
            console.log('Inserting token...');
            const insertData = {
              user_id: userId,
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt,
              created_at: new Date()
            };
            
            const { error: insertError } = await supabase
              .from('tokens')
              .insert(insertData);
              
            if (insertError) {
              console.error('Insert error:', insertError);
              console.error('Insert error code:', insertError.code);
              console.error('Insert error message:', insertError.message);
              console.error('Insert error details:', insertError.details);
            } else {
              console.log('Token inserted successfully');
            }
          } catch (saveError) {
            console.error('Error saving token to database:', saveError);
            // Continue anyway since authentication still succeeded
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