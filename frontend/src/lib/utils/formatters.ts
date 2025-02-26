// Assuming this file would be at @/lib/utils/formatters.ts

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
  return num.toString();
};

// Format date from ISO string to human readable format
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
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