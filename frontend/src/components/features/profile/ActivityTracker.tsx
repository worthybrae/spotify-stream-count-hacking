// components/features/profile/ActivityTracker.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

interface ActivityTrackerProps {
  userId: string;
  onCheckInComplete?: () => void;
}

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ userId }) => {
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    streak: 0,
    activeCount: 0
  });
  
  // Format date to match API format (YYYY-MM-DD)
  const formatDateForComparison = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Check if a date is in the check-in dates
  const isCheckedIn = (date: Date): boolean => {
    const formattedDate = formatDateForComparison(date);
    return checkInDates.includes(formattedDate);
  };

  // Calculate stats
  const calculateStats = (dates: string[]) => {
    // Calculate streak (consecutive days leading up to today)
    let streak = 0;
    const today = formatDateForComparison(new Date());
    
    // Get dates in descending order (newest first)
    const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Check if today is checked in
    if (sortedDates.length > 0 && sortedDates[0] === today) {
      streak = 1;
      
      // Check previous days
      for (let i = 1; i < 30; i++) {
        const previousDate = new Date();
        previousDate.setDate(previousDate.getDate() - i);
        const formattedPreviousDate = formatDateForComparison(previousDate);
        
        if (dates.includes(formattedPreviousDate)) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    return {
      streak,
      activeCount: dates.length
    };
  };

  // Fetch check-in data
  const fetchCheckInData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });
      
      const response = await api.get(`/tracks/${userId}/check-ins`);
      setCheckInDates(response.data);
      
      // Calculate stats
      setStats(calculateStats(response.data));
    } catch (err) {
      console.error('Error fetching check-in data:', err);
      setError('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate last few days (just enough for the UI)
  const getVisibleDays = () => {
    const days: Date[] = [];
    // Get just the last 7 days to show in UI (most recent day first/left)
    for (let i = 0; i < 61; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i); // Most recent day (today) is first
      days.push(date);
    }
    return days;
  };
  
  // Load check-in data on component mount
  useEffect(() => {
    if (userId) {
      fetchCheckInData();
    }
  }, [userId]);
  
  const visibleDays = getVisibleDays();
  
  return (
    <Card className="bg-black/40 border-white/10">
      <div className="p-4">
        {/* Stats */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <p className="text-xs">
              <span className="text-yellow-400">Streak: </span>
              <span className="text-white">{stats.streak} days</span>
            </p>
            <p className="text-xs">
              <span className="text-blue-400">Active: </span>
              <span className="text-white">{stats.activeCount}/30 days</span>
            </p>
          </div>
        </div>
        
        {error && (
          <div className="text-red-400 text-xs mb-2">{error}</div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
          </div>
        ) : (
          <div className="flex items-center h-6 gap-1.5">
            {visibleDays.map((date, i) => (
              <div 
                key={i}
                className={`w-3 h-3 rounded-sm ${isCheckedIn(date) ? 'bg-blue-500' : 'bg-gray-700 border border-gray-600'}`}
                title={date.toLocaleDateString()}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityTracker;