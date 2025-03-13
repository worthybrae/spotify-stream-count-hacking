import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, BarChart3, KeyRound, Clock } from 'lucide-react';

export const featuresData = [
  {
    icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
    title: "Revenue Tracking",
    description: "Real-time Spotify revenue analytics"
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
    title: "Daily Refresh",
    description: "Updated stream counts every day"
  },
  {
    icon: <KeyRound className="h-5 w-5 text-pink-400" />,
    title: "Secret Data Access",
    description: "Access Spotify's non-public data"
  },
  {
    icon: <Clock className="h-5 w-5 text-green-400" />,
    title: "Historical Data",
    description: "Complete daily streaming history"
  }
] as const;

interface FeaturesGridProps {
  isVisible: boolean;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
      {featuresData.map((feature, index) => (
        <Card 
          key={index}
          className="bg-white/5 hover:bg-white/10 border-white/5 p-4 
                  transition-all duration-300 transform hover:scale-102"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-medium text-sm text-white">{feature.title}</h3>
              <p className="text-xs text-white/60">{feature.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};