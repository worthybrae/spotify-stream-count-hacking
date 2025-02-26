import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Track, StreamCount } from '@/types/api';
import { SearchResult } from '@/types/search';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Play, Music, Calendar } from 'lucide-react';
import _ from 'lodash';

interface AlbumStatsProps {
  album: SearchResult;
  tracks: Track[];
  streamHistory: StreamCount[];
}

// Format number with commas and K/M/B for thousands/millions/billions
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

// Format date from ISO string to readable format
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

export const AlbumStats: React.FC<AlbumStatsProps> = ({ album, tracks, streamHistory }) => {
  // Calculate total streams and revenue
  const totalStreams = useMemo(() => 
    tracks.reduce((sum, track) => sum + track.playcount, 0), 
    [tracks]
  );
  
  const totalRevenue = useMemo(() => 
    totalStreams * 0.004, 
    [totalStreams]
  );

  // Find the most popular track
  const mostPopularTrack = useMemo(() => {
    if (tracks.length === 0) return null;
    return _.maxBy(tracks, 'playcount');
  }, [tracks]);

  // Group stream history by date for chart
  const chartData = useMemo(() => {
    // Filter out entries without timestamp
    const validHistory = streamHistory.filter(item => item.timestamp);
    
    // Group by date and sum playcounts
    const groupedByDate = _.groupBy(validHistory, 
      item => item.timestamp!.substring(0, 10) // Group by YYYY-MM-DD
    );
    
    // Convert to array for chart
    return Object.entries(groupedByDate).map(([date, entries]) => ({
      date,
      plays: _.sumBy(entries, 'playcount'),
      formattedDate: formatDate(date)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [streamHistory]);
  
  // Calculate average streams per track
  const avgStreamsPerTrack = useMemo(() => 
    tracks.length > 0 ? totalStreams / tracks.length : 0,
    [totalStreams, tracks]
  );

  // Stat cards data
  const statCards = [
    {
      title: "Total Streams",
      value: formatNumber(totalStreams),
      icon: <Play className="h-5 w-5 text-green-400" />,
      color: "text-green-400"
    },
    {
      title: "Estimated Revenue",
      value: `$${formatNumber(totalRevenue)}`,
      icon: <TrendingUp className="h-5 w-5 text-yellow-400" />,
      color: "text-yellow-400"
    },
    {
      title: "Track Count", 
      value: tracks.length.toString(),
      icon: <Music className="h-5 w-5 text-blue-400" />,
      color: "text-blue-400"
    },
    {
      title: "Release Date",
      value: formatDate(album.release_date),
      icon: <Calendar className="h-5 w-5 text-purple-400" />,
      color: "text-purple-400"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-4 bg-white/5 hover:bg-white/8 transition-all">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                {stat.icon}
                <span className="text-xs text-white/60">{stat.title}</span>
              </div>
              <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Streams Chart */}
      {chartData.length > 0 && (
        <Card className="p-4 bg-white/5">
          <h3 className="text-sm font-medium text-white/60 mb-4">Stream History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="formattedDate"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(23,23,23,0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white' 
                  }}
                  formatter={(value: number) => [formatNumber(value), 'Streams']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#4ade80' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Most Popular Track */}
      {mostPopularTrack && (
        <Card className="p-4 bg-white/5">
          <h3 className="text-sm font-medium text-white/60 mb-4">Most Popular Track</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-white">{mostPopularTrack.name}</p>
              {mostPopularTrack.artist_name && (
                <p className="text-sm text-white/60">{mostPopularTrack.artist_name}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-green-400" />
                <span className="text-green-400 font-medium">{formatNumber(mostPopularTrack.playcount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium">
                  ${formatNumber(mostPopularTrack.playcount * 0.004)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Track Distribution */}
      {tracks.length > 0 && (
        <Card className="p-4 bg-white/5">
          <h3 className="text-sm font-medium text-white/60 mb-4">Track Analytics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-xs text-white/60 mb-1">Average Streams Per Track</p>
              <p className="text-lg font-medium text-white">{formatNumber(avgStreamsPerTrack)}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-xs text-white/60 mb-1">Viral Tracks (10M)</p>
              <p className="text-lg font-medium text-white">
                {tracks.filter(t => t.playcount > 10000000).length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AlbumStats;