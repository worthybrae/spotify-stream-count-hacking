// components/features/auth/UserProfile.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfileProps {
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, logOut, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logOut();
    setIsMenuOpen(false);
  };

  // If no user or still loading, return null
  if (!user) return null;

  const userEmail = user.email || 'Spotify User';
  const userName = user.user_metadata?.full_name || userEmail;
  const userImage = user.user_metadata?.avatar_url;

  return (
    <div className={`${className} flex items-center`}>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white py-1 px-2 rounded-lg"
          >
            {userImage ? (
              <img src={userImage} alt={userName} className="w-6 h-6 rounded-full" />
            ) : (
              <User className="h-5 w-5 text-white/80" />
            )}
            <span className="hidden md:inline max-w-[100px] truncate">{userName}</span>
            <ChevronDown className="h-4 w-4 text-white/60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[200px] bg-black/90 border-white/10 text-white">
          <DropdownMenuLabel className="flex flex-col">
            <span className="font-medium truncate">{userName}</span>
            <span className="text-xs text-white/60 truncate">{userEmail}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            className="text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-2"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;