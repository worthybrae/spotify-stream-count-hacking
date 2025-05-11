// components/features/tracks/DashboardTrackCard.tsx
import React from 'react';
import { Track } from '@/types/api';
import { formatNumber } from '@/lib/utils/formatters';
import DashboardMiniChart from './DashboardMiniChart';
import { Star, Play } from 'lucide-react';

// Extended Track interface
interface ExtendedTrack extends Track {
  position?: number;
  day?: string;
  stream_recorded_at?: string;
  first_added_at?: string;
  streamHistory?: Array<{
    date: string;
    streams: number;
  }>;
  clout_points?: number;
}

interface DashboardTrackCardProps {
  track: ExtendedTrack;
  onClick?: () => void;
  index: number;
}

const DashboardTrackCard: React.FC<DashboardTrackCardProps> = ({
  track,
  onClick,
  index
}) => {
  // Format the first added date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div
      className="rounded-lg bg-black/20 hover:bg-black/30 transition-all border border-white/5 p-4 relative"
      onClick={onClick}
    >
      {/* Position indicator */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 border border-white/20 flex items-center justify-center z-10">
        <span className="text-white text-xs font-semibold">#{index + 1}</span>
      </div>

      <div className="flex items-start">
        {/* Album cover */}
        <div className="flex-none mr-3">
          <img
            src={track.cover_art || 'https://placehold.co/60x60/3d3d3d/white?text=Album'}
            alt={track.album_name || 'Album cover'}
            className="w-12 h-12 object-cover rounded-md"
          />
        </div>

        {/* Track info */}
        <div className="flex-grow min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{track.name}</h3>
          <p className="text-xs text-white/70 truncate">{track.artist_name}</p>
          <div className="text-xs text-white/50 mt-1">
            First listened: {formatDate(track.first_added_at)}
          </div>
        </div>
      </div>

      {/* Mini chart showing complete history */}
      <div className="mt-3 h-16">
        <DashboardMiniChart
          track={track}
          height={64}
          showCompleteHistory={true}
        />
      </div>

      {/* Metrics: clout and total streams only */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {/* Clout Score */}
        <div className="bg-blue-950/60 rounded-lg shadow-inner py-2 px-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-blue-400 text-xs font-medium">
            <Star className="h-3 w-3" />
            <span>Clout</span>
          </div>
          <div className="text-white font-medium text-sm">
            {track.clout_points ? track.clout_points.toFixed(1) : '0.0'}
          </div>
        </div>

        {/* Total Streams */}
        <div className="bg-emerald-950/60 rounded-lg shadow-inner py-2 px-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <Play className="h-3 w-3" />
            <span>Streams</span>
          </div>
          <div className="text-white font-medium text-sm">
            {formatNumber(track.playcount || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTrackCard;