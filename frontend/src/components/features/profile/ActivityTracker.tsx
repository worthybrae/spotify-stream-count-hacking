// components/features/profile/MinimalActivityTracker.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Calendar, Flame } from 'lucide-react';
import { fetchUserProfile } from '@/lib/api/userProfileApi';
import { extractActivityDates, calculateActivityStats } from '@/lib/utils/cloutScoreCalculator';

interface MinimalActivityTrackerProps {
  userId: string;
}

const MinimalActivityTracker: React.FC<MinimalActivityTrackerProps> = ({ userId }) => {
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [stats, setStats] = useState<{ streak: number; activeDays: number }>({ streak: 0, activeDays: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load activity data
  useEffect(() => {
    const loadActivityData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user profile data
        const profileData = await fetchUserProfile(userId);

        // Extract activity dates
        const dates = extractActivityDates(profileData);
        setActivityDates(dates);

        // Calculate activity stats
        const activityStats = calculateActivityStats(dates);
        setStats(activityStats);
      } catch (err) {
        console.error('Error loading activity data:', err);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    loadActivityData();
  }, [userId]);

  // Generate last 7 days for the display
  const getLast7Days = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }

    return days;
  };

  // Check if a date exists in activity dates
  const isActiveDay = (date: Date): boolean => {
    const formattedDate = date.toISOString().split('T')[0];
    return activityDates.includes(formattedDate);
  };

  // Format day name (e.g., "Mon")
  const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Format day of month (e.g., "15")
  const formatDayNumber = (date: Date): string => {
    return date.getDate().toString();
  };

  const last7Days = getLast7Days();

  return (
    <Card className="bg-black/40 border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-purple-400 mr-2" />
          <h3 className="text-white text-sm font-medium">Activity</h3>
        </div>
        {stats.streak > 0 && (
          <div className="flex items-center bg-purple-900/30 px-2 py-1 rounded-md">
            <Flame className="h-3 w-3 text-orange-400 mr-1" />
            <span className="text-xs text-white">{stats.streak} day streak</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-16">
          <Loader2 className="h-5 w-5 animate-spin text-white/60" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-16">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      ) : (
        <div className="flex justify-between mt-2">
          {last7Days.map((day, index) => {
            const active = isActiveDay(day);
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div key={`day-${index}`} className="flex flex-col items-center">
                <div className="text-xs text-white/60 mb-1">{formatDayName(day)}</div>
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    active
                      ? 'bg-purple-500 text-white'
                      : isToday
                      ? 'bg-white/5 border border-white/40 text-white/70'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  <span className="text-xs">{formatDayNumber(day)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default MinimalActivityTracker;