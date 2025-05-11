// components/features/tracks/DashboardMiniChart.tsx
import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';
import { Track } from '@/types/api';
import { formatNumber } from '@/lib/utils/formatters';

interface DashboardMiniChartProps {
  track: Track;
  height?: string | number;
  showCompleteHistory?: boolean;
  onGrowthCalculated?: (growth: number) => void;
}

// Define types for chart data with labels
interface ChartDataPoint {
  date: string;
  displayDate: string;
  streams: number;
  isPreRelease: boolean;
}

// Define interface for stream history item
interface StreamHistoryItem {
  date: string;
  streams: number;
}

// Extended track interface to include streamHistory and first_added_at
interface TrackWithHistory extends Track {
  streamHistory?: StreamHistoryItem[];
  first_added_at?: string;
}

const DashboardMiniChart: React.FC<DashboardMiniChartProps> = ({
  track,
  height = '100%',
  showCompleteHistory = false,
  onGrowthCalculated
}) => {
  // Process stream history data
  const { chartData, canShowChart, maxStreams, firstListenedDate } = useMemo(() => {
    // Check if track has streamHistory property
    const trackWithHistory = track as TrackWithHistory;
    const hasStreamHistory = 'streamHistory' in track &&
                           Array.isArray(trackWithHistory.streamHistory) &&
                           (trackWithHistory.streamHistory?.length ?? 0) > 0;

    if (!hasStreamHistory) {
      return {
        chartData: [] as ChartDataPoint[],
        canShowChart: false,
        maxStreams: 0,
        firstListenedDate: null
      };
    }

    // Get the date when user first listened to the track
    const firstListenedDate = trackWithHistory.first_added_at ?
      new Date(trackWithHistory.first_added_at) : null;

    // Get stream history
    const streamHistory = trackWithHistory.streamHistory ?? [];

    // Sort by date
    const sortedHistory = [...streamHistory]
      .filter(item => item && item.date && typeof item.streams !== 'undefined')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // If there's no data, return empty state
    if (sortedHistory.length === 0) {
      return {
        chartData: [] as ChartDataPoint[],
        canShowChart: false,
        maxStreams: 0,
        firstListenedDate
      };
    }

    // Calculate max streams for visualization
    const maxStreams = Math.max(...sortedHistory.map(item => item.streams));

    // Generate chart data points
    const chartData: ChartDataPoint[] = sortedHistory.map(item => {
      const itemDate = new Date(item.date);

      // Check if this date is before first listened date
      const isPreRelease = firstListenedDate ?
        itemDate.getTime() < firstListenedDate.getTime() : false;

      // Format date for display
      const displayDate = itemDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return {
        date: item.date,
        displayDate,
        streams: item.streams,
        isPreRelease
      };
    });

    return {
      chartData,
      canShowChart: chartData.length > 0,
      maxStreams,
      firstListenedDate
    };
  }, [track]);

  // If we can't show a chart, return a simple message
  if (!canShowChart) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-xs text-white/50 text-center p-1">
          No streaming data available
        </div>
      </div>
    );
  }

  // Interface for tooltip props
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: ChartDataPoint;
    }>;
  }

  // Custom tooltip to show stream count
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 px-2 py-1 rounded text-xs border border-white/10">
          <p className="text-white/90">{data.displayDate}</p>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-emerald-400 font-medium">
              {formatNumber(data.streams)} streams
            </p>
            {data.isPreRelease && (
              <p className="text-yellow-400 text-xs">
                Before first listen
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full" style={{ minHeight: '40px', minWidth: '100px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <YAxis
            domain={[0, maxStreams * 1.1]}
            hide={true}
          />
          <XAxis dataKey="displayDate" hide={true} />
          <Tooltip content={<CustomTooltip />}/>

          {/* Line for all stream data */}
          <Line
            type="monotone"
            dataKey="streams"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 1, fill: "#10b981" }}
            isAnimationActive={false}
            strokeDasharray={(datum) => datum.isPreRelease ? "5 5" : ""}
          />

          {/* Marker for first listened date */}
          {firstListenedDate && (
            <Line
              type="monotone"
              dataKey="streams"
              stroke="#10b981"
              strokeWidth={0}
              dot={(props) => {
                const date = new Date(props.payload.date);
                if (firstListenedDate &&
                    date.getTime() === firstListenedDate.getTime()) {
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={5}
                      stroke="#ffffff"
                      strokeWidth={2}
                      fill="#10b981"
                    />
                  );
                }
                return null;
              }}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardMiniChart;