// components/features/profile/CheckInTracker.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '@/lib/utils/formatters';
import { useAuth } from '@/contexts/AuthContext';

interface CheckInTrackerProps {
  userId: string;
  onCheckInComplete?: () => void;
}

const CheckInTracker: React.FC<CheckInTrackerProps> = ({ userId, onCheckInComplete }) => {
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { spotifyToken } = useAuth();
  
  // Generate dates for the last 7 days
  const getLast7Days = () => {
    const dates: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };
  
  const last7Days = getLast7Days();
  
  // Format date to match API format (YYYY-MM-DD)
  const formatDateForComparison = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Check if a date is in the check-in dates
  const isCheckedIn = (date: Date): boolean => {
    const formattedDate = formatDateForComparison(date);
    return checkInDates.includes(formattedDate);
  };
  
  // Check if today is already checked in
  const isTodayCheckedIn = (): boolean => {
    return isCheckedIn(new Date());
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
    } catch (err) {
      console.error('Error fetching check-in data:', err);
      setError('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle check-in
  const handleCheckIn = async () => {
    if (!spotifyToken) {
      setError('You need to be logged in to check in');
      return;
    }
    
    setCheckingIn(true);
    setError(null);
    
    try {
      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
        },
      });
      
      await api.get(`/tracks/${userId}`, {
        params: {
          access_token: spotifyToken,
          force: true
        }
      });
      
      // Refresh check-in data
      await fetchCheckInData();
      
      // Notify parent component
      if (onCheckInComplete) {
        onCheckInComplete();
      }
    } catch (err) {
      console.error('Error checking in:', err);
      setError('Failed to check in');
    } finally {
      setCheckingIn(false);
    }
  };
  
  // Load check-in data on component mount
  useEffect(() => {
    if (userId) {
      fetchCheckInData();
    }
  }, [userId]);
  
  return (
    <Card className="p-4 bg-black/40 border-white/10">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Your Check-ins</h3>
          {!loading && !isTodayCheckedIn() && (
            <Button 
              onClick={handleCheckIn}
              disabled={checkingIn}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {checkingIn ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking in...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Check in today
                </>
              )}
            </Button>
          )}
        </div>
        
        {error && (
          <div className="text-red-400 text-xs">{error}</div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              {last7Days.map((date, index) => {
                const checked = isCheckedIn(date);
                const isToday = formatDateForComparison(date) === formatDateForComparison(new Date());
                
                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center"
                    title={`${formatDate(date.toISOString())}: ${checked ? 'Checked in' : 'No check-in'}`}
                  >
                    <div 
                      className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-300 ${
                        checked 
                          ? 'bg-green-500/50 border border-green-500/70' 
                          : 'bg-red-500/20 border border-red-500/30'
                      } ${isToday ? 'ring-2 ring-white/30' : ''}`}
                    >
                      {checked && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-xs text-white/60 mt-1">
                      {date.toLocaleDateString(undefined, { weekday: 'short' }).substring(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="text-xs text-white/40 text-center">
              Check in daily to track your listening habits
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default CheckInTracker;