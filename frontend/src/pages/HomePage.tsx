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
      <div className="container mx-auto px-4 py-16">
        {/* Heading is always visible */}
        <div className="md:grid md:grid-cols-2 md:gap-16 items-center">
          {/* Left Side - Heading and description */}
          <div className="space-y-6 mb-8 md:mb-0">
            <h1 className="text-5xl md:text-7xl font-bold text-white text-center md:text-left">Get Spotify Streaming Data</h1>
            <p className="text-lg md:text-xl text-white/60 max-w-md text-center md:text-left">
              Track daily stream counts for any album on Spotify
            </p>
          </div>

          {/* Right Side - Search section or Album details */}
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
      </div>
    </main>
  );
};

export default HomePage;