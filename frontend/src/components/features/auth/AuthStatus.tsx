// components/features/auth/AuthStatus.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SpotifyLoginButton from './SpotifyLoginButton';
import UserProfile from './UserProfile';
import { Loader2 } from 'lucide-react';

interface AuthStatusProps {
  className?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ className = '' }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={`${className} flex items-center`}>
        <Loader2 className="h-5 w-5 text-white/60 animate-spin" />
      </div>
    );
  }

  return (
    <div className={className}>
      {user ? (
        <UserProfile />
      ) : (
        <SpotifyLoginButton size="sm" text="Login" />
      )}
    </div>
  );
};

export default AuthStatus;