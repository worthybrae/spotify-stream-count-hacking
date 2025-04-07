// components/features/tracks/ExtendedTrackCard.tsx
import React, { useMemo } from 'react';
import { Play, DollarSign, Star } from 'lucide-react';
import { formatNumber, calculateRevenue } from '@/lib/utils/formatters';
import { GroupedTrack } from '@/types/api';
import MiniStreamChart from './MiniStreamChart';

// Define the clout history type to avoid repeating it
interface CloutHistoryItem {
  day: string;
  daily_clout: number;
  cumulative_clout: number;
}

// Extended interface to include clout history
interface ExtendedGroupedTrack extends GroupedTrack {
  clout_points?: number;
  isNew?: boolean;
  position?: number;
  cloutHistory?: CloutHistoryItem[]; // Added this property
}

interface ExtendedTrackCardProps {
  track: ExtendedGroupedTrack;
  onClick?: () => void;
}

// Component for an enhanced track card with cover art
const ExtendedTrackCard: React.FC<ExtendedTrackCardProps> = ({ track, onClick }) => {
  // Calculate regular metrics
  const revenue = calculateRevenue(track.playcount || 0);
  
  // Helper to check if the track has weekly stream data
  const hasWeeklyData = useMemo(() => {
    if (!track.streamHistory || track.streamHistory.length < 2) return false;
    return true;
  }, [track.streamHistory]);

  // Format clout points to 1 decimal place if available
  const formattedCloutPoints = useMemo(() => {
    if (track.clout_points === undefined || track.clout_points === null) return "0.0";
    return track.clout_points.toFixed(1);
  }, [track.clout_points]);

  // Default cover art if not available
  const coverArt = track.cover_art || 'https://placehold.co/80x80/3d3d3d/white?text=Album';

  return (
    <div
      className={`p-3 rounded-lg bg-black/40 hover:bg-black/70 transition-all cursor-pointer mb-3 border ${track.isNew ? 'border-blue-500/30' : 'border-white/5'} relative`}
      onClick={onClick}
    >
      {/* Position badge */}
      {track.position && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center z-10">
          <span className="text-white/80 text-xs font-semibold">#{track.position}</span>
        </div>
      )}
      
      {/* New badge - only show if isNew is true */}
      {track.isNew && (
        <div className="flex justify-end mb-1">
          <div className="bg-blue-500/20 text-blue-400 text-xs py-0.5 px-2 rounded-full inline-flex items-center">
            <Star className="h-3 w-3 mr-1" />
            New
          </div>
        </div>
      )}
      
      {/* Desktop layout */}
      <div className="hidden md:flex">
        {/* Album cover and track info */}
        <div className="flex items-center w-4/12">
          {/* Album cover */}
          <div className="flex items-center">
            <img 
              src={coverArt} 
              alt={track.album_name || 'Album cover'} 
              className="w-16 h-16 object-cover rounded-md mr-3"
            />
          </div>
          
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white mb-1 truncate">{track.name}</h3>
            <p className="text-sm text-white/70 truncate">{track.artist_name || 'Unknown Artist'}</p>
          </div>
        </div>
        
        {/* Charts section - extends slightly to the left */}
        <div className="w-3/12 px-3">
          <div className="h-16">
            {hasWeeklyData ? (
              <div className="h-12">
                <MiniStreamChart track={track} />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>7d ago</span>
                  <span>now</span>
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-gray-500 text-xs">
                Not enough data for charts
              </div>
            )}
          </div>
        </div>
        
        {/* Metrics */}
        <div className="flex space-x-3 w-5/12">
          {/* Streams */}
          <div className="bg-emerald-900/40 rounded-md px-3 py-2 flex flex-col flex-1">
            <div className="flex items-center">
              <Play className="h-3 w-3 text-emerald-400 mr-1" />
              <span className="text-emerald-400 text-xs">Streams</span>
            </div>
            <span className="text-white text-lg font-medium mt-1">
              {formatNumber(track.playcount || 0)}
            </span>
          </div>
          
          {/* Revenue */}
          <div className="bg-amber-900/40 rounded-md px-3 py-2 flex flex-col flex-1">
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 text-amber-400 mr-1" />
              <span className="text-amber-400 text-xs">Revenue</span>
            </div>
            <span className="text-white text-lg font-medium mt-1">
              ${formatNumber(revenue)}
            </span>
          </div>
          
          {/* Clout Points */}
          <div className="bg-blue-900/40 rounded-md px-3 py-2 flex flex-col flex-1">
            <div className="flex items-center">
              <Star className="h-3 w-3 text-blue-400 mr-1" />
              <span className="text-blue-400 text-xs">Clout</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-white text-lg font-medium">
                {formattedCloutPoints}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col md:hidden">
        {/* Track info and cover art in top row */}
        <div className="flex mb-3">
          {/* Album cover */}
          <div className="flex items-center">
            <img 
              src={coverArt} 
              alt={track.album_name || 'Album cover'} 
              className="w-14 h-14 object-cover rounded-md mr-3"
            />
          </div>
          
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-white mb-1 truncate">{track.name}</h3>
            <p className="text-sm text-white/70 truncate">{track.artist_name || 'Unknown Artist'}</p>
          </div>
        </div>
        
        {/* Chart in middle row - extends slightly to the left */}
        <div className="mb-3 -ml-2">
          {hasWeeklyData ? (
            <div>
              <div className="h-8">
                <MiniStreamChart track={track} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>7d ago</span>
                <span>now</span>
              </div>
            </div>
          ) : (
            <div className="h-8 mb-3 flex items-center justify-center text-gray-500 text-xs">
              Not enough history data
            </div>
          )}
        </div>
        
        {/* Metrics in bottom row */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streams */}
          <div className="bg-emerald-900/40 rounded-md px-3 py-2 flex flex-col">
            <div className="flex items-center">
              <Play className="h-3 w-3 text-emerald-400 mr-1" />
              <span className="text-emerald-400 text-xs">Streams</span>
            </div>
            <span className="text-white text-lg font-medium mt-1">
              {formatNumber(track.playcount || 0)}
            </span>
          </div>
          
          {/* Revenue */}
          <div className="bg-amber-900/40 rounded-md px-3 py-2 flex flex-col">
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 text-amber-400 mr-1" />
              <span className="text-amber-400 text-xs">Revenue</span>
            </div>
            <span className="text-white text-lg font-medium mt-1">
              ${formatNumber(revenue)}
            </span>
          </div>
          
          {/* Clout Points */}
          <div className="bg-blue-900/40 rounded-md px-3 py-2 flex flex-col">
            <div className="flex items-center">
              <Star className="h-3 w-3 text-blue-400 mr-1" />
              <span className="text-blue-400 text-xs">Clout</span>
            </div>
            <span className="text-white text-lg font-medium mt-1">
              {formattedCloutPoints}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtendedTrackCard;