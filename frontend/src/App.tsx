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
import { Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

function App() {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [streamHistory, setStreamHistory] = useState<StreamCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

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
                        <Card className="p-6 bg-white/5 border-white/10">
                          <div className="flex items-center gap-6">
                            <img 
                              src={selectedAlbum.cover_art}
                              alt={selectedAlbum.album_name}
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                            <div>
                              <h2 className="text-2xl font-bold text-white">{selectedAlbum.album_name}</h2>
                              <p className="text-lg text-white/60">{selectedAlbum.artist_name}</p>
                              <p className="text-sm text-white/40 mt-2">
                                Released {new Date(selectedAlbum.release_date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

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