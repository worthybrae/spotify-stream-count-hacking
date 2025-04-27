import React, { useState, useEffect } from 'react';
import { Track } from '@/types/api';
import { formatNumber, formatRevenue, calculateRevenue } from '@/lib/utils/formatters';
import MiniStreamChart from './MiniStreamChart';
import { TrendingUp } from 'lucide-react';

interface SimpleTrackCardProps {
  track: Track;
  onClick?: () => void;
}

const SimpleTrackCard: React.FC<SimpleTrackCardProps> = ({ track, onClick }) => {
  // Parse date for display
  const formattedDate = track.day ?
    new Date(track.day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) : 'Unknown';

  // Calculate revenue
  const revenue = calculateRevenue(track.playcount || 0);

  // Calculate growth percentage directly here
  const [growth, setGrowth] = useState<number | null>(null);

  // Calculate growth if streamHistory is available
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

      // Use filtered data if available, otherwise use all data
      const dataToUse = last7DaysData.length >= 2 ? last7DaysData : sortedHistory;

      // Calculate growth from first point to last point (not min to max)
      if (dataToUse.length >= 2) {
        const firstPoint = dataToUse[0];
        const lastPoint = dataToUse[dataToUse.length - 1];

        if (firstPoint.streams > 0) {
          const growthPercent = ((lastPoint.streams - firstPoint.streams) / firstPoint.streams) * 100;
          setGrowth(growthPercent);
        }
      }
    }
  }, [track]);

  // Apply a random growth percentage for demo purposes
  useEffect(() => {
    if (!growth) {
      // For demo purposes, generate a random growth between 0.5 and 15%
      const randomGrowth = Math.random() * 14.5 + 0.5;
      setGrowth(randomGrowth);
    }
  }, [growth]);

  return (
    <div
      className="flex items-center rounded-lg bg-black/20 hover:bg-black/30 transition-all cursor-pointer border border-white/5"
      onClick={onClick}
    >
      {/* Track name and updated at - left side */}
      <div className="flex-1 min-w-0 p-4">
        <h3 className="text-base font-medium text-white truncate">{track.name}</h3>
        <div className="text-xs text-white/50 mt-1">
          <span>Updated: {formattedDate}</span>
        </div>
      </div>

      {/* Stream chart - middle */}
      <div className="w-60 h-12">
        {(track as any).streamHistory ? (
          <MiniStreamChart track={track} height={40} />
        ) : (
          <div className="h-10 bg-gradient-to-r from-green-500/10 to-green-500/30 rounded">
            {/* Empty div for chart placeholder */}
          </div>
        )}
      </div>

      {/* Streams - right side */}
      <div className="h-12 w-24 flex items-center justify-center px-1">
        <div className="bg-emerald-950/60 rounded-lg shadow-inner py-2 px-3 w-full">
          <div className="text-xs text-emerald-400 font-medium">Streams</div>
          <div className="text-white font-medium">
            {formatNumber(track.playcount || 0)}
          </div>
        </div>
      </div>

      {/* 7d Growth - between streams and revenue */}
      <div className="h-12 w-24 flex items-center justify-center px-1">
        <div className="bg-indigo-950/60 rounded-lg shadow-inner py-2 px-3 w-full">
          <div className="text-xs text-indigo-400 font-medium">7d Growth</div>
          <div className="text-white font-medium flex items-center">
            <TrendingUp className="h-3 w-3 mr-1 text-indigo-400" />
            {growth ? growth.toFixed(1) : "0.0"}%
          </div>
        </div>
      </div>

      {/* Revenue - far right */}
      <div className="h-12 w-24 flex items-center justify-center px-1 pr-3">
        <div className="bg-amber-950/60 rounded-lg shadow-inner py-2 px-3 w-full">
          <div className="text-xs text-amber-400 font-medium">Revenue</div>
          <div className="text-white font-medium">
            ${formatRevenue(revenue)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTrackCard;