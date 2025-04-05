// HomePage.tsx
import { useState } from 'react';
import SearchSection from '@/components/features/search/SearchSection';
import AlbumDetail from '@/components/features/album/AlbumDetail';
import UserTopTracks from '@/components/features/profile/UserTopTracks';
import ViewSwitcher from '@/components/features/profile/ViewSwitcher';
import useAlbumData from '@/hooks/useAlbumData';
import { SearchResult } from '@/types/search';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const [showSearch, setShowSearch] = useState(true);
  const [activeView, setActiveView] = useState<'user' | 'search'>('user');
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
  
  const { user } = useAuth();
  
  const isLoggedIn = Boolean(user?.id);

  const handleAlbumSelect = async (album: SearchResult) => {
    fetchAlbumData(album);
    setShowSearch(false);
    
    const event = new CustomEvent('albumSelected', { 
      detail: { album }
    });
    window.dispatchEvent(event);
  };

  const handleBackToSearch = () => {
    clearAlbumData();
    setShowSearch(true);
    
    // If user is logged in, set the active view back to the user stats view
    if (isLoggedIn) {
      setActiveView('user');
    }
    
    const event = new CustomEvent('albumSelected', { 
      detail: { album: null }
    });
    window.dispatchEvent(event);
  };

  // Calculate content height (viewport - header - footer)
  const contentHeight = 'calc(100vh - 5.5rem)';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
      {/* Left column - centered content */}
      <div className="items-center h-full mb-8 md:mb-0 hidden md:flex">
        <div className='mt-8 mb-4 md:mt-0 md:mb-0'>
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-center md:text-left font-bold text-white mb-3">
            {isLoggedIn ? 'Your Listening Stats' : 'Get Spotify Streaming Data'}
          </h1>
          <p className="text-sm text-center md:text-left md:text-lg text-white/60 ">
            {isLoggedIn 
              ? 'Track your top songs and daily listening habits' 
              : 'Track daily stream counts for any album on Spotify'}
          </p>
        </div>
      </div>
      
      {/* Right column - search or album details or user tracking */}
      <div className="h-full flex items-center">
        <div className="w-full" style={{ maxHeight: contentHeight }}>
          {isLoggedIn && showSearch && !selectedAlbum ? (
            <>
              <ViewSwitcher 
                activeView={activeView}
                onViewChange={(view) => setActiveView(view)}
              />
              {activeView === 'user' ? (
                <UserTopTracks />
              ) : (
                <SearchSection 
                  onAlbumSelect={handleAlbumSelect}
                  selectedAlbum={selectedAlbum}
                />
              )}
            </>
          ) : showSearch ? (
            <SearchSection 
              onAlbumSelect={handleAlbumSelect}
              selectedAlbum={selectedAlbum}
            />
          ) : (
            <AlbumDetail
              selectedAlbum={selectedAlbum}
              tracks={tracks}
              totalStreams={totalStreams}
              loading={loading}
              error={error}
              onBackToSearch={handleBackToSearch}
              albumDetails={albumDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;