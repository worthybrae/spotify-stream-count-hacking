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
import { Play, TrendingUp, BarChart3, Music, DollarSign } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';

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



  // Trending songs state
  const [groupedTrendingTracks, setGroupedTrendingTracks] = useState<GroupedTrack[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Search state
  const [searchValue, setSearchValue] = useState<string>('');
  const [hasSearchResults, setHasSearchResults] = useState<boolean>(false);

  // Helper to get 7d growth for a track from backend data
  const getWeeklyGrowth = (track: GroupedTrack) => {
    // Use backend-calculated percentage change if available
    if (track.pct_change !== undefined) {
      return track.pct_change;
    }

    // Fallback to frontend calculation if pct_change is not available
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

  const isSearching = searchValue.trim().length >= 3 && hasSearchResults;

  const trendingTracksSection = (
    <section className="flex flex-col gap-4" aria-labelledby="trending-title">
      {/* Header with search and title */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="trending-title" className="text-2xl font-bold text-white">Trending Songs</h2>
          <div className="text-xs text-white/40 font-medium">Updated daily</div>
        </div>
                <SearchSection
          onAlbumSelect={handleAlbumSelect}
          onSearchValueChange={(value) => {
            setSearchValue(value);
            // Reset search results state when search value changes
            if (value.trim().length < 3) {
              setHasSearchResults(false);
            }
          }}
          onSearchStateChange={(hasResults) => setHasSearchResults(hasResults)}
        />
      </div>

      {/* Only show trending content when not actively searching */}
      {!isSearching && (
        <>
          {trendingLoading && (
            <div className="text-white/70 text-center py-8">Loading trending Spotify tracks...</div>
          )}
          {trendingError && (
            <div className="text-red-400 text-center py-8">{trendingError}</div>
          )}
          {!trendingLoading && !trendingError && groupedTrendingTracks.length === 0 && (
            <div className="text-white/70 text-center py-8">No trending Spotify streaming data found.</div>
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
            <article className="p-3 flex flex-row gap-4 items-center">
              {/* Album art (spans both rows) */}
              <div className="flex-none flex items-center">
                <img
                  src={track.cover_art || ''}
                  alt={`${track.album_name} album cover`}
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
            </article>
          </Card>
        );
      })}
        </>
      )}
    </section>
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
    <>
      {/* SEO Head for home page */}
      <SEOHead
        title="StreamClout - Real-Time Spotify Streaming Data & Track Analytics"
        description="Discover the most streamed songs on Spotify with real-time streaming data analytics. Get comprehensive Spotify track streams, stream counts, and performance insights for artists and albums."
        keywords="spotify streaming data, spotify track streams, spotify stream count, most streamed song on spotify, streaming analytics, spotify charts, track performance, streaming insights"
        canonicalUrl="https://streamclout.io/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "StreamClout",
          "description": "Real-time Spotify streaming data analytics platform",
          "applicationCategory": "MusicApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "featureList": [
            "Real-time Spotify streaming data",
            "Track stream count analytics",
            "Artist performance metrics",
            "Album streaming insights"
          ]
        }}
      />

      <main className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8 items-center h-full" role="main">
        {/* Left column - centered content */}
        <section className="flex items-center justify-center md:h-full py-4 md:py-0" aria-labelledby="main-heading">
          <div className="text-center w-full">
            <h1 id="main-heading" className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent leading-tight">
              Spotify Streaming Data
            </h1>
            <p className="hidden md:block text-xl text-white/80 mb-6 leading-relaxed">
              Discover real-time <strong>Spotify streaming data</strong> and track performance insights.
              Analyze <strong>Spotify track streams</strong>, view detailed <strong>stream counts</strong>,
              and find the <strong>most streamed songs on Spotify</strong>.
            </p>
            <div className="hidden md:grid grid-cols-2 gap-4 text-sm text-white/60 mb-8 max-w-md mx-auto">
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                <Music className="w-4 h-4 text-purple-400" />
                <span>Track Performance</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Stream Growth</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Revenue Insights</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right column - trending songs */}
        <section className="w-full flex-1 md:h-full flex flex-col justify-center">
          <div className="w-full px-2 pb-4">
            {trendingTracksSection}
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;