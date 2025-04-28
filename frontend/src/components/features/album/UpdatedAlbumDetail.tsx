import React, { useMemo } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { Track } from '@/types/api';
import EnhancedTrackCard from '../tracks/EnhancedTrackCard';
import EnhancedAlbumSidebar from './EnhancedAlbumSidebar';
import { processTrackData } from '@/lib/utils/dataProcessors';

// Define interfaces for types
interface StreamHistoryItem {
  date: string;
  streams: number;
}

interface TrackWithHistory extends Track {
  streamHistory?: StreamHistoryItem[];
  hasRecentData?: boolean;
}

interface AlbumDetails {
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  cover_art: string;
  release_date: string;
}

interface AlbumDetailProps {
  selectedAlbum: SearchResult | null;
  tracks: Track[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
  onBackToSearch: () => void;
  albumDetails: AlbumDetails | null;
}

const UpdatedAlbumDetail: React.FC<AlbumDetailProps> = ({
  selectedAlbum,
  tracks,
  totalStreams,
  loading,
  error,
  onBackToSearch,
  albumDetails
}) => {
  // Initialize processed tracks and calculated total streams
  const { processedTracks, calculatedTotalStreams } = useMemo(() => {
    // Early return for empty tracks
    if (!tracks || tracks.length === 0) {
      return {
        processedTracks: [],
        calculatedTotalStreams: 0
      };
    }

    // First process tracks to ensure they have streamHistory
    let processed = tracks;

    // Check if tracks already have streamHistory
    const needsProcessing = !tracks.some(track => {
      const trackWithHistory = track as TrackWithHistory;
      return trackWithHistory.streamHistory &&
        Array.isArray(trackWithHistory.streamHistory) &&
        trackWithHistory.streamHistory.length > 0;
    });

    // Process tracks if needed
    if (needsProcessing) {
      processed = processTrackData(tracks) as TrackWithHistory[];
    }

    // Calculate the true total streams by finding max playcount for each track
    const totalCalcStreams = processed.reduce((sum, track) => sum + (track.playcount || 0), 0);

    // Check for tracks with recent data - but we won't store this in a separate variable
    // since it's not used elsewhere in the component
    processed = processed.map(track => {
      // Create a copy of the track
      const trackWithHistory = track as TrackWithHistory;
      const updatedTrack: TrackWithHistory = { ...track };

      // Check if track has valid stream history
      if (trackWithHistory.streamHistory && Array.isArray(trackWithHistory.streamHistory)) {
        // Get today and 7 days ago dates for filtering
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        // Filter stream history to last 7 days
        const recentHistory = trackWithHistory.streamHistory.filter((item: StreamHistoryItem) => {
          if (!item || !item.date) return false;
          const itemDate = new Date(item.date);
          return itemDate >= sevenDaysAgo && itemDate <= today;
        });

        // Only keep recent history if it exists
        if (recentHistory.length >= 1) {
          updatedTrack.streamHistory = recentHistory;
          updatedTrack.hasRecentData = true;
        } else {
          updatedTrack.hasRecentData = false;
        }
      } else {
        updatedTrack.hasRecentData = false;
      }

      return updatedTrack;
    });

    return {
      processedTracks: processed,
      calculatedTotalStreams: totalCalcStreams
    };
  }, [tracks]);

  // Use calculated total streams or fallback to provided total
  const actualTotalStreams = calculatedTotalStreams > 0 ? calculatedTotalStreams : totalStreams;

  // Return null if no selected album
  if (!selectedAlbum) return null;

  // Get album details from either source
  const album = albumDetails || selectedAlbum;

  return (
    <div className="w-full">
      <button
        onClick={onBackToSearch}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg text-red-300 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left side - Enhanced Album Sidebar - make it sticky */}
        <div className="lg:col-span-4 lg:sticky lg:top-16 self-start">
          <EnhancedAlbumSidebar
            album={album}
            tracks={processedTracks}
            totalStreams={actualTotalStreams}
          />
        </div>

        {/* Right side - Tracks */}
        <div className="lg:col-span-8">
          <div className="bg-black/30 rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-1">Album Details</h2>
            <p className="text-sm text-white/60 mb-6">Track daily stream counts for this album</p>

            {/* Loading state */}
            {loading ? (
              <div className="flex items-center justify-center h-32 mt-6">
                <Loader2 className="w-8 h-8 animate-spin text-white/40" />
              </div>
            ) : (
              <div>
                {processedTracks.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-white/80">Tracks</h3>
                      <span className="text-sm text-white/50">{processedTracks.length} total</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-16rem)] scrollbar-hide">
                      {processedTracks.map((track) => (
                        <EnhancedTrackCard
                          key={track.track_id}
                          track={track}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-white/60">
                    No tracks found for this album
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatedAlbumDetail;