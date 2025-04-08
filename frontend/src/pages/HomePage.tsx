// HomePage.tsx
import SearchSection from '@/components/features/search/SearchSection';
import AlbumDetail from '@/components/features/album/AlbumDetail';
import useAlbumData from '@/hooks/useAlbumData';
import { SearchResult } from '@/types/search';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Sparkles, Music, LockIcon } from 'lucide-react';

const HomePage = () => {
  // No need for showSearch state anymore as search is always visible
  const { 
    selectedAlbum, 
    tracks, 
    totalStreams, 
    loading, 
    error, 
    fetchAlbumData, 
    clearAlbumData,
    albumDetails 
  } = useAlbumData();
  
  const { user, signIn, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleAlbumSelect = async (album: SearchResult) => {
    fetchAlbumData(album);
    
    const event = new CustomEvent('albumSelected', { 
      detail: { album }
    });
    window.dispatchEvent(event);
  };

  const handleBackToSearch = () => {
    clearAlbumData();
    
    const event = new CustomEvent('albumSelected', { 
      detail: { album: null }
    });
    window.dispatchEvent(event);
  };

  // Removed handleStartSearching as search is always visible

  const handleLoginClick = async () => {
    await signIn();
    // The redirect to /auth/callback will happen automatically
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  // Calculate content height (viewport - header - footer)
  const contentHeight = 'calc(100vh - 5.5rem)';

  if (selectedAlbum) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
        <div className="items-center h-full mb-8 md:mb-0 hidden md:flex">
          <div className="md:mt-0 md:mb-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl text-center md:text-left font-bold text-white mb-3">
              Album Details
            </h1>
            <p className="text-sm text-center md:text-left md:text-lg text-white/60">
              Track daily stream counts for this album
            </p>
          </div>
        </div>
        
        <div className="h-full flex items-center">
          <div className="w-full" style={{ maxHeight: contentHeight }}>
            <AlbumDetail
              selectedAlbum={selectedAlbum}
              tracks={tracks}
              totalStreams={totalStreams}
              loading={loading}
              error={error}
              onBackToSearch={handleBackToSearch}
              albumDetails={albumDetails}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
      {/* Left column - centered content */}
      <div className="items-center h-full mb-8 md:mb-0 flex flex-col justify-center">
        <div className="mt-8 mb-4 md:mt-0 md:mb-0 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Unlock Spotify's<br />Stream Data
          </h1>
          <p className="text-sm md:text-lg text-white/70 mb-8 max-w-md">
            Get real-time access to Spotify streaming analytics, daily stream counts, and revenue tracking.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                          {user ? (
                <Button 
                  onClick={handleDashboardClick}
                  className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              ) : (
                <Button 
                  onClick={handleLoginClick}
                  disabled={isLoading}
                  className="h-12 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    <>
                      <Music className="mr-2 h-5 w-5" />
                      Login with Spotify
                    </>
                  )}
                </Button>
              )}
          </div>
        </div>
      </div>
      
      {/* Right column - search bar and features */}
      <div className="h-full flex items-center">
        <div className="w-full" style={{ maxHeight: contentHeight }}>
          <Card className="p-6 bg-black/40 border-white/10 overflow-hidden">
            {/* Search bar at the top */}
            <div className="mb-6">
              <SearchSection 
                onAlbumSelect={handleAlbumSelect}
                selectedAlbum={selectedAlbum}
              />
            </div>
            
            {/* Features section */}
            <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
            <div className="grid grid-cols-1 gap-4">
              <Feature 
                icon={<Sparkles className="h-5 w-5 text-purple-400" />}
                title="Clout Score"
                description="Get your personalized streaming influence score based on your listening habits."
                locked={!user}
              />
              <Feature 
                icon={<Music className="h-5 w-5 text-pink-400" />}
                title="Personal Library"
                description="Track your favorite artists and albums in one dashboard."
                locked={!user}
              />
              <Feature 
                icon={<LockIcon className="h-5 w-5 text-green-400" />}
                title="Revenue Analytics"
                description="Estimate artist earnings and track revenue metrics."
                locked={!user}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, title, description, locked }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  locked: boolean;
}) => {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg ${
      locked ? 'bg-white/5' : 'bg-gradient-to-r from-green-500/20 to-blue-500/20'
    }`}>
      <div className={`p-2 rounded-lg ${
        locked ? 'bg-white/10' : 'bg-white/20'
      }`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-white">{title}</h3>
          {locked && (
            <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">
              Login Required
            </span>
          )}
        </div>
        <p className="text-sm text-white/60 mt-1">{description}</p>
      </div>
    </div>
  );
};

export default HomePage;