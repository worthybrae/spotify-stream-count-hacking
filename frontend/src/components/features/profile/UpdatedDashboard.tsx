// components/features/profile/UpdatedDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Calendar, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProfile, refreshUserData } from '@/lib/api/userProfileApi';
import { UserProfileResponseItem } from '@/types/userProfile';
import { processTrackData } from '@/lib/utils/dataProcessors';
import { Track, GroupedTrack } from '@/types/api';
import EnhancedTrackCard from '@/components/features/tracks/EnhancedTrackCard';

interface DayData {
  date: string;
  formattedDate: string;
  tracks: GroupedTrack[];
}

const UpdatedDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  // State for raw and processed data
  const [rawProfileData, setRawProfileData] = useState<UserProfileResponseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // State for date navigation
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);
  const [dayData, setDayData] = useState<DayData[]>([]);

  // Auth context for Spotify tokens
  const { spotifyToken } = useAuth();

  // Load user profile data
  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user profile data
      const userData = await fetchUserProfile(userId);
      setRawProfileData(userData);

      // Process the data
      processUserData(userData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load your profile data');
      setLoading(false);
    }
  };

  // Process user data to extract dates and tracks
  const processUserData = (data: UserProfileResponseItem[]) => {
    if (!data || data.length === 0) {
      setAvailableDates([]);
      setDayData([]);
      return;
    }

    // Extract distinct dates within last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Get unique top_track_at dates, filtered to last 30 days
    const uniqueDates = [...new Set(data
      .filter(item => {
        if (!item.top_track_at) return false;
        const date = new Date(item.top_track_at);
        return date >= thirtyDaysAgo && date <= today;
      })
      .map(item => item.top_track_at))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Most recent first

    setAvailableDates(uniqueDates);

    // Group tracks by date
    const processedDays: DayData[] = [];

    uniqueDates.forEach(date => {
      // For each date, create a map to store the top 50 tracks by position
      const topTracksByPosition: Map<number, UserProfileResponseItem> = new Map();

      // Filter tracks that have this date as top_track_at
      const dateItems = data.filter(item => item.top_track_at === date);

      // Populate the map with tracks by position
      dateItems.forEach(item => {
        // Only process items that have a valid position (1-50)
        if (item.position && item.position >= 1 && item.position <= 50) {
          // If we already have a track at this position, keep the one with the highest play count
          if (!topTracksByPosition.has(item.position) ||
              item.play_count > topTracksByPosition.get(item.position)!.play_count) {
            topTracksByPosition.set(item.position, item);
          }
        }
      });

      // Convert the map to an array of tracks, sorted by position
      const tracksData: Track[] = Array.from(topTracksByPosition.entries())
        .sort(([posA], [posB]) => posA - posB) // Sort by position
        .map(([position, item]) => {
          // Find all occurrences of this track to build stream history
          const trackHistory = data.filter(
            d => d.track_name === item.track_name &&
                d.artist_name === item.artist_name
          ).sort((a, b) =>
            new Date(a.stream_recorded_at).getTime() - new Date(b.stream_recorded_at).getTime()
          );

          // Create track with streamHistory property
          return {
            track_id: `${item.track_name}_${item.artist_name}`, // Creating a unique ID
            name: item.track_name,
            playcount: item.play_count,
            artist_name: item.artist_name,
            album_name: item.album_name,
            cover_art: item.cover_art,
            position,
            day: item.top_track_at,
            stream_recorded_at: item.stream_recorded_at,
            streamHistory: trackHistory.map(hist => ({
              date: hist.stream_recorded_at,
              streams: hist.play_count
            }))
          };
        });

      // Check if we have any tracks
      if (tracksData.length === 0) {
        // If no tracks with positions were found, fall back to all tracks for this date
        // This ensures we show something even if position data is missing
        const fallbackTracks = dateItems.map(item => {
          const trackHistory = data.filter(
            d => d.track_name === item.track_name &&
                d.artist_name === item.artist_name
          ).sort((a, b) =>
            new Date(a.stream_recorded_at).getTime() - new Date(b.stream_recorded_at).getTime()
          );

          return {
            track_id: `${item.track_name}_${item.artist_name}`,
            name: item.track_name,
            playcount: item.play_count,
            artist_name: item.artist_name,
            album_name: item.album_name,
            cover_art: item.cover_art,
            position: item.position,
            day: item.top_track_at,
            stream_recorded_at: item.stream_recorded_at,
            streamHistory: trackHistory.map(hist => ({
              date: hist.stream_recorded_at,
              streams: hist.play_count
            }))
          };
        });

        const processedTracks = processTrackData(fallbackTracks);
        // Sort by position if available, otherwise by play count
        const sortedTracks = processedTracks.sort((a, b) => {
          if (a.position && b.position) return a.position - b.position;
          return (b.playcount || 0) - (a.playcount || 0);
        });

        // Format date for display
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });

        // Add to day data
        processedDays.push({
          date,
          formattedDate,
          tracks: sortedTracks
        });
      } else {
        // Process the tracks to create consistent data format
        const processedTracks = processTrackData(tracksData);

        // Format date for display
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });

        // Add to day data
        processedDays.push({
          date,
          formattedDate,
          tracks: processedTracks
        });
      }
    });

    setDayData(processedDays);

    // Set current date to most recent (index 0)
    setCurrentDateIndex(0);
  };

  // Refresh data using Spotify token
  const handleRefresh = async () => {
    if (!spotifyToken) {
      setError('Spotify token is required to refresh data');
      return;
    }

    setRefreshing(true);

    try {
      const success = await refreshUserData(userId, spotifyToken);

      if (success) {
        // Reload user profile
        await loadUserProfile();
      } else {
        setError('Failed to refresh data');
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    if (currentDateIndex < availableDates.length - 1) {
      setCurrentDateIndex(currentDateIndex + 1);
    }
  };

  // Navigate to next day
  const goToNextDay = () => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(currentDateIndex - 1);
    }
  };

  // Check if today's data has been refreshed
  const isTodayData = (): boolean => {
    if (availableDates.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    return availableDates[0].startsWith(today);
  };

  // Load data on component mount
  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Current day's data
  const currentDay = dayData[currentDateIndex];

  return (
    <div className="flex flex-col h-full">
      <Card className="bg-black/40 border-white/10 flex-grow flex flex-col overflow-hidden">
        {/* Header with date navigation and refresh button */}
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Date navigation */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousDay}
                  disabled={currentDateIndex >= availableDates.length - 1 || loading}
                  className="text-white/70 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="flex items-center mx-2">
                  <Calendar className="h-4 w-4 mr-2 text-white/70" />
                  {loading ? (
                    <div className="w-32 h-5 bg-white/10 animate-pulse rounded"></div>
                  ) : (
                    <span className="text-white font-medium">
                      {currentDay?.formattedDate || 'No data available'}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextDay}
                  disabled={currentDateIndex <= 0 || loading}
                  className="text-white/70 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Day indicator - keeping only 7 dots for cleaner UI */}
              <div className="hidden md:flex items-center">
                {availableDates.slice(0, 7).map((date, index) => (
                  <div
                    key={date}
                    className={`h-2 w-2 rounded-full mx-1 ${
                      index === currentDateIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                    onClick={() => setCurrentDateIndex(index)}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
                {availableDates.length > 7 && (
                  <div className="h-2 px-1 text-white/50 text-xs">...</div>
                )}
              </div>
            </div>

            {/* Track count indicator */}
            <div className="text-white/70 text-sm mr-4">
              {currentDay ?
                `${currentDay.tracks.length} of 50 tracks` :
                '0 tracks'}
            </div>

            {/* Refresh button */}
            {isTodayData() ? (
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
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                onClick={handleRefresh}
                disabled={refreshing || !spotifyToken}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Refresh</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tracks list - with proper scrolling */}
        <div className="flex-grow overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-400">{error}</p>
            </div>
          ) : currentDay && currentDay.tracks.length > 0 ? (
            <div className="space-y-4">
              {currentDay.tracks.map((track, index) => (
                <EnhancedTrackCard
                  key={`${track.track_id}-${index}`}
                  track={track}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/60">No tracks found for this date</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UpdatedDashboard;