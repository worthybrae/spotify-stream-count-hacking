import React, { useMemo } from 'react';
import { Track } from '@/types/api';
import { Flame, Play, DollarSign, TrendingUp } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { formatNumber, calculateRevenue, calculateStreamsPerDay } from '@/lib/utils/formatters';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TrackCardsProps {
    tracks: Track[];
    selectedAlbum?: SearchResult; 
    onTrackSelect?: (track: Track) => void;
}

interface StreamData {
  date: string;
  streams: number;
}

const MetricBadge = ({ 
  icon, 
  value, 
  className = "" 
}: { 
  icon: React.ReactNode, 
  value: string, 
  className?: string 
}) => (
  <div className={`flex items-center gap-1 ${className}`}>
    {icon}
    <span className="text-sm font-medium">{value}</span>
  </div>
);

// Mini chart component
const MiniStreamChart = ({ track, releaseDate }: { track: Track, releaseDate?: string }) => {
  const streamData = useMemo(() => {
    // Generate some mock data for the chart based on release date
    // In a real app, this would come from the API
    if (!releaseDate) return [];
    
    const data: StreamData[] = [];
    const release = new Date(releaseDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - release.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate avg streams per day
    const avgStreamsPerDay = (track.playcount || 0) / diffDays;
    
    // Generate random-ish but somewhat realistic stream data
    let currentDate = new Date(release);
    let accumulatedStreams = 0;
    
    // Create 30 data points or less if the release is newer
    const numPoints = Math.min(30, diffDays);
    const step = diffDays / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      // Add some randomness to make it look realistic
      const dailyStreams = avgStreamsPerDay * (0.5 + Math.random());
      accumulatedStreams += dailyStreams;
      
      currentDate.setDate(currentDate.getDate() + step);
      data.push({
        date: currentDate.toISOString().split('T')[0],
        streams: Math.round(accumulatedStreams)
      });
    }
    
    return data;
  }, [track.playcount, releaseDate]);

  if (streamData.length === 0) return null;
  
  return (
    <div className="w-40 h-12 py-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={streamData}>
          <Line 
            type="monotone" 
            dataKey="streams" 
            stroke="#10b981" 
            strokeWidth={1.5} 
            dot={false} 
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const TrackCards: React.FC<TrackCardsProps> = ({ tracks, selectedAlbum, onTrackSelect }) => {
  // The hot threshold for tracks (average 1M streams per day)
  const HOT_THRESHOLD_PER_DAY = 1000000;

  return (
    <div className="mt-6">
      <div className="space-y-2 max-h-[calc(100vh-480px)] overflow-y-auto">
        {tracks.map((track) => {
          const revenue = calculateRevenue(track.playcount || 0);
          
          // Calculate streams per day
          const streamsPerDay = selectedAlbum 
            ? calculateStreamsPerDay(selectedAlbum.release_date, track.playcount || 0)
            : 0;
            
          // Determine if track is "hot" based on avg streams per day
          const isHot = streamsPerDay > HOT_THRESHOLD_PER_DAY;
          
          return (
            <div
              key={track.track_id}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all cursor-pointer group"
              onClick={() => onTrackSelect?.(track)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex items-center gap-2">
                    <div className="truncate max-w-[160px] group relative hover-scroll">
                      <p className="text-sm font-medium text-white truncate group-hover:text-clip">{track.name}</p>
                      {track.name.length > 20 && (
                        <div className="absolute left-0 top-0 hidden group-hover:block bg-black/80 rounded px-2 py-1 z-10 whitespace-nowrap max-w-xs">
                          {track.name}
                        </div>
                      )}
                    </div>
                    {isHot && <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" />}
                  </div>
                  {/* Show artist name only */}
                  {track.artist_name && (
                    <p className="text-xs text-white/60">{track.artist_name}</p>
                  )}
                </div>
                
                {/* Mini stream chart */}
        
                <MiniStreamChart track={track} releaseDate={selectedAlbum?.release_date} />
                
                <div className="flex-shrink-0 text-white bg-white/5 rounded-xl p-3 ml-4">
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
                    
                    <div className="h-4 w-px bg-white/10"></div>
                    
                    <div className="text-blue-400">
                      <MetricBadge 
                        icon={<TrendingUp className="h-4 w-4 text-blue-400" />}
                        value={`${formatNumber(streamsPerDay)}/d`}
                      />
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