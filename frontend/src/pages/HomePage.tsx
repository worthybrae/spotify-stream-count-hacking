import { useState } from 'react';
import SearchSection from '@/components/features/search/SearchSection';
import AlbumDetail from '@/components/features/album/AlbumDetail';
import useAlbumData from '@/hooks/useAlbumData';

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

  const handleAlbumSelect = async (album: any) => {
    fetchAlbumData(album);
    setShowSearch(false);
  };

  const handleBackToSearch = () => {
    clearAlbumData();
    setShowSearch(true);
  };

  return (
    <main className="min-h-screen flex items-center pt-14 pb-20">
      <div className="container mx-auto px-4 md:grid md:grid-cols-2 md:gap-16 items-center py-16">
        {/* Left Side - Hide on mobile when showing album details */}
        <div className={`space-y-6 mb-8 ${!showSearch && 'hidden md:block'}`}>
          <h1 className="text-5xl md:text-7xl font-bold text-white text-center md:text-left">Get Spotify Streaming Data</h1>
          <p className="text-lg md:text-xl text-white/60 max-w-md text-center md:text-left ">
            Track daily stream counts for any album on Spotify
          </p>
        </div>

        {/* Right Side - Full width on mobile */}
        <div className="space-y-6 w-full mt-2 mb-16">
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
    </main>
  );
};

export default HomePage;