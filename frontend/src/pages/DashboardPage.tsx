// pages/DashboardPage.tsx
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import UserLibrary from '@/components/features/profile/UserLibrary';
import ActivityTracker from '@/components/features/profile/ActivityTracker';
import CloutScoreComponent from '@/components/features/profile/CloutScore';
import TopCloutTracks from '@/components/features/profile/TopCloutTracks';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  
  // Calculate content height (viewport - header - footer)
  const contentHeight = 'calc(100vh - 5.5rem)';
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }
  
  if (!user) {
    // Redirect to home or show login prompt
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
        <div className="items-center h-full mb-8 md:mb-0 hidden md:flex">
          <div className="md:mt-0 md:mb-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-center md:text-left font-bold text-white mb-3">
              Dashboard
            </h1>
            <p className="text-sm text-center md:text-left md:text-lg text-white/60">
              Login to view your personalized dashboard
            </p>
          </div>
        </div>
        
        <div className="h-full flex items-center">
          <div className="w-full" style={{ maxHeight: contentHeight }}>
            <Card className="p-4 md:p-6 bg-black/40 border-white/10">
              <div className="text-center py-8">
                <h2 className="text-xl font-bold text-white mb-4">Please Login</h2>
                <p className="text-white/60 mb-6">
                  You need to login with Spotify to access your dashboard.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left column - User Library - Now 50% of the width */}
      <div className="lg:col-span-6 xl:col-span-6 h-full">
        <div className="flex flex-col h-full" style={{ maxHeight: contentHeight }}>
          <div className="flex-grow overflow-hidden">
            <UserLibrary userId={user.id} useExtendedView={true} />
          </div>
        </div>
      </div>
      
      {/* Right column - Streamclout Score, Top Clout Tracks, and Activity - Now 50% of the width */}
      <div className="lg:col-span-6 xl:col-span-6 space-y-6 overflow-auto" style={{ maxHeight: contentHeight }}>
        {/* Clout Score Component */}
        <CloutScoreComponent userId={user.id} />
        
        {/* Top Clout Tracks Component - NEW */}
        <TopCloutTracks userId={user.id} />
        
        {/* Activity Tracker */}
        <ActivityTracker userId={user.id} />
      </div>
    </div>
  );
};

export default DashboardPage;