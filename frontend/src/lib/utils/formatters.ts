// lib/utils/formatters.ts

// Format large numbers with k/M/B suffix
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toFixed(0);
};

// Format date from ISO string to human readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Format timestamp from ISO string to human readable format
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  
  // Format: "Mar 6, 2025, 14:23:45"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Calculate revenue based on Spotify's average payout rate
export const calculateRevenue = (streams: number): number => {
  // Spotify pays approximately $0.004 per stream on average
  const PAYOUT_RATE = 0.004;
  return streams * PAYOUT_RATE;
};

// Format revenue with $ sign and appropriate suffix
export const formatRevenue = (amount: number): string => {
  return formatNumber(amount);
};

// Calculate streams per day since release
export const calculateStreamsPerDay = (
  releaseDate: string, 
  totalStreams: number
): number => {
  const release = new Date(releaseDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - release.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  // Avoid division by zero and ensure at least 1 day
  return totalStreams / diffDays;
};

// Generate stream history data (for charts)
export const generateStreamHistory = (
  releaseDate: string,
  totalStreams: number,
  numPoints: number = 30
): Array<{ date: string; streams: number }> => {
  const release = new Date(releaseDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - release.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Determine actual number of points (can't have more points than days)
  const actualPoints = Math.min(numPoints, diffDays);
  
  // Calculate avg streams per day
  const avgStreamsPerDay = totalStreams / diffDays;
  
  // Generate realistic-looking stream data
  const data: Array<{ date: string; streams: number }> = [];
  let currentDate = new Date(release);
  let accumulatedStreams = 0;
  
  // Step size for date increments
  const step = diffDays / actualPoints;
  
  for (let i = 0; i < actualPoints; i++) {
    // Add some randomness to make it look realistic
    // Albums typically have higher streams when first released
    const dayFactor = Math.max(0.2, 1 - (i / actualPoints)); // Higher early on
    const randomFactor = 0.5 + Math.random();
    const dailyStreams = avgStreamsPerDay * dayFactor * randomFactor;
    
    accumulatedStreams += dailyStreams;
    
    // Increment date by step
    currentDate.setDate(currentDate.getDate() + step);
    
    data.push({
      date: currentDate.toISOString().split('T')[0],
      streams: Math.round(accumulatedStreams)
    });
  }
  
  return data;
};

/**
 * Calculate cumulative new streams for the past week
 * @param streamHistory Array of stream data points with date and streams
 * @returns Total number of new streams in the past week
 */
export const calculateWeeklyNewStreams = (
  streamHistory: Array<{date: string, streams: number}> | undefined
): number => {
  if (!streamHistory || streamHistory.length < 2) return 0;
  
  // Sort by date
  const sortedHistory = [...streamHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get only the last 8 data points (to calculate 7 days of changes)
  const recentData = sortedHistory.length > 8 
    ? sortedHistory.slice(-8) 
    : sortedHistory;
  
  // Need at least 2 points to calculate change
  if (recentData.length < 2) return 0;
  
  // Sum all new streams in the period
  let totalNewStreams = 0;
  for (let i = 1; i < recentData.length; i++) {
    const dailyNew = Math.max(0, recentData[i].streams - recentData[i-1].streams);
    totalNewStreams += dailyNew;
  }
  
  return totalNewStreams;
};

/**
 * Get cumulative stream data points for charting
 * @param streamHistory Array of stream data points with date and streams
 * @returns Array of data points with cumulative streams calculation
 */
export const getCumulativeStreamData = (
  streamHistory: Array<{date: string, streams: number}> | undefined
): Array<{date: string, dailyNew: number, cumulativeNew: number}> => {
  if (!streamHistory || streamHistory.length < 2) return [];
  
  // Sort by date
  const sortedHistory = [...streamHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get only the last 8 data points (to calculate 7 days of changes)
  const recentData = sortedHistory.length > 8 
    ? sortedHistory.slice(-8) 
    : sortedHistory;
  
  // Need at least 2 points to calculate change
  if (recentData.length < 2) return [];
  
  // Calculate daily new and cumulative new streams
  const chartData = [];
  let cumulativeNewStreams = 0;
  
  for (let i = 1; i < recentData.length; i++) {
    const dailyNew = Math.max(0, recentData[i].streams - recentData[i-1].streams);
    cumulativeNewStreams += dailyNew;
    
    chartData.push({
      date: recentData[i].date,
      dailyNew,
      cumulativeNew: cumulativeNewStreams
    });
  }
  
  return chartData;
};

/**
 * Calculate daily stream changes from cumulative stream data
 * @param chartData Array of data points with date and streams
 * @returns Array of data points with daily stream changes
 */
export const calculateDailyStreams = (
  chartData: Array<{date: string, streams: number}>
): Array<{date: string, streams: number}> => {
  return chartData.map((point, i, arr) => ({
    date: point.date,
    streams: i > 0 ? point.streams - arr[i-1].streams : point.streams
  }));
};