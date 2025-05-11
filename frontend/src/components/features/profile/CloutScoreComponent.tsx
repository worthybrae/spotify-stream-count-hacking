import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, Award, Info } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchUserProfile } from '@/lib/api/userProfileApi';
import { UserProfileResponseItem } from '@/types/userProfile';

interface SimplifiedCloutComponentProps {
  userId: string;
}

// Type for daily clout data
interface DailyCloutData {
  date: string;
  formattedDate: string;
  dailyClout: number;
  cumulativeClout: number;
}

const SimplifiedCloutComponent: React.FC<SimplifiedCloutComponentProps> = ({ userId }) => {
  // State for clout data
  const [cloutData, setCloutData] = useState<DailyCloutData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClout, setTotalClout] = useState<number>(0);
  const [recentGrowth, setRecentGrowth] = useState<number>(0);

  // Load data and calculate cumulative clout
  useEffect(() => {
    const loadCloutData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user profile data
        const profileData = await fetchUserProfile(userId);

        // Process the data to calculate daily and cumulative clout
        const calculatedCloutData = calculateCumulativeClout(profileData);
        setCloutData(calculatedCloutData);

        // Calculate total clout (most recent cumulative value)
        if (calculatedCloutData.length > 0) {
          setTotalClout(calculatedCloutData[calculatedCloutData.length - 1].cumulativeClout);

          // Calculate recent growth
          if (calculatedCloutData.length >= 2) {
            const current = calculatedCloutData[calculatedCloutData.length - 1].cumulativeClout;

            // If we have at least 7 days of data, use last 7 days for growth
            if (calculatedCloutData.length >= 7) {
              const previous = calculatedCloutData[calculatedCloutData.length - 7].cumulativeClout;
              const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
              setRecentGrowth(growth);
            } else {
              // Otherwise use first day to latest for growth
              const first = calculatedCloutData[0].cumulativeClout;
              const growth = first > 0 ? ((current - first) / first) * 100 : 0;
              setRecentGrowth(growth);
            }
          }
        }
      } catch (err) {
        console.error('Error loading clout data:', err);
        setError('Failed to load clout data');
      } finally {
        setLoading(false);
      }
    };

    loadCloutData();
  }, [userId]);

  /**
   * Clout calculation: stream growth from when song was first added
   * Formula: (current date streams / first date added streams) - 1
   */
  const calculateTrackClout = (track: UserProfileResponseItem): number => {
    // Current streams
    const currentStreams = track.play_count || 0;

    // Check if we have stream history to find the first tracked stream count
    let firstStreamCount = 0;

    // Use the first_added_at date to find when the track was first added
    if (track.first_added_at && track.stream_recorded_at && track.play_count) {
      // If the current record is the first one (same date), use that as first stream count
      if (track.first_added_at === track.stream_recorded_at) {
        firstStreamCount = track.play_count;
      }
      // Otherwise, we should ideally look through stream history to find first count
      // But for now, assume it was 1 less than current for simplicity
      else {
        // Ensure we have at least 1 for first stream count, never 0
        firstStreamCount = Math.max(1, track.play_count - 1);
      }
    } else {
      // Fallback if we don't have dates: assume first stream count was 1
      firstStreamCount = 1;
    }

    // Ensure first stream count is never 0 or greater than current streams
    firstStreamCount = Math.max(1, Math.min(currentStreams, firstStreamCount));

    // If there are no current streams or they equal first streams, no growth
    if (currentStreams <= 0 || currentStreams <= firstStreamCount) return 0;

    // Calculate growth exactly as specified: (current / first) - 1
    return ((currentStreams / firstStreamCount) - 1)*100;
  };

  /**
   * Calculate cumulative clout over time
   */
  const calculateCumulativeClout = (data: UserProfileResponseItem[]): DailyCloutData[] => {
    if (!data || data.length === 0) {
      return [];
    }

    // Group data by top_track_at date
    const groupedByDate = data.reduce((acc: Record<string, UserProfileResponseItem[]>, item) => {
      if (!item.top_track_at) return acc;

      const dateKey = item.top_track_at;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {});

    // Sort dates chronologically
    const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Calculate daily scores and accumulate for running total
    let cumulativeClout = 0;
    const cloutOverTime = sortedDates.map(date => {
      const tracksForDate = groupedByDate[date];

      // Sum up clout for all tracks on this date
      const dailyClout = tracksForDate.reduce((sum, track) => {
        return sum + calculateTrackClout(track);
      }, 0);

      // Add to running total
      cumulativeClout += dailyClout;

      // Format date for display
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return {
        date,
        formattedDate,
        dailyClout: dailyClout,
        cumulativeClout: cumulativeClout
      };
    });

    return cloutOverTime;
  };

  // Format a number with commas (e.g., 1,234)
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
  };

  return (
    <Card className="bg-black/40 border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Award className="h-6 w-6 text-blue-400 mr-2" />
          <h3 className="text-white text-xl font-medium">Clout Score</h3>
        </div>

        <div className="flex items-center text-xs bg-black/40 rounded-lg px-3 py-1">
          <Info className="h-4 w-4 text-blue-400 mr-1" />
          <span className="text-white/70">Stream growth since first discovery</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-red-400">{error}</p>
        </div>
      ) : cloutData.length > 0 ? (
        <>
          {/* Total clout score and growth */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="text-5xl font-bold text-white mb-2">
                {formatNumber(totalClout)}
              </div>
              <div className="text-blue-400 text-lg font-medium">
                Total Growth Points
              </div>
            </div>

            {/* Growth indicator */}
            {recentGrowth > 0 && (
              <div className="bg-blue-900/40 text-blue-400 rounded-lg px-4 py-2 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span className="text-lg font-medium">+{recentGrowth.toFixed(1)}%</span>
                <span className="text-sm ml-1 text-white/70">
                  {cloutData.length >= 7 ? 'last 7 days' : 'since first day'}
                </span>
              </div>
            )}
          </div>

          {/* Cumulative Chart */}
          <div className="h-64 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cloutData}
                margin={{ top: 5, right: 5, bottom: 25, left: 5 }}
              >
                <defs>
                  <linearGradient id="colorClout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

                <XAxis
                  dataKey="formattedDate"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={cloutData.length > 30 ? Math.ceil(cloutData.length / 10) : 0}
                  minTickGap={10}
                />

                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatNumber(value)}
                  width={50}
                />

                <Tooltip
                  cursor={{ stroke: '#ffffff', strokeWidth: 1, opacity: 0.1 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-black/80 p-3 rounded border border-white/10">
                          <p className="text-white text-sm font-medium">{data.formattedDate}</p>
                          <p className="text-blue-400 text-sm mt-2">
                            <strong>Daily:</strong> {formatNumber(data.dailyClout)} points
                          </p>
                          <p className="text-blue-400 text-sm font-bold mt-1">
                            <strong>Total:</strong> {formatNumber(data.cumulativeClout)} points
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="cumulativeClout"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClout)"
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 1, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-between mt-6 text-sm text-white/70">
            <div>First Tracked: {cloutData[0]?.formattedDate}</div>
            <div>Latest: {cloutData[cloutData.length - 1]?.formattedDate}</div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-48">
          <p className="text-white/60">No stream growth data available</p>
        </div>
      )}
    </Card>
  );
};

export default SimplifiedCloutComponent;