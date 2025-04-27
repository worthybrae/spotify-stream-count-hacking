// components/features/profile/UserLibrary.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Calendar, RefreshCw, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Track, GroupedTrack } from '@/types/api';

// Define the clout history type
interface CloutHistoryItem {
  day: string;
  daily_clout: number;
  cumulative_clout: number;
}

// Extended Track interface to include position, created_at and clout history
interface ExtendedTrack extends Track {
  position?: number;
  created_at?: string;
  cloutHistory?: CloutHistoryItem[];
}

// Extended GroupedTrack interface for consistency
interface ExtendedGroupedTrack extends GroupedTrack {
  clout_points?: number;
  isNew?: boolean;
  position?: number;
  cloutHistory?: CloutHistoryItem[];
}

import { processTrackData } from '@/lib/utils/dataProcessors';
import TrackCard from '../tracks/SimpleTrackCard';
import ExtendedTrackCard from '../tracks/ExtendedTrackCard';

interface UserLibraryProps {
  userId: string;
  useExtendedView?: boolean; // Prop to toggle between normal and extended view
}

const UserLibrary: React.FC<UserLibraryProps> = ({ userId, useExtendedView = false }) => {
  const [processedTracks, setProcessedTracks] = useState<ExtendedGroupedTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [createdDate, setCreatedDate] = useState<string>('');
  const [positionRange, setPositionRange] = useState<{min: number, max: number}>({min: 0, max: 0});
  const [refreshingData, setRefreshingData] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [refreshedToday, setRefreshedToday] = useState<boolean>(false);
  const { spotifyToken } = useAuth();



  // Format date as relative time (e.g., "2 hours ago", "Just now", etc.), accounting for timezone
  const formatRelativeTime = (dateString: string): string => {
    // Parse the UTC date string into a Date object
    // The Date constructor automatically converts to local timezone
    const date = new Date(dateString);
    const now = new Date();

    // Calculate time difference in milliseconds (automatically accounts for timezone)
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      // Format as date if older than a day, using local timezone formatting
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short' // Include timezone info
      });
    }
  };

  // Function to fetch track clout data
  const fetchTrackClout = async (userId: string) => {
    if (!userId || !spotifyToken) return {};

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

        // Convert to a map for easier lookup by track_id
        const trackCloutMap: Record<string, any> = {};
        response.data.tracks.forEach((track: any) => {
          trackCloutMap[track.track_id] = track;
        });
        return trackCloutMap;
      }

      console.log('No track clout data received or invalid format');
      return {};
    } catch (err) {
      console.error('Error fetching track clout data:', err);
      return {};
    }
  };

  // Function to check user's check-in status
  const fetchCheckInStatus = async () => {
    if (!userId) return;

    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });

      const response = await api.get(`/tracks/${userId}/check-ins`);

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Get the most recent check-in date (make sure data is sorted)
        const sortedDates = [...response.data].sort((a, b) =>
          new Date(b).getTime() - new Date(a).getTime()
        );

        const mostRecentDate = sortedDates[0];
        setLastRefreshed(mostRecentDate);

        // Check if most recent date is today
        setRefreshedToday(isToday(mostRecentDate));
      } else {
        setLastRefreshed('Never');
        setRefreshedToday(false);
      }
    } catch (err) {
      console.error('Error fetching check-in status:', err);
      setLastRefreshed('Unknown');
      setRefreshedToday(false);
    }
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!userId || !spotifyToken) {
      setError('You need to be logged in to refresh data');
      return;
    }

    setRefreshingData(true);
    setError(null);

    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });

      await api.get(`/tracks/${userId}`, {
        params: {
          access_token: spotifyToken,
          force: true
        }
      });

      // Update check-in status and refresh tracks
      await fetchCheckInStatus();
      await fetchTopTracks(1);

      // Reset to page 1 after refresh
      setPage(1);
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshingData(false);
    }
  };

  // Fetch top tracks with pagination
  const fetchTopTracks = useCallback(async (pageNum: number = 1) => {
    if (!userId || !spotifyToken) return;

    setLoading(true);
    setError(null);

    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });

      const offset = (pageNum - 1) * limit;

      // Use the updated API with pagination
      console.log(`Fetching top tracks for user ${userId}, page ${pageNum}, limit ${limit}`);
      const response = await api.get(`/tracks/${userId}`, {
        params: {
          access_token: spotifyToken,
          limit,
          offset,
          sort_by: 'recent'
        }
      });

      // Fetch track clout data
      console.log('Fetching track clout data');
      const trackCloutMap = await fetchTrackClout(userId);

      if (response.data && Array.isArray(response.data.tracks)) {
        console.log(`Received ${response.data.tracks.length} tracks`);

        // If we received fewer tracks than requested, there are no more results
        setHasMore(response.data.tracks.length >= limit);

        // Convert tracks to the format expected by our existing processor
        const convertedTracks: ExtendedTrack[] = response.data.tracks.map((track: any) => {
          // Get clout data for this track if available
          const cloutData = trackCloutMap[track.track_id];

          // Calculate current clout points from history if available
          let cloutPoints = 0;
          if (cloutData && cloutData.clout_history && cloutData.clout_history.length > 0) {
            // Get the most recent cumulative clout value
            const mostRecentClout = cloutData.clout_history[cloutData.clout_history.length - 1];
            cloutPoints = mostRecentClout.cumulative_clout;
          }

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
            // Include clout_points from our new calculation
            clout_points: cloutPoints,
            // Convert stream_history to streamHistory format for processor
            streamHistory: track.stream_history
              ? track.stream_history.map((item: any) => ({
                  date: item.day,
                  streams: item.playcount
                }))
              : [],
            // Add clout history if available
            cloutHistory: cloutData?.clout_history || [],
            // Include position and created_at from backend
            position: track.position,
            created_at: track.created_at,
          };
        });

        // Process tracks using existing utility
        const processedData = processTrackData(convertedTracks);

        // Add the clout points and position to the processed tracks
        const processedWithClout: ExtendedGroupedTrack[] = processedData.map((track, index) => {
          const originalTrack = convertedTracks.find(t => t.track_id === track.track_id);

          // Create extended grouped track with all properties
          return {
            ...track,
            clout_points: originalTrack?.clout_points || 0,
            cloutHistory: originalTrack?.cloutHistory || [],
            isNew: Boolean(originalTrack?.clout_points && originalTrack.clout_points > 10),
            // Use position from API response instead of calculating it
            position: originalTrack?.position || ((pageNum - 1) * limit + index + 1)
          };
        });

        // Find real position range for the current page using actual position values
        let minPosition = Number.MAX_SAFE_INTEGER;
        let maxPosition = 0;

        processedWithClout.forEach(track => {
          if (track.position) {
            minPosition = Math.min(minPosition, track.position);
            maxPosition = Math.max(maxPosition, track.position);
          }
        });

        // Only update position range if we have valid values
        if (minPosition !== Number.MAX_SAFE_INTEGER && maxPosition > 0) {
          setPositionRange({ min: minPosition, max: maxPosition });
        } else {
          setPositionRange({ min: 0, max: 0 });
        }

        // Set created date from API if available, otherwise use current date
        if (convertedTracks.length > 0 && convertedTracks[0].created_at) {
          const apiDate = new Date(convertedTracks[0].created_at);
          const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' } as const;
          setCreatedDate(apiDate.toLocaleDateString('en-US', dateOptions));
        } else {
          const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' } as const;
          setCreatedDate(new Date().toLocaleDateString('en-US', dateOptions));
        }

        console.log(`Processed ${processedWithClout.length} tracks`);
        setProcessedTracks(processedWithClout);
      } else {
        console.error('Invalid response format or no tracks found', response.data);
        setProcessedTracks([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching top tracks:', err);
      setError('Failed to load top tracks');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [userId, spotifyToken, limit]);

  // Reset pagination when sort changes
  useEffect(() => {
    setPage(1);
    fetchTopTracks(1);
  }, [fetchTopTracks]);

  // Load tracks and check-in status on component mount
  useEffect(() => {
    if (userId && spotifyToken) {
      fetchTopTracks(page);
      fetchCheckInStatus();
    } else {
      setLoading(false);
    }
  }, [userId, spotifyToken, fetchTopTracks, page]);

  // Handle pagination
  const handleNextPage = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };

  // Function to check if a date is today (accounting for timezone)
  const isToday = (dateString: string): boolean => {
    // Get current date in local timezone
    const today = new Date();

    // Parse database date (assumed UTC) and convert to local timezone
    const date = new Date(dateString);

    // Compare dates in local timezone using only year, month, and day
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };


  return (
    <Card className="h-full bg-black/40 border-white/10 flex flex-col overflow-hidden">
      {/* Header with refresh button and moved date/position info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-white font-medium">Top Tracks</h3>

              {/* Moved position range to the header next to the title */}
              {positionRange.min > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-black/20 rounded-sm text-xs text-white/60">
                  #{positionRange.min}-{positionRange.max}
                </span>
              )}

              {/* Moved date to the header next to position */}
              <div className="ml-3 flex items-center text-xs text-white/60">
                {loading ? (
                  <Loader2 className="h-4 w-4 text-white/60 animate-spin" />
                ) : (
                  <>
                    <Calendar className="h-3 w-3 mr-1 text-white/40" />
                    <span>{createdDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* Refresh button */}
            {refreshedToday ? (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-600 text-white cursor-default flex items-center gap-1"
                disabled={true}
              >
                <Check className="h-4 w-4" />
                <span>Updated Today</span>
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                onClick={refreshUserData}
                disabled={refreshingData}
              >
                {refreshingData ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Refresh Data</span>
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-white/60">Recent top 50 short term tracks</p>
            {lastRefreshed && lastRefreshed !== 'Never' && lastRefreshed !== 'Unknown' && (
              <p className="text-xs text-white/60">
                Last refreshed: {formatRelativeTime(lastRefreshed)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-grow overflow-y-auto p-4">
        {loading && processedTracks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-4">{error}</div>
        ) : processedTracks.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            No tracks found. Click "Refresh Data" to see your listening data.
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {processedTracks.map((track) => (
              useExtendedView ? (
                <ExtendedTrackCard
                  key={track.track_id}
                  track={track}
                />
              ) : (
                <TrackCard
                  key={track.track_id}
                  track={track}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Pagination footer - now without date/position info */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={handlePrevPage}
          className="text-white/70 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {/* Center space - now empty since we moved date/position to top */}
        <div className="flex-1"></div>

        <Button
          variant="ghost"
          size="sm"
          disabled={!hasMore || loading}
          onClick={handleNextPage}
          className={`text-white/70 ${hasMore ? 'hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

export default UserLibrary;