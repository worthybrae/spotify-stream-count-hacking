// HomePage.tsx
import SearchSection from '@/components/features/search/SearchSection';
import '@/styles/scrollbar.css'; // Import scrollbar hiding CSS
import EnhancedAlbumDetail from '@/components/features/album/UpdatedAlbumDetail';
import useAlbumData from '@/hooks/useAlbumData';
import { SearchResult } from '@/types/search';
import { Card } from '@/components/ui/card';
import { getTopTracks } from '@/lib/api/searchApi';
import { useEffect, useState } from 'react';
import { GroupedTrack } from '@/types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';
import { formatNumber } from '@/lib/utils/formatters';
import { Play, TrendingUp } from 'lucide-react';

const HomePage = () => {
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

  // Calculate content height (viewport - header - footer)
  const contentHeight = 'calc(100vh - 5.5rem)';

  // Trending songs state
  const [groupedTrendingTracks, setGroupedTrendingTracks] = useState<GroupedTrack[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Helper to calculate 7d growth for a track
  const getWeeklyGrowth = (track: GroupedTrack) => {
    const streamHistory = track.streamHistory || [];
    if (streamHistory.length >= 2) {
      const first = streamHistory[0].streams;
      const last = streamHistory[streamHistory.length - 1].streams;
      if (first > 0) {
        return ((last - first) / first) * 100;
      }
    }
    return 0;
  };

  // Sort trending tracks by 7d growth descending
  const sortedTrendingTracks = [...groupedTrendingTracks].sort((a, b) => getWeeklyGrowth(b) - getWeeklyGrowth(a));

  useEffect(() => {
    setTrendingLoading(true);
    setTrendingError(null);
    getTopTracks()
      .then((tracks) => {
        console.log('Fetched trending tracks:', tracks);
        setGroupedTrendingTracks(processTrackData(tracks));
        setTrendingLoading(false);
      })
      .catch(() => {
        setTrendingError('Failed to load trending songs.');
        setTrendingLoading(false);
      });
  }, []);

  const trendingTracksSection = (
    <div className="flex flex-col gap-4">
      {trendingLoading && (
        <div className="text-white/70 text-center py-8">Loading trending songs...</div>
      )}
      {trendingError && (
        <div className="text-red-400 text-center py-8">{trendingError}</div>
      )}
      {!trendingLoading && !trendingError && groupedTrendingTracks.length === 0 && (
        <div className="text-white/70 text-center py-8">No trending songs found.</div>
      )}
      {!trendingLoading && !trendingError && sortedTrendingTracks.slice(0, 5).map((track) => {
        // Calculate 7-day growth
        const streamHistory = track.streamHistory || [];
        let weeklyGrowth = 0;
        if (streamHistory.length >= 2) {
          const first = streamHistory[0].streams;
          const last = streamHistory[streamHistory.length - 1].streams;
          if (first > 0) {
            weeklyGrowth = ((last - first) / first) * 100;
          } else {
            weeklyGrowth = 0;
          }
        }

        // Abbreviate track name if too long (middle ellipsis)
        const abbreviate = (str: string, max = 28) => {
          if (!str) return '';
          return str.length > max ? str.slice(0, 16) + '...' + str.slice(-8) : str;
        };

        return (
          <Card
            key={track.track_id}
            className="bg-white/5 hover:bg-white/10 border-white/5 transition-all duration-300 transform hover:scale-102 relative overflow-visible cursor-pointer px-0"
            onClick={() => handleAlbumSelect({
              album_id: track.album_id,
              album_name: track.album_name,
              artist_name: track.artist_name,
              artist_id: track.artist_id || track.album_id,
              release_date: track.timestamp || new Date().toISOString(),
              cover_art: track.cover_art || ''
            })}
          >
            <div className="p-3 flex flex-row gap-4 items-center">
              {/* Album art (spans both rows) */}
              <div className="flex-none flex items-center">
                <img
                  src={track.cover_art || ''}
                  alt={track.album_name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              </div>
              {/* Main info: relative for absolute trending icon */}
              <div className="flex-1 min-w-0 relative flex flex-col justify-center">
                {/* Top row: track name, trending icon (absolute) */}
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-white truncate text-left pr-8" title={abbreviate(track.album_name)}>
                    {abbreviate(track.album_name)}
                  </h3>
                  {/* Trending icon absolute top right */}
                  <div className="">
                    <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 p-1 rounded-full text-xs font-medium text-emerald-300 border border-emerald-500/30 shadow">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </div>
                </div>
                {/* Second row: artist, release date (left); streams, % growth (right) */}
                <div className="flex flex-row items-end justify-between w-full">
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm text-white/60 truncate text-left">{track.artist_name}</p>
                    <p className="text-xs text-white/40 truncate text-left">{track.release_date ? new Date(track.release_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</p>
                  </div>
                  <div className="flex flex-row gap-2 items-center ml-2 flex-shrink-0">
                    <div className="flex items-center px-2 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-white font-semibold">
                      <Play className="h-3 w-3 mr-1" />
                      <span>{formatNumber(track.stream_count || 0)}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full border text-xs font-semibold flex items-center whitespace-nowrap ${weeklyGrowth >= 0 ? 'bg-emerald-900/30 border-emerald-400/30 text-emerald-300' : 'bg-red-900/30 border-red-400/30 text-red-300'}`}>
                      <span>{weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  if (selectedAlbum) {
    return (
      <div className="w-full h-full">
        <EnhancedAlbumDetail
          selectedAlbum={selectedAlbum}
          tracks={tracks}
          totalStreams={totalStreams}
          loading={loading}
          error={error}
          onBackToSearch={handleBackToSearch}
          albumDetails={albumDetails ?? null}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
      {/* Left column - centered content */}
      <div className="items-center h-full md:mb-0 flex flex-col justify-center">
        <div className="hidden md:block md:mt-0 md:mb-0 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Spotify Stream<br />Analytics
          </h1>
          <p className="text-sm md:text-lg text-white/70 mb-8 max-w-md">
            Get real-time access to Spotify streaming analytics and track counts for any album.
          </p>
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
                renderTrendingTracks={trendingTracksSection}
              />
            </div>

            {/* Trending section now handled in SearchSection/SearchResults */}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;