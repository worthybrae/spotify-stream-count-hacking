// components/features/profile/UserTrackHistory.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Clock, CalendarDays, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProfile, refreshUserData } from '@/lib/api/userProfileApi';
import { UserProfileResponseItem } from '@/types/userProfile';
import { processTrackData } from '@/lib/utils/dataProcessors';
import { Track, GroupedTrack } from '@/types/api';
import EnhancedTrackCard from '@/components/features/tracks/EnhancedTrackCard';

interface UserTrackHistoryProps {
  userId: string;
}

// Define sorting options
type SortOption = 'first_added' | 'last_streamed' | 'position' | 'playcount';

const UserTrackHistory: React.FC<UserTrackHistoryProps> = ({ userId }) => {
  // State for raw and processed data
  const [rawProfileData, setRawProfileData] = useState<UserProfileResponseItem[]>([]);
  const [processedTracks, setProcessedTracks] = useState<GroupedTrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tracksPerPage] = useState<number>(10);

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('first_added');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Process user data to extract unique tracks with history
  const processUserData = (data: UserProfileResponseItem[]) => {
    if (!data || data.length === 0) {
      setProcessedTracks([]);
      return;
    }

    // Group by track_name and artist_name to get unique tracks
    const uniqueTracks: Record<string, UserProfileResponseItem[]> = {};

    data.forEach(item => {
      if (!item.track_name || !item.artist_name) return;

      const trackKey = `${item.track_name}::${item.artist_name}`;

      if (!uniqueTracks[trackKey]) {
        uniqueTracks[trackKey] = [];
      }

      uniqueTracks[trackKey].push(item);
    });

    // Convert to tracks format with stream history
    const tracksData: Track[] = Object.entries(uniqueTracks).map(([trackKey, instances]) => {
      // Sort instances by date
      const sortedInstances = [...instances].sort((a, b) =>
        new Date(a.stream_recorded_at).getTime() - new Date(b.stream_recorded_at).getTime()
      );

      // Get the most recent instance for current data
      const latestInstance = sortedInstances[sortedInstances.length - 1];

      // Get the earliest instance for first discovery date
      const firstInstance = sortedInstances[0];

      return {
        track_id: trackKey,
        name: latestInstance.track_name,
        playcount: latestInstance.play_count,
        artist_name: latestInstance.artist_name,
        album_name: latestInstance.album_name,
        cover_art: latestInstance.cover_art,
        position: latestInstance.position,
        day: latestInstance.top_track_at,
        stream_recorded_at: latestInstance.stream_recorded_at,
        first_added_at: firstInstance.first_added_at || firstInstance.stream_recorded_at,
        streamHistory: sortedInstances.map(inst => ({
          date: inst.stream_recorded_at,
          streams: inst.play_count
        }))
      };
    });

    // Process the tracks
    const processed = processTrackData(tracksData);
    setProcessedTracks(processed);

    // Reset to first page when data changes
    setCurrentPage(1);
  };

  // Sort tracks based on current sort settings
  const getSortedTracks = () => {
    if (!processedTracks || processedTracks.length === 0) return [];

    return [...processedTracks].sort((a, b) => {
      let comparison = 0;

      switch(sortBy) {
        case 'first_added':
          // Sort by first_added_at date
          const dateA = new Date(a.first_added_at || '').getTime();
          const dateB = new Date(b.first_added_at || '').getTime();
          comparison = dateA - dateB;
          break;

        case 'last_streamed':
          // Sort by most recent stream date
          const lastStreamA = a.streamHistory && a.streamHistory.length > 0
            ? new Date(a.streamHistory[a.streamHistory.length - 1].date).getTime()
            : 0;
          const lastStreamB = b.streamHistory && b.streamHistory.length > 0
            ? new Date(b.streamHistory[b.streamHistory.length - 1].date).getTime()
            : 0;
          comparison = lastStreamA - lastStreamB;
          break;

        case 'position':
          // Sort by position (undefined positions go to the end)
          if (a.position === undefined && b.position === undefined) {
            comparison = 0;
          } else if (a.position === undefined) {
            comparison = 1;
          } else if (b.position === undefined) {
            comparison = -1;
          } else {
            comparison = a.position - b.position;
          }
          break;

        case 'playcount':
          // Sort by play count
          comparison = (a.playcount || 0) - (b.playcount || 0);
          break;

        default:
          comparison = 0;
      }

      // Apply sort direction (asc/desc)
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Get current tracks for pagination
  const getCurrentTracks = () => {
    const sortedTracks = getSortedTracks();
    const indexOfLastTrack = currentPage * tracksPerPage;
    const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
    return sortedTracks.slice(indexOfFirstTrack, indexOfLastTrack);
  };

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      // Toggle direction if clicking the same option
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort option with default direction
      setSortBy(option);
      setSortDirection('desc'); // Default to descending for most cases
    }
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

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Change page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check if data has been refreshed today
  const isDataRefreshedToday = (): boolean => {
    if (rawProfileData.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];

    // Check if any track has been updated today
    return rawProfileData.some(item =>
      item.stream_recorded_at && item.stream_recorded_at.startsWith(today)
    );
  };

  // Load data on component mount
  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // Get paginated tracks
  const paginatedTracks = getCurrentTracks();
  const totalTracks = processedTracks.length;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  return (
    <div className="flex flex-col h-full">
      <Card className="bg-black/40 border-white/10 flex-grow flex flex-col overflow-hidden">
        {/* Header with sorting and refresh options */}
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div className="text-white font-medium">Track History</div>

            {/* Track count */}
            <div className="text-white/70 text-sm">
              {totalTracks} tracks
            </div>

            {/* Refresh button */}
            {isDataRefreshedToday() ? (
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

          {/* Sorting options */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              size="sm"
              variant={sortBy === 'first_added' ? 'default' : 'outline'}
              className={sortBy === 'first_added' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white/70'}
              onClick={() => handleSortChange('first_added')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              First Added {sortBy === 'first_added' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>

            <Button
              size="sm"
              variant={sortBy === 'last_streamed' ? 'default' : 'outline'}
              className={sortBy === 'last_streamed' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white/70'}
              onClick={() => handleSortChange('last_streamed')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Last Streamed {sortBy === 'last_streamed' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>

            <Button
              size="sm"
              variant={sortBy === 'position' ? 'default' : 'outline'}
              className={sortBy === 'position' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white/70'}
              onClick={() => handleSortChange('position')}
            >
              # Position {sortBy === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>

            <Button
              size="sm"
              variant={sortBy === 'playcount' ? 'default' : 'outline'}
              className={sortBy === 'playcount' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white/70'}
              onClick={() => handleSortChange('playcount')}
            >
              Plays {sortBy === 'playcount' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
          </div>
        </div>

        {/* Tracks list */}
        <div className="flex-grow overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-400">{error}</p>
            </div>
          ) : paginatedTracks.length > 0 ? (
            <div className="space-y-4">
              {paginatedTracks.map((track) => (
                <div key={track.track_id} className="relative">
                  {/* First added date badge */}
                  <div className="absolute top-2 right-2 bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    First added: {formatDate(track.first_added_at)}
                  </div>

                  <EnhancedTrackCard track={track} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/60">No tracks found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-white/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-white/90">
                Page {currentPage} of {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-white/70"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserTrackHistory;