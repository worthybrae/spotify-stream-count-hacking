// components/features/profile/TopCloutTracks.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TopCloutTracksProps {
  userId: string;
}

// Define the track clout item type from API
interface TrackCloutItem {
  track_id: string;
  track_name: string;
  artist_name: string;
  album_id: string;
  album_name: string;
  cover_art: string;
  clout_history: Array<{
    day: string;
    daily_clout: number;
    cumulative_clout: number;
  }>;
}

// Extended interface for processed track data
interface ProcessedTrackCloutItem extends TrackCloutItem {
  latestClout: number;
  dailyCloutChange: number;
}

const TopCloutTracks: React.FC<TopCloutTracksProps> = ({ userId }) => {
  const [topTracks, setTopTracks] = useState<ProcessedTrackCloutItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { spotifyToken } = useAuth();

  // Fetch top clout tracks data
  const fetchTopCloutTracks = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });
      
      console.log(`Fetching track clout data for user ${userId}`);
      const response = await api.get(`/tracks/${userId}/track-clout`);
      
      if (response.data && Array.isArray(response.data.tracks)) {
        console.log(`Received clout data for ${response.data.tracks.length} tracks`);
        
        // Process and sort tracks by clout points (highest first)
        const tracksWithClout: ProcessedTrackCloutItem[] = response.data.tracks
          .map((track: TrackCloutItem) => {
            // Get latest cumulative clout value
            const latestClout = track.clout_history && track.clout_history.length > 0
              ? track.clout_history[track.clout_history.length - 1].cumulative_clout
              : 0;
              
            // Calculate 24-hour clout change
            let dailyCloutChange = 0;
            if (track.clout_history && track.clout_history.length >= 2) {
              // Get the most recent daily_clout value
              dailyCloutChange = track.clout_history[track.clout_history.length - 1].daily_clout;
            }
            
            return {
                ...track,
                latestClout,
                dailyCloutChange
              };
            })
            .sort((a: ProcessedTrackCloutItem, b: ProcessedTrackCloutItem) => b.latestClout - a.latestClout);
        
        // Get top 5 tracks
        setTopTracks(tracksWithClout.slice(0, 5));
      } else {
        console.log('No track clout data received or invalid format');
        setTopTracks([]);
      }
    } catch (err) {
      console.error('Error fetching track clout data:', err);
      setError('Failed to load top clout tracks');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchTopCloutTracks();
  }, [userId, spotifyToken]);

  // Helper function to get change indicator class based on value
  const getChangeIndicatorClass = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-white/60';
  };

  // Helper function to get change icon based on value
  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-3 w-3" />;
    if (change < 0) return <ArrowDown className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  };

  // Create placeholder tracks if we have fewer than 5
  const displayTracks = [...topTracks];
  while (displayTracks.length < 5) {
    displayTracks.push({
      track_id: `placeholder-${displayTracks.length}`,
      track_name: 'No track data',
      artist_name: 'Keep listening',
      album_id: '',
      album_name: '',
      cover_art: '',
      clout_history: [],
      latestClout: 0,
      dailyCloutChange: 0
    });
  }

  if (loading) {
    return (
      <Card className='bg-black/40 border-white/10 flex flex-col overflow-hidden'>
        <div className='p-4 border-b border-white/10'>
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Top Finds</h2>
          </div>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-black/40 border-white/10 flex flex-col overflow-hidden'>
        <div className='p-4 border-b border-white/10'>
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Top Finds</h2>
          </div>
          <div className="text-red-400 text-sm text-center py-4">{error}</div>
        </div>
      </Card>
    );
  }

  // Helper function to get badge color based on index
  const getBadgeColor = (index: number) => {
    switch(index) {
      case 0: return 'bg-yellow-600';
      case 1: return 'bg-blue-600';
      case 2: return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <Card className='bg-black/40 border-white/10 flex flex-col overflow-hidden'>
      <div className='p-4 border-b border-white/10'>
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Top Finds</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {displayTracks.map((track, index) => (
            <div 
              key={track.track_id}
              className={`bg-black/30 rounded-lg border ${
                index === 0 ? 'border-yellow-500/30' : 
                index === 1 ? 'border-blue-500/30' : 
                index === 2 ? 'border-purple-500/30' :
                'border-white/10'
              } overflow-hidden flex flex-col`}
            >
              {/* Album Cover Top */}
              <div className="relative">
                <img 
                  src={track.cover_art || 'https://placehold.co/300x300/3d3d3d/white?text=Album'} 
                  alt={track.album_name || 'Album cover'} 
                  className="w-full aspect-square object-cover"
                />
                
                {/* Total Clout Badge (rounded to nearest int) - Made LARGER */}
                <div className={`absolute top-2 left-2 w-8 h-8 rounded-full ${getBadgeColor(index)} flex items-center justify-center text-white text-xs font-bold`}>
                  +{Math.round(track.latestClout)}
                </div>
              </div>
              
              {/* Track Info Bottom with 24hr change moved to bottom right */}
              <div className="p-2 flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-2">
                  <h4 className="text-white font-medium text-xs truncate" title={track.track_name}>
                    {track.track_name}
                  </h4>
                  <p className="text-white/60 text-xs truncate" title={track.artist_name}>
                    {track.artist_name}
                  </p>
                </div>
                
                {/* 24hr Change */}
                {track.dailyCloutChange !== 0 && (
                  <div className={`flex items-center ${getChangeIndicatorClass(track.dailyCloutChange)}`}>
                    {getChangeIcon(track.dailyCloutChange)}
                    <span className="ml-0.25 text-xs font-medium">
                      {track.dailyCloutChange.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TopCloutTracks;