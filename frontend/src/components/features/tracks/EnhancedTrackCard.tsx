// components/features/tracks/EnhancedTrackCard.tsx
import React, { useState, useEffect } from 'react';
import { Track } from '@/types/api';
import { formatNumber, formatRevenue, calculateRevenue } from '@/lib/utils/formatters';
import UpdatedMiniStreamChart from './UpdatedMiniStreamChart';
import { TrendingUp, Play, DollarSign } from 'lucide-react';

// Extended Track interface with position property
interface ExtendedTrack extends Track {
  position?: number;
  day?: string;
  stream_recorded_at?: string;
  streamHistory?: Array<{
    date: string;
    streams: number;
  }>;
  clout_points?: number;
  cover_art?: string;
}

interface EnhancedTrackCardProps {
  track: ExtendedTrack;
  onClick?: () => void;
}

const EnhancedTrackCard: React.FC<EnhancedTrackCardProps> = ({ track, onClick }) => {
  // Calculate revenue
  const revenue = calculateRevenue(track.playcount || 0);

  // Calculate growth percentage
  const [growth, setGrowth] = useState<number | null>(null);
  const [hasWeeklyData, setHasWeeklyData] = useState(false);

  // Filter and check for valid stream history data
  useEffect(() => {
    // Use backend-calculated percentage change if available
    if (track.pct_change !== undefined) {
      setGrowth(track.pct_change);
      setHasWeeklyData(track.pct_change !== 0); // Show data if there's any change
      return;
    }

    // Fallback to frontend calculation if pct_change is not available
    // Check if track has stream history
    if (track.streamHistory && Array.isArray(track.streamHistory) && track.streamHistory.length > 0) {
      const history = track.streamHistory;

      // Sort by date
      const sortedHistory = [...history].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Filter to last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const last7DaysData = sortedHistory.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= sevenDaysAgo && itemDate <= today;
      });

      // Only show data and calculate growth if we have recent data
      if (last7DaysData.length >= 1) {
        setHasWeeklyData(true);

        // Calculate growth from first point to last point
        if (last7DaysData.length >= 2) {
          const firstPoint = last7DaysData[0];
          const lastPoint = last7DaysData[last7DaysData.length - 1];

          if (firstPoint.streams > 0) {
            const growthPercent = ((lastPoint.streams - firstPoint.streams) / firstPoint.streams) * 100;
            setGrowth(growthPercent);
          } else {
            setGrowth(0);
          }
        } else {
          setGrowth(null);
        }
      } else {
        setHasWeeklyData(false);
        setGrowth(null);
      }
    } else {
      // Fallback to track.day if streamHistory isn't available
      if (track.day) {
        // setFormattedDate(new Date(track.day).toLocaleDateString('en-US', {
        //   month: 'short',
        //   day: 'numeric'
        // }));
      } else if (track.stream_recorded_at) {
        // setFormattedDate(new Date(track.stream_recorded_at).toLocaleDateString('en-US', {
        //   month: 'short',
        //   day: 'numeric'
        // }));
      }

      setHasWeeklyData(false);
      setGrowth(null);
    }
  }, [track]);

  return (
    <div
      className={`rounded-lg ${track.position && track.position <= 3 ? 'bg-black/40' : 'bg-black/20'} hover:bg-black/30 transition-all border ${track.position && track.position <= 3 ? 'border-white/20' : 'border-white/5'} p-4 relative`}
      onClick={onClick}
    >
      {/* Position badge - only show if position is available */}
      {track.position && (
        <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full ${track.position <= 3 ? 'bg-yellow-600' : 'bg-black/60'} border border-white/20 flex items-center justify-center z-10`}>
          <span className="text-white text-xs font-semibold">#{track.position}</span>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center">
        {/* Album cover and Track name - 30% */}
        <div className="flex-none w-[30%] min-w-0 flex items-center">
          {/* Album cover */}
          <div className="flex-none mr-3">
            <img
              src={track.cover_art || 'https://placehold.co/60x60/3d3d3d/white?text=Album'}
              alt={track.album_name || 'Album cover'}
              className="w-12 h-12 object-cover rounded-md"
            />
          </div>

          {/* Track info */}
          <div className="min-w-0">
            <h3 className="text-base font-medium text-white truncate">{track.name}</h3>
            <p className="text-sm text-white/70 truncate">{track.artist_name}</p>
          </div>
        </div>

        {/* Stream chart - 30% */}
        <div className="flex-none w-[30%] h-16 px-2">
          {hasWeeklyData ? (
            <div className="h-full">
              <UpdatedMiniStreamChart track={track} height={48} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-xs">
              No recent data
            </div>
          )}
        </div>

        {/* Metrics - 40% */}
        <div className="flex-none w-[40%] flex items-center">
          <div className="w-full flex justify-between space-x-3 px-1">
            {/* Streams - width: 25% */}
            <div className="bg-emerald-950/60 rounded-lg shadow-inner py-2 px-3 flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <Play className="h-3 w-3" />
                <span>Streams</span>
              </div>
              <div className="text-white font-medium">
                {formatNumber(track.playcount || 0)}
              </div>
            </div>

            {/* 7d Growth - width: 25% */}
            <div className="bg-indigo-950/60 rounded-lg shadow-inner py-2 px-3 flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-indigo-400 text-xs font-medium whitespace-nowrap">
                <TrendingUp className="h-3 w-3" />
                <span>7d Growth</span>
              </div>
              <div className="text-white font-medium">
                {hasWeeklyData && growth !== null ? (
                  <span>{growth.toFixed(1)}%</span>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>

            {/* Revenue - width: 25% */}
            <div className="bg-amber-950/60 rounded-lg shadow-inner py-2 px-3 flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                <DollarSign className="h-3 w-3" />
                <span>Revenue</span>
              </div>
              <div className="text-white font-medium">
                ${formatRevenue(revenue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col">
        {/* Track info and chart in top row */}
        <div className="flex mb-3">
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
            <h3 className="text-base font-medium text-white mb-1 truncate">{track.name}</h3>
            <p className="text-sm text-white/70 truncate">{track.artist_name}</p>
          </div>
        </div>

        {/* Stream chart */}
        <div className="mb-3">
          {hasWeeklyData ? (
            <div className="h-16">
              <UpdatedMiniStreamChart track={track} height={48} />
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-white/40 text-xs">
              No recent data
            </div>
          )}
        </div>

        {/* Metrics in grid layout */}
        <div className="grid grid-cols-3 gap-2">
          {/* Streams */}
          <div className="bg-emerald-950/60 rounded-lg shadow-inner py-2 px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <Play className="h-3 w-3" />
              <span>Streams</span>
            </div>
            <div className="text-white font-medium text-sm">
              {formatNumber(track.playcount || 0)}
            </div>
          </div>

          {/* 7d Growth */}
          <div className="bg-indigo-950/60 rounded-lg shadow-inner py-2 px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 text-indigo-400 text-xs font-medium whitespace-nowrap">
              <TrendingUp className="h-3 w-3" />
              <span>7d</span>
            </div>
            <div className="text-white font-medium text-sm">
              {hasWeeklyData && growth !== null ? (
                <span>{growth.toFixed(1)}%</span>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-amber-950/60 rounded-lg shadow-inner py-2 px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
              <DollarSign className="h-3 w-3" />
              <span>Rev</span>
            </div>
            <div className="text-white font-medium text-sm">
              ${formatRevenue(revenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTrackCard;