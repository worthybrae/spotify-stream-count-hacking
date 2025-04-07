// components/features/tracks/TrackCards.tsx
import React, { useMemo } from 'react';
import { Track, AlbumInfo } from '@/types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';
import TrackCard from './TrackCard';

interface TrackCardsProps {
  tracks: Track[];
  selectedAlbum?: AlbumInfo | any; 
  onTrackSelect?: (track: Track) => void;
}

// Main TrackCards component - renders a list of track cards
const TrackCards: React.FC<TrackCardsProps> = ({ tracks, selectedAlbum, onTrackSelect }) => {
  // Process tracks to group by track_id with enhanced stream history handling
  const groupedTracks = useMemo(() => {
    // Make sure we have tracks to process
    if (!tracks || tracks.length === 0) {
      console.log('No tracks to process');
      return [];
    }
    
    console.log('Processing tracks for display:', tracks.length);
    
    // Check if any tracks have streamHistory already
    const hasStreamHistory = tracks.some(track => 
      (track as any).streamHistory && (track as any).streamHistory.length > 0
    );
    
    // If some tracks already have streamHistory, use them directly
    if (hasStreamHistory) {
      console.log('Some tracks already have stream history, using as is');
      return tracks;
    }
    
    // Process tracks through the processor to ensure they have stream history
    const processedTracks = processTrackData(tracks);
    console.log(`Processed ${processedTracks.length} tracks with stream history`);
    
    return processedTracks;
  }, [tracks]);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="text-sm font-semibold text-white/80">Tracks</h3>
        <span className="text-xs text-white/50">{groupedTracks.length} total</span>
      </div>
      
      {/* Track Cards Grid with better error handling */}
      <div className="space-y-2 pr-1 overflow-y-scroll" style={{ maxHeight: '450px' }}>
        {groupedTracks.length > 0 ? (
          groupedTracks.map((track) => (
            <TrackCard 
              key={track.track_id}
              track={track}
              selectedAlbum={selectedAlbum}
              onClick={() => onTrackSelect?.(track)}
            />
          ))
        ) : (
          <div className="text-center py-6 text-white/60">
            No tracks found for this album
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackCards;