import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { GroupedTrack } from '@/types/api';
import { formatNumber } from '@/lib/utils/formatters';

interface MiniStreamChartProps {
  track: GroupedTrack;
}

// Define types for chart data with labels
interface ChartDataPoint {
  date: string;
  displayDate: string;
  dailyStreams: number; // Non-cumulative daily streams
  totalStreams: number; // Total cumulative streams for tooltips
}

// Mini chart component for track stream visualization
const MiniStreamChart: React.FC<MiniStreamChartProps> = ({ track }) => {
  // Process stream history data for the chart
  const { chartData, canShowChart } = useMemo(() => {
    // Make sure we have stream history data
    if (!track.streamHistory || track.streamHistory.length === 0) {
      return { 
        chartData: [] as ChartDataPoint[], 
        canShowChart: false
      };
    }
    
    // Filter and sort the data by date
    const validData = track.streamHistory
      .filter(item => item && item.date && item.streams !== undefined)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Need at least 2 points to draw a line
    if (validData.length < 2) {
      return { 
        chartData: [] as ChartDataPoint[], 
        canShowChart: false
      };
    }
    
    // Get the last 8 days of data (to calculate 7 days of daily changes)
    const recentData = validData.length > 8 
      ? validData.slice(-8) 
      : validData;
    
    // Calculate daily streams (non-cumulative)
    const chartData: ChartDataPoint[] = [];
    
    // Start from index 1 (second day) since we need to calculate differences
    for (let i = 1; i < recentData.length; i++) {
      const currentDay = recentData[i];
      const previousDay = recentData[i-1];
      
      // Calculate daily new streams (difference between consecutive days)
      const dailyStreams = Math.max(0, currentDay.streams - previousDay.streams);
      
      // Format display date as day of week (Mon, Tue, etc.)
      const displayDate = new Date(currentDay.date).toLocaleDateString('en-US', { 
        weekday: 'short'
      });
      
      chartData.push({
        date: currentDay.date, // Keep original date for reference
        displayDate,
        dailyStreams,
        totalStreams: currentDay.streams // Store total streams for the tooltip
      });
    }
    
    return { 
      chartData,
      canShowChart: chartData.length > 0
    };
  }, [track]);

  // Return empty div if no data
  if (!canShowChart) {
    return <div className="h-10"></div>;
  }
  
  // Calculate dynamic Y-axis domain with consistent +/- 2% padding
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
        yAxisDomain: [0, 10], // Set minimum domain size for very small values
        maxDailyStreams: maxValue,
        minDailyStreams: minValue
      };
    }
    
    // For nearly flat lines, create an artificial domain to show some movement
    // This is crucial for mobile where small changes appear as straight lines
    if (range < maxValue * 0.1) { // If range is less than 10% of max value
      // Create an artificial range centered around the average
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const artificialMin = avgValue * 0.8; // 20% below average
      const artificialMax = avgValue * 1.2; // 20% above average
      
      console.log('Using artificial domain for flat line chart:', [artificialMin, artificialMax]);
      
      return {
        yAxisDomain: [artificialMin, artificialMax],
        maxDailyStreams: maxValue,
        minDailyStreams: minValue,
        isArtificialDomain: true
      };
    }
    
    // For normal cases with sufficient variation, still be aggressive
    // for better mobile visualization
    let min = Math.max(0, minValue * 0.7); // Allow 30% space below min value
    
    // For mobile optimization, never let min be more than 60% of max
    // This ensures the chart doesn't appear too flat
    if (min > maxValue * 0.6) {
      min = maxValue * 0.6;
    }
    
    // Add padding to max
    const max = maxValue * 1.15; // 15% padding above max
    
    console.log('Using normal domain:', [min, max]);
    
    return {
      yAxisDomain: [min, max],
      maxDailyStreams: maxValue,
      minDailyStreams: minValue
    };
  }, [chartData]);
  
  // Custom tooltip to show both daily and total streams
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/60 px-2 py-1 rounded text-xs border border-white/10">
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

  // Render the chart with responsive height
  return (
    <div className="flex flex-col w-full">
      <div className="h-7 w-full ">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 1, right: 0, bottom: 1, left: 0 }}
            
          >
            {/* YAxis with dynamic domain */}
            <YAxis 
              domain={yAxisDomain}
              hide={true} // Hide the axis but use it for consistent scaling
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
    </div>
  );
};

export default MiniStreamChart;