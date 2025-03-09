import React, { useMemo } from 'react';
import { Play, DollarSign, CalendarSync } from 'lucide-react';
import { formatNumber, calculateRevenue } from '@/lib/utils/formatters';
import { AlbumInfo, GroupedTrack } from '@/types/api';
import MiniStreamChart from './MiniStreamChart';

interface TrackCardProps {
  track: GroupedTrack;
  selectedAlbum?: AlbumInfo;
  onClick?: () => void;
}

// Get the most recent date from stream history
const getLastStreamDate = (streamHistory: Array<{date: string, streams: number}> | undefined): string => {
  if (!streamHistory || streamHistory.length === 0) return 'Unknown';
  
  // Sort by date to ensure we get the most recent
  const sortedHistory = [...streamHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Return the most recent date formatted
  const lastDate = new Date(sortedHistory[sortedHistory.length - 1].date);
  return `${lastDate.toLocaleDateString()}`;
};

// Component for an individual track card
const TrackCard: React.FC<TrackCardProps> = ({ track, onClick }) => {
  // Calculate regular metrics
  const revenue = calculateRevenue(track.playcount || 0);
  
  // Get the last updated date
  const lastStreamDate = useMemo(() => 
    getLastStreamDate(track.streamHistory),
    [track.streamHistory]
  );
  
  // Helper to check if the track has weekly stream data
  const hasWeeklyData = useMemo(() => {
    if (!track.streamHistory || track.streamHistory.length < 2) return false;
    return true;
  }, [track.streamHistory]);

  return (
    <div
      className="p-3 rounded-lg bg-black/40 hover:bg-black/70 transition-all cursor-pointer mb-3 border border-white/5"
      onClick={onClick}
    >
      {/* Desktop layout (remains unchanged) */}
      <div className="hidden sm:flex items-center">
        {/* Left column - Track name and update info */}
        <div className="w-1/4 mr-2">
          <h3 className="text-base font-medium text-white mb-1 truncate">{track.name}</h3>
          <div className="flex items-center text-xs text-white/60">
          <CalendarSync className="h-3 w-3 text-emerald-400 mr-1" />
          <span className='text-emerald-400'>{lastStreamDate}</span>
          </div>
        </div>
        
        {/* Middle column - Chart (reduced width) */}
        <div className="w-1/3 mx-2">
          {hasWeeklyData ? (
            <div className="h-12">
              <div>
                <MiniStreamChart track={track} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>7d ago</span>
                <span>now</span>
              </div>
            </div>
          ) : (
            <div className="h-12 flex items-center justify-center text-gray-500 text-xs">
              No data
            </div>
          )}
        </div>
        
        {/* Right column - Metrics (increased width) */}
        <div className="flex space-x-3 w-5/12 ml-2">
          {/* Streams */}
          <div className="bg-emerald-900/40 rounded-md px-3 py-2 flex flex-col flex-1">
            <div className="flex items-center">
              <Play className="h-3 w-3 text-emerald-400 mr-1" />
              <span className="text-emerald-400 text-xs">Streams</span>
            </div>
            <span className="text-white text-sm font-medium mt-1">
              {formatNumber(track.playcount || 0)}
            </span>
          </div>
          
          {/* Revenue */}
          <div className="bg-amber-900/40 rounded-md px-3 py-2 flex flex-col flex-1 ">
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 text-amber-400 mr-1" />
              <span className="text-amber-400 text-xs">Revenue</span>
            </div>
            <span className="text-white text-sm font-medium mt-1">
              ${formatNumber(revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile layout (updated as requested) */}
      <div className="flex flex-col sm:hidden">
        {/* Top row - Track title and chart side by side */}
        <div className="flex mb-2">
          {/* Left side - Track title and date */}
          <div className="w-1/2 pr-2">
            <h3 className="text-base font-medium text-white truncate">{track.name}</h3>
            <div className="text-xs text-white/60 flex items-center">
                <CalendarSync className="h-3 w-3 text-emerald-400 mr-1" />
                <span className='text-emerald-400'>{lastStreamDate}</span>
            </div>
          </div>
          
          {/* Right side - Chart */}
          <div className="w-1/2">
            {hasWeeklyData ? (
              <div>
                <div className="relative h-8"> {/* Taller height for mobile for better visualization */}
                  <MiniStreamChart track={track} />
                </div>
                {/* Hide x-axis labels on mobile for more chart space */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>7d ago</span>
                  <span>now</span>
                </div>
              </div>
            ) : (
              <div className="h-14 flex items-center justify-center text-gray-500 text-xs">
                No data
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom row - Streams and Revenue buttons */}
        <div className="flex space-x-3">
          {/* Streams */}
          <div className="bg-emerald-900/40 rounded-md px-3 py-2 flex flex-col flex-1">
            <div className="flex items-center">
              <Play className="h-3 w-3 text-emerald-400 mr-1" />
              <span className="text-emerald-400 text-xs">Streams</span>
            </div>
            <span className="text-white text-sm font-medium mt-1">
              {formatNumber(track.playcount || 0)}
            </span>
          </div>
          
          {/* Revenue */}
          <div className="bg-amber-900/40 rounded-md px-3 py-2 flex flex-col flex-1">
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 text-amber-400 mr-1" />
              <span className="text-amber-400 text-xs">Revenue</span>
            </div>
            <span className="text-white text-sm font-medium mt-1">
              ${formatNumber(revenue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;