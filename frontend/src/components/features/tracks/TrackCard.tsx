// components/features/tracks/TrackCard.tsx
import React, { useMemo } from 'react';
import { Play, DollarSign, CalendarSync, Star } from 'lucide-react';
import { formatNumber, calculateRevenue } from '@/lib/utils/formatters';
import { AlbumInfo, GroupedTrack, Track } from '@/types/api';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// Define the clout history type to avoid repeating it
interface CloutHistoryItem {
  day: string;
  daily_clout: number;
  cumulative_clout: number;
}

interface ExtendedGroupedTrack extends GroupedTrack {
  clout_points?: number;
  isNew?: boolean;
  position?: number;
  cloutHistory?: CloutHistoryItem[];
}

interface TrackCardProps {
  track: ExtendedGroupedTrack | Track;
  selectedAlbum?: AlbumInfo | any;
  onClick?: () => void;
}

// Chart data point interface
interface ChartDataPoint {
  date: string;
  value: number;
  daily: number;
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
  
  // Get the last updated date - works with both TrackCard and ExtendedTrackCard
  const lastStreamDate = useMemo(() => {
    // Check if track has streamHistory property (for GroupedTrack)
    if ('streamHistory' in track && Array.isArray(track.streamHistory)) {
      return getLastStreamDate(track.streamHistory);
    }
    return 'Unknown';
  }, [track]);
  
  // Generate chart data from real stream history when available
  const chartData = useMemo(() => {
    // Check if we have stream history data
    const hasStreamHistory = 'streamHistory' in track && 
                           Array.isArray(track.streamHistory) && 
                           track.streamHistory.length >= 2;
    
    // If we have real stream history, use it
    if (hasStreamHistory) {
      const streamHistory = (track as GroupedTrack).streamHistory;
      
      // Sort history by date
      const sortedHistory = [...streamHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Create chart data points with daily increase values
      const result: ChartDataPoint[] = [];
      
      // Include first point
      result.push({
        date: sortedHistory[0].date,
        value: sortedHistory[0].streams,
        daily: Math.round(sortedHistory[0].streams * 0.1) // Initial daily is 10% of first day's value
      });
      
      // Add remaining points with calculated daily changes
      for (let i = 1; i < sortedHistory.length; i++) {
        const previousStreams = sortedHistory[i-1].streams;
        const currentStreams = sortedHistory[i].streams;
        const dailyIncrease = Math.max(0, currentStreams - previousStreams);
        
        result.push({
          date: sortedHistory[i].date,
          value: currentStreams,
          daily: dailyIncrease
        });
      }
      
      return result;
    }
    
    // Create baseline synthetic data for the chart if no real data
    const playcount = track.playcount || 100;
    const today = new Date();
    const result: ChartDataPoint[] = [];
    
    // Generate 7 points of synthetic data
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      
      // Create a realistic growth curve
      const growthFactor = 0.7 + ((0.3 / 6) * i);
      const streams = Math.round(playcount * growthFactor);
      
      // For the first point, use a baseline
      if (i === 0) {
        result.push({
          date: date.toISOString().split('T')[0],
          value: streams,
          daily: Math.round(streams * 0.1) // Initial daily value is 10% of first day's value
        });
      } else {
        // For subsequent points, calculate daily increase from previous
        const previousValue = result[i-1].value;
        const dailyIncrease = streams - previousValue;
        
        result.push({
          date: date.toISOString().split('T')[0],
          value: streams,
          daily: dailyIncrease
        });
      }
    }
    
    return result;
  }, [track]);

  // Get position and isNew properties if they exist
  const position = 'position' in track ? track.position : undefined;
  const isNew = 'isNew' in track ? track.isNew : false;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 px-2 py-1 rounded text-xs border border-white/20">
          <p className="text-white/90">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-emerald-400 font-medium">+{formatNumber(data.daily)} new streams</p>
            <p className="text-white/80">{formatNumber(data.value)} total streams</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`p-3 rounded-lg bg-black/40 hover:bg-black/70 transition-all cursor-pointer mb-3 border ${isNew ? 'border-blue-500/30' : 'border-white/5'} relative`}
      onClick={onClick}
    >
      {/* Position badge */}
      {position && (
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-black/80 border border-white/20 flex items-center justify-center z-10">
          <span className="text-white/80 text-xs font-semibold">#{position}</span>
        </div>
      )}
    
      {/* New badge - only show if isNew is true */}
      {isNew && (
        <div className="flex justify-end mb-1">
          <div className="bg-blue-500/20 text-blue-400 text-xs py-0.5 px-2 rounded-full inline-flex items-center">
            <Star className="h-3 w-3 mr-1" />
            New
          </div>
        </div>
      )}
      
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center">
        {/* Left column - Track name and update info */}
        <div className="w-3/12 mr-0">
          <h3 className="text-base font-medium text-white mb-1 truncate">{track.name}</h3>
          <div className="flex items-center text-xs text-white/60">
            <CalendarSync className="h-3 w-3 text-emerald-400 mr-1" />
            <span className='text-emerald-400'>{lastStreamDate}</span>
          </div>
        </div>
        
        {/* Middle column - Chart with tooltip */}
        <div className="w-3/12 -ml-2 mr-1">
          <div className="h-12">
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="daily"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>7d ago</span>
              <span>now</span>
            </div>
          </div>
        </div>
        
        {/* Right column - Metrics */}
        <div className="flex space-x-3 w-6/12 ml-2">
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

      {/* Mobile layout */}
      <div className="flex flex-col sm:hidden">
        {/* Top row - Track title and chart side by side */}
        <div className="flex mb-2">
          {/* Left side - Track title and date */}
          <div className="w-2/5 pr-1">
            <h3 className="text-base font-medium text-white truncate">{track.name}</h3>
            <div className="text-xs text-white/60 flex items-center">
                <CalendarSync className="h-3 w-3 text-emerald-400 mr-1" />
                <span className='text-emerald-400'>{lastStreamDate}</span>
            </div>
          </div>
          
          {/* Right side - Chart with tooltip */}
          <div className="w-3/5 -ml-2">
            <div className="h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="daily"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>7d ago</span>
              <span>now</span>
            </div>
          </div>
        </div>
        
        {/* Bottom row - Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streams */}
          <div className="bg-emerald-900/40 rounded-md px-2 py-2 flex flex-col">
            <div className="flex items-center">
              <Play className="h-3 w-3 text-emerald-400 mr-1" />
              <span className="text-emerald-400 text-xs">Streams</span>
            </div>
            <span className="text-white text-sm font-medium mt-1">
              {formatNumber(track.playcount || 0)}
            </span>
          </div>
          
          {/* Revenue */}
          <div className="bg-amber-900/40 rounded-md px-2 py-2 flex flex-col">
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