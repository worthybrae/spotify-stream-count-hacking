import React from 'react';
import { Track, StreamCount } from '@/types/api';
import { LineChart, Line } from 'recharts';
import { Flame, Play, DollarSign } from 'lucide-react';
import { SearchResult } from '@/types/search';
import _ from 'lodash';

interface TrackCardsProps {
    tracks: Track[];
    streamHistory: StreamCount[];
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
  <div className={`px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2 ${className}`}>
    {icon}
    <p className="text-sm font-medium text-white">{value}</p>
  </div>
);

const MiniChart: React.FC<{ data: StreamCount[] }> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="w-24 h-12">
      <LineChart width={96} height={48} data={sortedData}>
        <Line
          type="monotone"
          dataKey="playcount"
          stroke="currentColor"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </div>
  );
};

const TrackCards = ({ tracks, streamHistory, onTrackSelect }: TrackCardsProps) => {
  const calculateRevenue = (streams: number) => streams * 0.004;

  const totalStreams = tracks.reduce((sum, track) => sum + track.playcount, 0);
  const totalRevenue = calculateRevenue(totalStreams);

  const getTrackHistory = (trackId: string) => {
    return streamHistory.filter(h => h.track_id === trackId);
  };

  // Aggregate all stream data by day
  const aggregatedStreamHistory = React.useMemo(() => {
    // First group by truncated date (remove time component)
    const groupedByDay = _.groupBy(streamHistory, (item) => {
      const date = new Date(item.timestamp);
      return date.toISOString().split('T')[0];
    });

    // Sum playcounts for each day
    const dailyTotals = Object.entries(groupedByDay).map(([date, streams]) => ({
      timestamp: date,
      playcount: _.sumBy(streams, 'playcount'),
      track_id: 'total'
    }));

    // Sort by date
    return _.sortBy(dailyTotals, 'timestamp');
  }, [streamHistory]);

  return (
    <div className="mt-6">
      <div className="space-y-2 max-h-[calc(100vh-480px)] overflow-y-auto">
        {tracks.map((track) => {
          const revenue = calculateRevenue(track.playcount);
          const trackHistory = getTrackHistory(track.track_id);
          const isViral = track.playcount > 10000000; // 10M streams threshold
          
          return (
            <div
              key={track.track_id}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all cursor-pointer group"
              onClick={() => onTrackSelect?.(track)}
            >
              <div className="flex items-center gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{track.name}</p>
                    {isViral && <Flame className="h-5 w-5 text-orange-500" />}
                  </div>
                  <p className="text-xs text-white/60">{track.artist_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <MetricBadge 
                    icon={<Play className="h-4 w-4 text-green-400" />}
                    value={formatNumber(track.playcount)}
                  />
                  <MetricBadge 
                    icon={<DollarSign className="h-4 w-4 text-yellow-400" />}
                    value={formatNumber(revenue)}
                  />
                  <div className="text-green-400 transition-opacity group-hover:opacity-75">
                    <MiniChart data={trackHistory} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all">
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Total</p>
            <p className="text-xs text-white/60">All Tracks</p>
          </div>
          <div className="flex items-center gap-3">
            <MetricBadge 
              icon={<Play className="h-4 w-4 text-green-400" />}
              value={formatNumber(totalStreams)}
            />
            <MetricBadge 
              icon={<DollarSign className="h-4 w-4 text-yellow-400" />}
              value={formatNumber(totalRevenue)}
            />
            <div className="text-green-400">
              <MiniChart data={aggregatedStreamHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCards;