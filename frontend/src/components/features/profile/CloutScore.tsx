import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, Clock, Award } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatters';

interface CloutScoreComponentProps {
  userId: string;
}

// Update interface to match actual API response format
interface CloutScoreData {
  current_score: number;
  trend_data: Array<{
    date: string;
    score: number;
  }>;
  growth_percentage: number;
  daily_growth_percentage: number; // Added 24hr growth percentage
  rank_percentile: number;
}

// Interface matching the actual API response
interface CloutApiResponse {
  user_id: string;
  clout_by_day: Array<{
    day: string;
    clout: number;
  }>;
}

const CloutScoreComponent: React.FC<CloutScoreComponentProps> = ({ userId }) => {
  const [scoreData, setScoreData] = useState<CloutScoreData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { spotifyToken } = useAuth();
  
  // Define level thresholds and names
  const getLevelInfo = (score: number) => {
    if (score >= 1000001) return { name: 'Diamond', color: 'text-blue-300', next: 10000000, progress: (score - 1000001) / 9000000 };
    if (score >= 100001) return { name: 'Platinum', color: 'text-indigo-300', next: 1000001, progress: (score - 100001) / 900000 };
    if (score >= 10001) return { name: 'Gold', color: 'text-yellow-400', next: 100001, progress: (score - 10001) / 90000 };
    if (score >= 1001) return { name: 'Silver', color: 'text-gray-300', next: 10001, progress: (score - 1001) / 9000 };
    return { name: 'Bronze', color: 'text-amber-600', next: 1001, progress: score / 1000 };
  };
  
  // Helper function to get growth indicator class
  const getGrowthIndicatorClass = (percentage: number) => {
    if (percentage > 10) return 'text-green-500';
    if (percentage > 0) return 'text-green-300';
    if (percentage === 0) return 'text-white/60';
    return 'text-red-400';
  };
  
  // Fetch clout score data
  const fetchCloutScoreData = async () => {
    console.log('Fetching clout data for user:', userId);
    console.log('Spotify token available:', !!spotifyToken);
    
    // Proceed even without spotifyToken - the API might not require it for this endpoint
    if (!userId) {
      console.log('No userId, cannot fetch clout data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });
      
      console.log(`Making API request to: ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/tracks/${userId}/clout`);
      
      // Call the correct endpoint (/clout instead of /clout-score)
      const response = await api.get<CloutApiResponse>(`/tracks/${userId}/clout`);
      
      console.log('API Response received:', response.data);
      
      if (response.data && response.data.clout_by_day && response.data.clout_by_day.length > 0) {
        // Transform API response to expected format
        const cloutByDay = response.data.clout_by_day;
        
        // Sort by date ascending
        const sortedClout = [...cloutByDay].sort((a, b) => 
          new Date(a.day).getTime() - new Date(b.day).getTime()
        );
        
        // Extract the latest score
        const latestScore = sortedClout[sortedClout.length - 1].clout;
        
        // Calculate weekly growth percentage (compare last two points if available)
        let growthPercentage = 0;
        if (sortedClout.length >= 2) {
          const previousScore = sortedClout[sortedClout.length - 2].clout;
          if (previousScore > 0) {
            growthPercentage = ((latestScore - previousScore) / previousScore) * 100;
          } else if (latestScore > 0) {
            growthPercentage = 100; // If previous was 0 and now it's positive
          }
        }
        
        // Calculate 24-hour growth percentage
        // For simplicity, assuming the last data point is today and the one before is yesterday
        let dailyGrowthPercentage = 0;
        if (sortedClout.length >= 2) {
          const yesterdayScore = sortedClout[sortedClout.length - 2].clout;
          if (yesterdayScore > 0) {
            dailyGrowthPercentage = ((latestScore - yesterdayScore) / yesterdayScore) * 100;
          } else if (latestScore > 0) {
            dailyGrowthPercentage = 100;
          }
        }
        
        // Format trend data for chart
        const trendData = sortedClout.map(item => ({
          date: item.day,
          score: item.clout
        }));
        
        // Estimate rank percentile (placeholder logic - adjust as needed)
        // This is just a placeholder calculation - you'd ideally get this from API
        const rankPercentile = Math.min(95, Math.max(5, (latestScore / 1000) * 80));
        
        setScoreData({
          current_score: latestScore,
          trend_data: trendData,
          growth_percentage: Number(growthPercentage.toFixed(1)),
          daily_growth_percentage: Number(dailyGrowthPercentage.toFixed(1)),
          rank_percentile: rankPercentile
        });
      } else {
        // If we have a response but no data points, create empty score data with zero values
        // This way we at least show the chart with zero values
        setScoreData({
          current_score: 0,
          trend_data: [{ date: new Date().toISOString().split('T')[0], score: 0 }],
          growth_percentage: 0,
          daily_growth_percentage: 0,
          rank_percentile: 5 // Lowest percentile
        });
      }
    } catch (err) {
      console.error('Error fetching clout score data:', err);
      setError('Failed to load streamclout score data');
    } finally {
      setLoading(false);
    }
  };
  
  // Format dates for chart display with daily changes
  const formatChartData = (data: Array<{date: string; score: number}> | undefined) => {
    if (!data) return [];
    
    // Sort by date ascending
    const sortedData = [...(data || [])].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate daily changes and format dates
    return sortedData.map((item, index) => {
      // Calculate the daily change if there's a previous day
      const dailyChange = index > 0 ? item.score - sortedData[index - 1].score : undefined;
      
      // Get day of week
      const date = new Date(item.date);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Calculate days ago for the first item (oldest)
      let daysAgoLabel = '';
      if (index === 0 && sortedData.length > 1) {
        const oldestDate = new Date(item.date);
        const newestDate = new Date(sortedData[sortedData.length - 1].date);
        const diffTime = Math.abs(newestDate.getTime() - oldestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysAgoLabel = `${diffDays} days ago`;
      }
      
      return {
        ...item,
        dayOfWeek,
        daysAgoLabel, 
        dailyChange,
        // Format date for display
        formattedDate: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      };
    });
  };
  
  // Load clout score data on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log('CloutScore component mounted, attempting to fetch data for user:', userId);
      console.log('Spotify token available:', !!spotifyToken);
      
      if (userId) {
        try {
          // Add a slight delay to ensure auth context is fully loaded
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchCloutScoreData();
          console.log('CloutScore data fetch completed');
        } catch (error) {
          console.error('Error in CloutScore useEffect:', error);
        }
      } else {
        setLoading(false);
        console.log('No userId available, not fetching clout data');
      }
    };
    
    loadData();
  }, [userId, spotifyToken]);
  
  // Prepare chart data
  const chartData = formatChartData(scoreData?.trend_data);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 p-2 rounded border border-white/10">
          <p className="text-white text-xs">{data.formattedDate}</p>
          <div className="mt-1">
            <p className="text-blue-400 text-xs font-semibold">
              {formatNumber(data.score)} points
            </p>
            {data.dailyChange !== undefined && (
              <p className={`text-xs ${data.dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.dailyChange >= 0 ? '+' : ''}{formatNumber(data.dailyChange)} that day
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="bg-black/40 border-white/10">
      <div className="p-4">
        <div className="flex-row items-center gap-2 mb-4">
          <h3 className="text-lg font-medium text-white">Score</h3>
          <p className="text-xs text-white/60">Learn how early you are to music trends</p>
        </div>
        
        {error && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : scoreData ? (
          <>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {/* Current Score Card */}
              <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-lg border border-white/10 flex items-center p-3">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white">{formatNumber(scoreData.current_score)}</div>
                  <div className="text-xs text-white/60">Clout</div>
                </div>
              </div>
              
              {/* Level Card */}
              <div className="relative bg-black/30 rounded-lg border border-white/10 p-3 overflow-hidden">
                {(() => {
                  const levelInfo = getLevelInfo(scoreData.current_score);
                  const progress = levelInfo.progress * 100;
                  
                  return (
                    <>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${progress}%` }}></div>
                      
                      <div className="flex items-center gap-1">
                        <Award className={`h-4 w-4 ${levelInfo.color}`} />
                        <div className={`text-lg font-bold ${levelInfo.color}`}>
                          {levelInfo.name}
                        </div>
                      </div>
                      <div className="text-xs text-white/60">
                        {Math.round(progress)}% to next
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {/* 24h Growth Card */}
              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <div className="flex items-center gap-1">
                  <Clock className={`h-4 w-4 ${getGrowthIndicatorClass(scoreData.daily_growth_percentage)}`} />
                  <div className={`text-lg font-bold ${getGrowthIndicatorClass(scoreData.daily_growth_percentage)}`}>
                    {scoreData.daily_growth_percentage > 0 ? '+' : ''}{scoreData.daily_growth_percentage}%
                  </div>
                </div>
                <div className="text-xs text-white/60">24h Growth</div>
              </div>
              
              {/* Weekly Growth Card */}
              <div className="bg-black/30 rounded-lg border border-white/10 p-3">
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-4 w-4 ${getGrowthIndicatorClass(scoreData.growth_percentage)}`} />
                  <div className={`text-lg font-bold ${getGrowthIndicatorClass(scoreData.growth_percentage)}`}>
                    {scoreData.growth_percentage > 0 ? '+' : ''}{scoreData.growth_percentage}%
                  </div>
                </div>
                <div className="text-xs text-white/60">Weekly Growth</div>
              </div>
            </div>
            
            {/* Score Trend Chart */}
            <div className="bg-black/30 p-4 rounded-lg border border-white/10">
              <div style={{ height: '300px' }}>
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 0, right: 15, left: 15, bottom: 25 }}>
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotoneX" 
                          dataKey="score" 
                          stroke="#4f46e5" 
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ stroke: '#4f46e5', fill: '#4f46e5', r: 5 }}
                          isAnimationActive={true}
                          animationDuration={1500}
                        />
                        {/* Label for the beginning of the period */}
                        {chartData.length > 1 && (
                          <text 
                            x={15} 
                            y="99%" 
                            fill="#ffffff99" 
                            fontSize={10}
                            textAnchor="start"
                          >
                            {chartData[0].daysAgoLabel}
                          </text>
                        )}
                        {/* Label for today */}
                        <text 
                          x="98%" 
                          y="97%" 
                          fill="#ffffff99" 
                          fontSize={10}
                          textAnchor="end"
                        >
                          Today
                        </text>
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/40 text-sm">
                    Not enough data to show trend
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-white/60">
            No streamclout score data available. Check in more regularly to generate a score.
          </div>
        )}
      </div>
    </Card>
  );
};

export default CloutScoreComponent;