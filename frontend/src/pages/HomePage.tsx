// HomePage.tsx
import { useState } from 'react';
import SearchSection from '@/components/features/search/SearchSection';
import AlbumDetail from '@/components/features/album/AlbumDetail';
import useAlbumData from '@/hooks/useAlbumData';
import { SearchResult } from '@/types/search';

const HomePage = () => {
  const [showSearch, setShowSearch] = useState(true);
  const { 
    selectedAlbum, 
    tracks, 
    totalStreams, 
    loading, 
    error, 
    fetchAlbumData, 
    clearAlbumData 
  } = useAlbumData();

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
      <div className="flex items-center h-full">
        <div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3">
            Get Spotify Streaming Data
          </h1>
          <p className="text-lg text-white/60">
            Track daily stream counts for any album on Spotify
          </p>
        </div>
      </div>
      
      {/* Right column - search or album details */}
      <div className="h-full flex items-center">
        <div className="w-full" style={{ maxHeight: contentHeight }}>
          {showSearch ? (
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;