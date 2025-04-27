import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
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

const UpdatedMiniStreamChart: React.FC<MiniStreamChartProps> = ({
  track,
  height = '100%',
  onGrowthCalculated
}) => {
  // Process stream history data with strict date filtering
  const { chartData, canShowChart, growthPercentage } = useMemo(() => {
    // Check if track has streamHistory property
    const hasStreamHistory = 'streamHistory' in track &&
                           Array.isArray((track as any).streamHistory) &&
                           (track as any).streamHistory.length > 0;

    if (!hasStreamHistory) {
      return {
        chartData: [] as ChartDataPoint[],
        canShowChart: false,
        growthPercentage: 0
      };
    }

    // Get stream history and filter to last 7 days
    const streamHistory = (track as any).streamHistory;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // First filter for valid data points, then for recent dates
    const validData = streamHistory
      .filter((item: any) => item && item.date && typeof item.streams !== 'undefined')
      .filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= sevenDaysAgo && itemDate <= today;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Need at least 2 data points to show the chart
    if (validData.length < 2) {
      return {
        chartData: [] as ChartDataPoint[],
        canShowChart: false,
        growthPercentage: 0
      };
    }

    // Calculate growth percentage
    let growthPercentage = 0;
    if (validData.length >= 2) {
      const firstPoint = validData[0];
      const lastPoint = validData[validData.length - 1];

      if (firstPoint.streams > 0) {
        growthPercentage = ((lastPoint.streams - firstPoint.streams) / firstPoint.streams) * 100;
      }
    }

    // Generate chart data points from the filtered data
    const chartData: ChartDataPoint[] = [];

    // Start from index 1 to calculate differences between days
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
      growthPercentage
    };
  }, [track]);

  // Pass growth percentage to parent component if callback is provided
  React.useEffect(() => {
    if (onGrowthCalculated && typeof growthPercentage === 'number') {
      onGrowthCalculated(growthPercentage);
    }
  }, [growthPercentage, onGrowthCalculated]);

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

  // Calculate dynamic Y-axis domain with aggressive scaling to emphasize trends
  const { yAxisDomain } = useMemo(() => {
    // Find min and max values
    const values = chartData.map(data => data.dailyStreams);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // Calculate the range of values
    const range = maxValue - minValue;

    // If we have very small values, provide a minimum size
    if (maxValue < 10) {
      return {
        yAxisDomain: [0, 10],
      };
    }

    // For nearly flat lines, create an artificial domain to show some movement
    if (range < maxValue * 0.1) {
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const artificialMin = Math.max(0, avgValue * 0.5);
      const artificialMax = avgValue * 1.5;

      return {
        yAxisDomain: [artificialMin, artificialMax],
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
      yAxisDomain: [min, max],
    };
  }, [chartData]);

  // Custom tooltip to show both daily and total streams
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 px-2 py-1 rounded text-xs border border-white/10">
          <p className="text-white/90">{new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-emerald-400 font-medium">+{formatNumber(data.dailyStreams)} new streams</p>
            <p className="text-white/80">{formatNumber(data.totalStreams)} total streams</p>
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