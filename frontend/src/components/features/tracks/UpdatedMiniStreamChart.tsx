import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, ScatterChart, Scatter, XAxis, ScatterProps } from 'recharts';
import { Track } from '@/types/api';
import { formatNumber } from '@/lib/utils/formatters';

interface MiniStreamChartProps {
  track: Track;
  height?: string | number;
  onGrowthCalculated?: (growth: number) => void;
}

// Define types for chart data with labels
interface ChartDataPoint {
  date: string;
  displayDate: string;
  dailyStreams: number;
  totalStreams: number;
}

// Define interface for stream history item


// Extended track interface to include streamHistory


// Define interface for chart calculation result
interface ChartCalculationResult {
  chartData: ChartDataPoint[];
  canShowChart: boolean;
  growthPercentage: number;
  isSinglePoint: boolean;
}

const UpdatedMiniStreamChart: React.FC<MiniStreamChartProps> = ({
  track,
  height = '100%',
  onGrowthCalculated
}) => {
  // Process stream history data with strict date filtering
  const { chartData, canShowChart, growthPercentage, isSinglePoint } = useMemo<ChartCalculationResult>(() => {
    // Use backend-calculated percentage change if available
    let growthPercentage = 0;
    if (track.pct_change !== undefined) {
      growthPercentage = track.pct_change;
    }

    // If no stream history, can't show chart
    if (!track.streamHistory || track.streamHistory.length === 0) {
      return {
        chartData: [],
        canShowChart: false,
        growthPercentage,
        isSinglePoint: false
      };
    }

    // Sort stream history by date
    const sortedHistory = [...track.streamHistory].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Use all available data points instead of limiting to last 8
    const recentHistory = sortedHistory;

    // Filter out any data points with invalid values
    const validData = recentHistory.filter(item =>
      item.streams !== null &&
      item.streams !== undefined &&
      item.streams >= 0 &&
      item.date
    );

    // Need at least 1 point to show anything
    if (validData.length === 0) {
      return {
        chartData: [],
        canShowChart: false,
        growthPercentage,
        isSinglePoint: false
      };
    }

    const chartData: ChartDataPoint[] = [];

    // Special case: if we only have one data point
    if (validData.length === 1) {
      const singlePoint = validData[0];
      const displayDate = new Date(singlePoint.date).toLocaleDateString('en-US', {
        weekday: 'short'
      });

      chartData.push({
        date: singlePoint.date,
        displayDate,
        dailyStreams: singlePoint.streams,
        totalStreams: singlePoint.streams
      });

      return {
        chartData,
        canShowChart: true,
        growthPercentage,
        isSinglePoint: true
      };
    }

    // If we have multiple points, process them normally
    // Calculate growth percentage only if backend didn't provide it
    if (track.pct_change === undefined && validData.length >= 2) {
      const firstPoint = validData[0];
      const lastPoint = validData[validData.length - 1];

      if (firstPoint.streams > 0) {
        growthPercentage = ((lastPoint.streams - firstPoint.streams) / firstPoint.streams) * 100;
      }
    }

    // Add the first data point (it has no previous day, so show total streams as dailyStreams)
    const firstPoint = validData[0];
    const firstDisplayDate = new Date(firstPoint.date).toLocaleDateString('en-US', {
      weekday: 'short'
    });

    chartData.push({
      date: firstPoint.date,
      displayDate: firstDisplayDate,
      dailyStreams: firstPoint.streams, // For the first point, show total streams
      totalStreams: firstPoint.streams
    });

    // Process remaining points starting from index 1 to calculate differences between days
    for (let i = 1; i < validData.length; i++) {
      const currentDay = validData[i];
      const previousDay = validData[i-1];

      // Calculate daily new streams (difference between consecutive days)
      const dailyStreams = Math.max(0, currentDay.streams - previousDay.streams);

      // Format display date as day of week (Mon, Tue, etc.)
      const displayDate = new Date(currentDay.date).toLocaleDateString('en-US', {
        weekday: 'short'
      });

      chartData.push({
        date: currentDay.date,
        displayDate,
        dailyStreams,
        totalStreams: currentDay.streams
      });
    }

    return {
      chartData,
      canShowChart: chartData.length > 0,
      growthPercentage,
      isSinglePoint: validData.length === 1
    };
  }, [track]);

  // Pass growth percentage to parent component if callback is provided
  React.useEffect(() => {
    if (onGrowthCalculated && typeof growthPercentage === 'number') {
      onGrowthCalculated(growthPercentage);
    }
  }, [growthPercentage, onGrowthCalculated]);

  // Calculate dynamic Y-axis domain with aggressive scaling to emphasize trends
  const { yAxisDomain } = useMemo(() => {
    // If we can't show a chart, return a default domain
    if (!canShowChart || chartData.length === 0) {
      return {
        yAxisDomain: [0, 10] as [number, number],
      };
    }

    // Find min and max values
    const values = chartData.map((data: ChartDataPoint) => data.dailyStreams);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // For single point, create a domain that centers the point
    if (isSinglePoint) {
      const value = values[0];
      return {
        yAxisDomain: [Math.max(0, value * 0.5), value * 1.5] as [number, number],
      };
    }

    // Calculate the range of values
    const range = maxValue - minValue;

    // If we have very small values, provide a minimum size
    if (maxValue < 10) {
      return {
        yAxisDomain: [0, 10] as [number, number],
      };
    }

    // For nearly flat lines, create an artificial domain to show some movement
    if (range < maxValue * 0.1) {
      const avgValue = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      const artificialMin = Math.max(0, avgValue * 0.5);
      const artificialMax = avgValue * 1.5;

      return {
        yAxisDomain: [artificialMin, artificialMax] as [number, number],
      };
    }

    // For normal cases with sufficient variation
    let min = Math.max(0, minValue * 0.7);

    // Ensure min is never more than 60% of max for better visualization
    if (min > maxValue * 0.6) {
      min = maxValue * 0.6;
    }

    // Add padding to max
    const max = maxValue * 1.15;

    return {
      yAxisDomain: [min, max] as [number, number],
    };
  }, [chartData, canShowChart, isSinglePoint]);

  // If we can't show a chart, return a simple message
  if (!canShowChart) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-xs text-white/50 text-center p-1">
          No data from past 7 days
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

  // Custom tooltip to show both daily and total streams
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 px-2 py-1 rounded text-xs border border-white/10">
          <p className="text-white/90">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-emerald-400 font-medium">
              {isSinglePoint
                ? `${formatNumber(data.dailyStreams)} streams`
                : `+${formatNumber(data.dailyStreams)} new streams`}
            </p>
            <p className="text-white/80">{formatNumber(data.totalStreams)} total streams</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // For single point, we'll use a ScatterChart instead of LineChart
  if (isSinglePoint) {
    return (
      <div className="w-full h-full" style={{ minHeight: '40px', minWidth: '100px' }}>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <YAxis
              domain={yAxisDomain}
              hide={true}
            />
            <XAxis dataKey="date" hide={true} />
            <Tooltip content={<CustomTooltip />}/>
            <Scatter
              data={chartData}
              fill="#10b981"
              line={false}
              shape={(props: ScatterProps) => {
                const { cx, cy } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#10b981"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                );
              }}
              isAnimationActive={false}
              name="dailyStreams"
              dataKey="dailyStreams"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // For multiple points, use LineChart as before
  return (
    <div className="w-full h-full" style={{ minHeight: '40px', minWidth: '100px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <YAxis
            domain={yAxisDomain}
            hide={true}
          />
          <Tooltip content={<CustomTooltip />}/>
          <Line
            type="monotone"
            dataKey="dailyStreams"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 1, fill: "#10b981" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UpdatedMiniStreamChart;