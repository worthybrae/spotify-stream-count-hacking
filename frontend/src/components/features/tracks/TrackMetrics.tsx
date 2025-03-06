import React from 'react';
import { Play, DollarSign, Calendar } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';
import { Track } from '@/types/api';

interface TrackMetricsProps {
  playcount: number;
  revenue: number;
  track: Track; // Added track to get the streamHistory
}

// Component to display track metrics (streams and revenue)
const TrackMetrics: React.FC<TrackMetricsProps> = ({ 
  playcount, 
  revenue,
  track
}) => {
  // Get most recent date from stream history
  const lastStreamDate = track.streamHistory && track.streamHistory.length > 0
    ? new Date(track.streamHistory[track.streamHistory.length - 1].date).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex flex-col items-center bg-black/30 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2 text-green-400">
          <Play className="h-5 w-5 text-green-400 fill-green-400/30" />
          <span className="text-base font-semibold">{formatNumber(playcount)}</span>
        </div>
        <span className="text-[10px] text-white/50 mt-1">Total Streams</span>
      </div>
      
      <div className="flex flex-col items-center bg-black/30 px-4 py-2 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-400">
          <DollarSign className="h-5 w-5 text-yellow-400" />
          <span className="text-base font-semibold">{formatNumber(revenue)}</span>
        </div>
        <span className="text-[10px] text-white/50 mt-1">Revenue</span>
      </div>
      
      <div className="flex flex-col items-center bg-black/30 px-4 py-2 rounded-lg ml-auto">
        <div className="flex items-center gap-2 text-blue-400">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium text-white/90">Updated</span>
        </div>
        <span className="text-[10px] text-white/50">{lastStreamDate}</span>
      </div>
    </div>
  );
};

export default TrackMetrics;