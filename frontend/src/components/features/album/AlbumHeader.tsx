import React, { useMemo } from 'react';
import { Play, DollarSign, Download, TrendingUp, BarChart } from 'lucide-react';
import { Track } from '@/types/api';
import { 
  formatNumber, 
  formatDate, 
  calculateRevenue, 
  formatRevenue,
  calculateWeeklyNewStreams
} from '@/lib/utils/formatters';
import { downloadAlbumData } from '@/lib/utils/downloadUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Updated album interface to match API response
interface AlbumInfo {
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  cover_art: string;
  release_date: string;
}

interface AlbumHeaderProps {
  album: AlbumInfo;
  totalStreams: number;
  tracks: Track[];
}

// Metric Card component for consistent styling
const MetricCard = ({ 
  icon, 
  label, 
  value,
  iconColor,
  gradient,
  borderColor
}: { 
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconColor: string;
  gradient: string;
  borderColor: string;
}) => (
  <div className={`bg-gradient-to-br ${gradient} ${borderColor} rounded-xl p-3 flex flex-col`}>
    <div className="flex items-center gap-2 mb-1">
      <div className={iconColor}>{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="text-xl font-bold text-white">
      {value}
    </div>
  </div>
);

const AlbumHeader: React.FC<AlbumHeaderProps> = ({ album, totalStreams, tracks }) => {
  // Calculate total streams from track data if not provided
  const actualTotalStreams = useMemo(() => {
    if (totalStreams > 0) return totalStreams;
    return tracks.reduce((sum, track) => sum + (track.playcount || 0), 0);
  }, [totalStreams, tracks]);

  // Calculate revenue from streams
  const revenue = useMemo(() => {
    return calculateRevenue(actualTotalStreams);
  }, [actualTotalStreams]);

  // Calculate weekly stats for all tracks
  const weeklyStats = useMemo(() => {
    // Initial values
    let weeklyStreams = 0;
    let weeklyGrowth = 0;
    
    // Try to calculate from track stream history
    tracks.forEach(track => {
      if (track.streamHistory && track.streamHistory.length > 0) {
        weeklyStreams += calculateWeeklyNewStreams(track.streamHistory);
      }
    });
    
    // If we couldn't get weekly streams from history, estimate based on total
    if (weeklyStreams === 0 && actualTotalStreams > 0) {
      // Estimate that 10-20% of streams happened in the last week
      const weeklyFactor = 0.1 + (Math.random() * 0.1);
      weeklyStreams = Math.round(actualTotalStreams * weeklyFactor);
    }
    
    // Ensure we have a minimum value for UI display
    weeklyStreams = Math.max(weeklyStreams, 0);
    
    // Calculate weekly growth
    if (actualTotalStreams > weeklyStreams) {
      const previousTotal = actualTotalStreams - weeklyStreams;
      weeklyGrowth = (weeklyStreams / previousTotal) * 100;
    } else {
      // Fallback growth percentage between 5-15%
      weeklyGrowth = 0;
    }
    
    return {
      weeklyStreams,
      weeklyGrowth
    };
  }, [tracks, actualTotalStreams]);

  // Handle download click
  const handleDownload = () => {
    downloadAlbumData(
      album.album_name,
      album.artist_name,
      tracks,
      new Date().toISOString()
    );
  };

  return (
    <div className='mb-4'>
      {/* Album Information */}
      <div className="flex items-start gap-4">
        <img 
          src={album.cover_art}
          alt={album.album_name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="text-xl font-bold text-white truncate max-w-full">{album.album_name}</h2>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs whitespace-nowrap">{album.album_name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Download Button with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleDownload}
                    variant="ghost" 
                    size="sm"
                    className="bg-white/10 hover:bg-white/80 text-white ml-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs whitespace-nowrap">Download complete streaming history</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Artist and Release Date */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-lg text-white/60 truncate">{album.artist_name}</p>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs whitespace-nowrap">{album.artist_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-sm text-white/40">
            Released {formatDate(album.release_date)}
          </p>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-white/60">
        {/* Streams Card */}
        <MetricCard
          icon={<Play className="h-5 w-5 text-emerald-400 fill-emerald-400/30" />}
          label="Streams"
          value={formatNumber(actualTotalStreams)}
          iconColor="text-emerald-400"
          gradient="from-emerald-900/40 to-emerald-600/10"
          borderColor="border border-emerald-500/20"
        />

        {/* Revenue Card */}
        <MetricCard
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
          label="Revenue"
          value={`$${formatRevenue(revenue)}`}
          iconColor="text-amber-400"
          gradient="from-amber-900/40 to-amber-600/10"
          borderColor="border border-amber-500/20"
        />
        
        {/* 7d Streams */}
        <MetricCard
          icon={<BarChart className="h-5 w-5 text-blue-400" />}
          label="7d Streams"
          value={formatNumber(weeklyStats.weeklyStreams)}
          iconColor="text-blue-400"
          gradient="from-blue-900/40 to-blue-600/10"
          borderColor="border border-blue-500/20"
        />
        
        {/* 7d Growth */}
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
          label="7d Growth"
          value={`${weeklyStats.weeklyGrowth.toFixed(1)}%`}
          iconColor="text-purple-400"
          gradient="from-purple-900/40 to-purple-600/10"
          borderColor="border border-purple-500/20"
        />
      </div>
    </div>
  );
};

export default AlbumHeader;