// components/features/profile/UserTopTracks.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CheckInTracker from './CheckInTracker';
import axios from 'axios';
import TrackCard from '../tracks/TrackCard';
import { GroupedTrack, Track } from '@/types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';

const UserTopTracks: React.FC = () => {
  const [processedTracks, setProcessedTracks] = useState<GroupedTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, spotifyToken } = useAuth();
  
  // Fetch top tracks
  const fetchTopTracks = async () => {
    if (!user?.id || !spotifyToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });
      
      const response = await api.get(`/tracks/${user.id}`, {
        params: {
          access_token: spotifyToken,
          force: false
        }
      });
      
      console.log('Raw API response:', response.data);
      
      if (response.data && Array.isArray(response.data.tracks)) {
        // Convert tracks to the format expected by our existing processor
        const convertedTracks: Track[] = response.data.tracks.map((track: any) => {
          return {
            track_id: track.track_id,
            name: track.name,
            playcount: track.stream_history && track.stream_history.length > 0 
              ? track.stream_history[track.stream_history.length - 1].playcount 
              : 0,
            artist_name: track.artist_name,
            artist_id: track.artist_id,
            album_id: track.album_id,
            album_name: track.album_name,
            cover_art: track.cover_art,
            // Convert stream_history to streamHistory format for processor
            streamHistory: track.stream_history 
              ? track.stream_history.map((item: any) => ({
                  date: item.day,
                  streams: item.playcount
                })) 
              : []
          };
        });
        
        console.log('Converted tracks:', convertedTracks);
        
        // Process tracks using existing utility
        const processedData = processTrackData(convertedTracks);
        console.log('Processed track data:', processedData);
        setProcessedTracks(processedData);
      } else {
        console.error('Invalid response format or no tracks found', response.data);
        setProcessedTracks([]);
      }
    } catch (err) {
      console.error('Error fetching top tracks:', err);
      setError('Failed to load top tracks');
    } finally {
      setLoading(false);
    }
  };
  
  // Load tracks on component mount
  useEffect(() => {
    if (user?.id && spotifyToken) {
      fetchTopTracks();
    } else {
      setLoading(false);
    }
  }, [user?.id, spotifyToken]);
  
  if (!user?.id) {
    return null;
  }
  
  return (
    <div className="w-full space-y-4">
      {/* Check-in Tracker */}
      <CheckInTracker 
        userId={user.id} 
        onCheckInComplete={fetchTopTracks}
      />
      
      {/* Top Tracks Card */}
      <Card className="p-4 bg-black/40 border-white/10 overflow-auto" style={{ maxHeight: 'calc(100vh - 15rem)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Your Top Tracks</h2>
          {!loading && processedTracks.length > 0 && (
            <span className="text-xs text-white/60">
              {processedTracks.length} tracks found
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : processedTracks.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            No top tracks found. Check in to see your listening data.
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {processedTracks.map((track) => (
              <TrackCard 
                key={track.track_id}
                track={track}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserTopTracks;