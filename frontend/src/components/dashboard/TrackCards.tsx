import React from 'react';
import { Track } from '@/types/api';
import { Flame, Play, DollarSign } from 'lucide-react';
import { SearchResult } from '@/types/search';

interface TrackCardsProps {
    tracks: Track[];
    streamHistory?: any[]; // Not used but kept for compatibility
    selectedAlbum?: SearchResult; 
    onTrackSelect?: (track: Track) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'b';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const MetricBadge = ({ icon, value, className = "" }: { icon: React.ReactNode, value: string, className?: string }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    {icon}
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const TrackCards = ({ tracks, onTrackSelect }: TrackCardsProps) => {
  const calculateRevenue = (streams: number) => streams * 0.004;

  return (
    <div className="mt-6">
      <div className="space-y-2 max-h-[calc(100vh-480px)] overflow-y-auto">
        {tracks.map((track) => {
          const revenue = calculateRevenue(track.playcount || 0);
          const isViral = (track.playcount || 0) > 10000000; // 10M streams threshold
          
          return (
            <div
              key={track.track_id}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all cursor-pointer group"
              onClick={() => onTrackSelect?.(track)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{track.name}</p>
                    {isViral && <Flame className="h-5 w-5 text-orange-500" />}
                  </div>
                  {/* Handle optional artist_name */}
                  {track.artist_name && (
                    <p className="text-xs text-white/60">{track.artist_name}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-white bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-green-400">
                        <MetricBadge 
                          icon={<Play className="h-4 w-4 text-green-400" />}
                          value={formatNumber(track.playcount || 0)}
                        />
                      </div>
                      
                      <div className="h-4 w-px bg-white/10"></div>
                      
                      <div className="text-yellow-400">
                        <MetricBadge 
                          icon={<DollarSign className="h-4 w-4 text-yellow-400" />}
                          value={formatNumber(revenue)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackCards;