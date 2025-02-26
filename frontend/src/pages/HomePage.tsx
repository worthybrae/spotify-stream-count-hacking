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
    <main className="container mx-auto px-4 min-h-screen flex items-center pt-14">
      <div className="w-full grid lg:grid-cols-2 gap-16 items-center py-16">
        {/* Left Side */}
        <div className="space-y-6">
          <h1 className="text-7xl font-bold text-white">Get Spotify Streaming Data</h1>
          <p className="text-xl text-white/60 max-w-md">
            Track daily stream counts for any album on Spotify. Enter the album name to get started.
          </p>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
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