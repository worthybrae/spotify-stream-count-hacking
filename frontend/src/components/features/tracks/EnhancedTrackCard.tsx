import React, { useState, useEffect } from 'react';
import { Track } from '@/types/api';
import { formatNumber, formatRevenue, calculateRevenue } from '@/lib/utils/formatters';
import MiniStreamChart from './MiniStreamChart';
import { TrendingUp, Play, DollarSign, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedTrackCardProps {
  track: Track;
  onClick?: () => void;
}

const EnhancedTrackCard: React.FC<EnhancedTrackCardProps> = ({ track, onClick }) => {
  // Parse date for display
  const formattedDate = track.day ?
    new Date(track.day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) : 'Unknown';

  // Calculate revenue
  const revenue = calculateRevenue(track.playcount || 0);

  // Calculate growth percentage
  const [growth, setGrowth] = useState<number | null>(null);
  const [hasWeeklyData, setHasWeeklyData] = useState(false);

  // Filter and check for valid stream history data
  useEffect(() => {
    if ((track as any).streamHistory && Array.isArray((track as any).streamHistory) && (track as any).streamHistory.length > 1) {
      const history = (track as any).streamHistory;

      // Sort by date
      const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter to last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const last7DaysData = sortedHistory.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= sevenDaysAgo && itemDate <= today;
      });

      // Only show data and calculate growth if we have recent data
      if (last7DaysData.length >= 2) {
        setHasWeeklyData(true);

        // Calculate growth from first point to last point
        const firstPoint = last7DaysData[0];
        const lastPoint = last7DaysData[last7DaysData.length - 1];

        if (firstPoint.streams > 0) {
          const growthPercent = ((lastPoint.streams - firstPoint.streams) / firstPoint.streams) * 100;
          setGrowth(growthPercent);
        } else {
          setGrowth(0);
        }
      } else {
        setHasWeeklyData(false);
        setGrowth(null);
      }
    } else {
      setHasWeeklyData(false);
      setGrowth(null);
    }
  }, [track]);

  return (
    <div
      className="rounded-lg bg-black/20 hover:bg-black/30 transition-all border border-white/5 p-4"
      onClick={onClick}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center">
        {/* Track name - 20% */}
        <div className="flex-none w-[20%] min-w-0 pr-2">
          <h3 className="text-base font-medium text-white truncate">{track.name}</h3>
          <div className="text-xs text-white/50 mt-1">
            <span>Updated: {formattedDate}</span>
          </div>
        </div>

        {/* Stream chart - 35% */}
        <div className="flex-none w-[35%] h-16 px-2">
          {hasWeeklyData ? (
            <div className="h-full">
              <MiniStreamChart track={track} height={48} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white/40 text-xs">
              No recent data
            </div>
          )}
        </div>

        {/* Metrics - 45% - increased from 40% */}
        <div className="flex-none w-[45%] flex items-center">
          <div className="w-full flex justify-between space-x-3 px-1">
            {/* Streams - width: 33% */}
            <div className="bg-emerald-950/60 rounded-lg shadow-inner py-2 px-3 flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <Play className="h-3 w-3" />
                <span>Streams</span>
              </div>
              <div className="text-white font-medium">
                {formatNumber(track.playcount || 0)}
              </div>
            </div>

            {/* 7d Growth - width: 33% - fixed to ensure text on one line */}
            <div className="bg-indigo-950/60 rounded-lg shadow-inner py-2 px-4 flex-1 flex flex-col items-center min-w-[90px]">
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

            {/* Revenue - width: 33% */}
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
          {/* Track name - 40% */}
          <div className="w-[40%] min-w-0 pr-2">
            <h3 className="text-base font-medium text-white truncate">{track.name}</h3>
            <div className="text-xs text-white/50 mt-1">
              <span>Updated: {formattedDate}</span>
            </div>
          </div>

          {/* Stream chart - 60% */}
          <div className="w-[60%] h-16">
            {hasWeeklyData ? (
              <div className="h-full">
                <MiniStreamChart track={track} height={48} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/40 text-xs">
                No recent data
              </div>
            )}
          </div>
        </div>

        {/* Buttons in bottom row */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Streams */}
          <div className="bg-emerald-950/60 rounded-lg shadow-inner py-2 px-2 flex flex-col items-center">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <Play className="h-3 w-3" />
              <span>Streams</span>
            </div>
            <div className="text-white font-medium">
              {formatNumber(track.playcount || 0)}
            </div>
          </div>

          {/* 7d Growth */}
          <div className="bg-indigo-950/60 rounded-lg shadow-inner py-2 px-2 flex flex-col items-center">
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

          {/* Revenue */}
          <div className="bg-amber-950/60 rounded-lg shadow-inner py-2 px-2 flex flex-col items-center">
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
  );
};

export default EnhancedTrackCard;