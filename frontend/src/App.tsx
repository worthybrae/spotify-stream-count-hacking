import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AboutPage } from './pages/AboutPage';
import { ApiPage } from './pages/ApiPage';
import { SearchSection } from './components/dashboard/SearchSection';
import TrackCards from './components/dashboard/TrackCards';
import { SearchResult } from './types/search';
import { Track, StreamCount } from './types/api';
import { getAlbumTracks, getTrackHistory } from './lib/api';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, Play, DollarSign } from 'lucide-react';
import { useState, useMemo } from 'react';
// Include all the recharts components we need
import { LineChart, Line, YAxis, CartesianGrid } from 'recharts';

// Format numbers for display (e.g., 1.2m instead of 1200000)
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'b';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

function App() {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [streamHistory, setStreamHistory] = useState<StreamCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  // Calculate total streams and revenue
  const totalStreams = useMemo(() => 
    tracks.reduce((sum, track) => sum + track.playcount, 0), 
    [tracks]
  );
  
  const totalRevenue = useMemo(() => 
    totalStreams * 0.004, 
    [totalStreams]
  );

  
  // This line is just to prevent TypeScript from complaining about unused imports
  // @ts-ignore
  const _unused = { LineChart, Line, YAxis, CartesianGrid };

  const handleAlbumSelect = async (album: SearchResult) => {
    setLoading(true);
    setSelectedAlbum(album);
    setShowSearch(false);
    
    try {
      const albumData = await getAlbumTracks(album.album_id);
      const historyPromises = albumData.tracks.map(track => 
        getTrackHistory(track.track_id)
      );
      const histories = await Promise.all(historyPromises);
      const combinedHistory = histories.flat();
      
      setTracks(albumData.tracks);
      setStreamHistory(combinedHistory);
    } catch (error) {
      console.error('Failed to fetch album data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSearch = () => {
    setSelectedAlbum(null);
    setTracks([]);
    setStreamHistory([]);
    setShowSearch(true);
  };

  return (
    <Router>
      {/* Shared Header */}
      <header className="fixed top-0 w-full border-b border-white/5 bg-black/50 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-medium text-white">StreamClout</Link>
            <nav className="flex gap-6">
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link>
              <Link to="/api" className="text-sm text-white/60 hover:text-white transition-colors">API</Link>
            </nav>
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/api" element={<ApiPage />} />
        <Route path="/" element={
          <div className="min-h-screen bg-black text-white">
            {/* Main Content */}
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
                      onSearchStateChange={() => {}}
                    />
                  ) : (
                    <div className="space-y-6">
                      <button
                        onClick={handleBackToSearch}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Search
                      </button>

                      {selectedAlbum && (
                        <Card className="p-6 bg-black border-white/10">
                          {/* Album Header with Performance Stats */}
                          <div className="flex items-start justify-between mb-6">
                            {/* Album Cover and Info */}
                            <div className="flex items-start gap-4">
                              <img 
                                src={selectedAlbum.cover_art}
                                alt={selectedAlbum.album_name}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold text-white truncate">{selectedAlbum.album_name}</h2>
                                <p className="text-lg text-white/60">{selectedAlbum.artist_name}</p>
                                <p className="text-sm text-white/40">
                                  Released {new Date(selectedAlbum.release_date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Performance Stats */}
                            {!loading && (
                              <div className="flex-shrink-0 bg-white/5 rounded-xl p-3">                                
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <Play className="h-4 w-4 text-green-400" />
                                    <span className="text-green-400 font-medium">{formatNumber(totalStreams)}</span>
                                  </div>
                                  
                                  <div className="h-4 w-px bg-white/10"></div>
                                  
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-yellow-400" />
                                    <span className="text-yellow-400 font-medium">{formatNumber(totalRevenue)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Track listing */}
                          {loading ? (
                            <div className="flex items-center justify-center h-32 mt-6">
                              <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                            </div>
                          ) : tracks.length > 0 && (
                            <TrackCards 
                              tracks={tracks}
                              streamHistory={streamHistory}
                              selectedAlbum={selectedAlbum}
                            />
                          )}
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* Background Effect */}
            <div className="fixed inset-0 pointer-events-none -z-10">
              <svg className="absolute w-full h-full opacity-10" viewBox="0 0 1000 1000">
                <path
                  d="M0,500 Q250,400 500,500 T1000,500"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="1"
                  className="animate-flow"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;