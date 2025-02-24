import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Track, StreamCount } from '@/types/api';
import { SearchResult } from '@/types/search';
import { Header } from '@/components/global/Header';
import { Footer } from '@/components/global/Footer';

const DashboardPage = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const [trackStats, setTrackStats] = useState<{tracks: Track[], streamHistory: StreamCount[]}>({
    tracks: [],
    streamHistory: []
  });
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAlbumSelect = async (result: SearchResult) => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      const tracksResponse = await fetch(`/api/albums/${result.album_id}/tracks`);
      const tracks = await tracksResponse.json();
      
      const historyResponse = await fetch(`/api/albums/${result.album_id}/history`);
      const history = await historyResponse.json();
      
      setSelectedAlbum(result);
      setTrackStats({ tracks, streamHistory: history });
    } catch (error) {
      console.error('Failed to fetch album data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = (streams: number) => {
    const revenuePerStream = 0.004;
    return streams * revenuePerStream;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 relative">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20">
          <div className="absolute inset-0 opacity-50 mix-blend-overlay" />
        </div>

        {/* Main Content */}
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-6 mb-16">
            {/* Left Column - Search */}
            <div className="w-full lg:w-1/2">
              <Card className="p-6 bg-background/80 backdrop-blur-xl border-white/20">
                <h2 className="text-2xl font-bold mb-6">Search Albums</h2>
                <SearchBar 
                  onResultSelect={handleAlbumSelect}
                  placeholder="Search for any album..."
                  className="mb-4"
                />
                
                {selectedAlbum && (
                  <div className="mt-6">
                    <div className="flex items-center gap-4 mb-6">
                      <img 
                        src={selectedAlbum.cover_art}
                        alt={selectedAlbum.album_name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-semibold">{selectedAlbum.album_name}</h3>
                        <p className="text-muted-foreground">{selectedAlbum.artist_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Released: {formatFullDate(selectedAlbum.release_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Stats */}
            <div className="w-full lg:w-1/2">
              <Card className="p-6 bg-background/80 backdrop-blur-xl border-white/20">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : selectedAlbum ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 bg-primary/10">
                        <h4 className="text-sm text-muted-foreground">Total Streams</h4>
                        <p className="text-2xl font-bold">
                          {trackStats.tracks.reduce((sum, track) => sum + track.playcount, 0).toLocaleString()}
                        </p>
                      </Card>
                      <Card className="p-4 bg-primary/10">
                        <h4 className="text-sm text-muted-foreground">Total Revenue</h4>
                        <p className="text-2xl font-bold">
                          ${calculateRevenue(
                            trackStats.tracks.reduce((sum, track) => sum + track.playcount, 0)
                          ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </Card>
                    </div>

                    <div className="h-64">
                      <h3 className="text-lg font-semibold mb-4">Streams Over Time</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trackStats.streamHistory}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                          <XAxis 
                            dataKey="timestamp"
                            tickFormatter={formatDate}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => [
                              value.toLocaleString(),
                              'Streams'
                            ]}
                            labelFormatter={formatFullDate}
                          />
                          <Line
                            type="monotone"
                            dataKey="playcount"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Track Breakdown</h3>
                      {trackStats.tracks.map((track) => (
                        <Card key={track.track_id} className="p-4 hover:bg-primary/5 transition-colors">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{track.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {track.playcount.toLocaleString()} streams
                              </p>
                            </div>
                            <p className="font-medium">
                              ${calculateRevenue(track.playcount).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
                    <p>Search and select an album to view statistics</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardPage;