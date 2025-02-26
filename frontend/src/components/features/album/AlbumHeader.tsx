import React, { useMemo } from 'react';
import { Play, DollarSign, TrendingUp } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { formatNumber, formatDate, calculateRevenue, formatRevenue, calculateStreamsPerDay } from '@/lib/utils/formatters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AlbumHeaderProps {
  album: SearchResult;
  totalStreams: number;
}

// Reusable MetricBadge component with tooltip
const MetricBadge = ({ 
  icon, 
  value, 
  fullValue,
  label,
  className = "" 
}: { 
  icon: React.ReactNode, 
  value: string,
  fullValue?: string,
  label?: string,
  className?: string 
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1 ${className}`}>
          {icon}
          <span className="font-medium">{value}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs whitespace-nowrap">
          {label && <span className="mr-1">{label}:</span>}
          {fullValue || value}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const AlbumHeader: React.FC<AlbumHeaderProps> = ({ album, totalStreams }) => {
  // Calculate revenue from streams
  const totalRevenue = useMemo(() => 
    calculateRevenue(totalStreams), 
    [totalStreams]
  );

  // Calculate streams per day based on release date
  const streamsPerDay = useMemo(() => 
    calculateStreamsPerDay(album.release_date, totalStreams),
    [album.release_date, totalStreams]
  );

  return (
    <div className="mb-6">
      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Top Row: Album Cover and Title */}
        <div className="flex items-start gap-4">
          <img 
            src={album.cover_art}
            alt={album.album_name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
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
            
            {/* Second Row: Artist and Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-1">
              <div className="flex-1 min-w-0">
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
              
              {/* Performance Stats */}
              <div className="flex-shrink-0 bg-white/5 rounded-xl p-2 mt-2 sm:mt-0">                                
                <div className="flex items-center gap-3">
                  <div className="text-green-400">
                    <MetricBadge 
                      icon={<Play className="h-4 w-4" />}
                      value={formatNumber(totalStreams)}
                      fullValue={totalStreams.toLocaleString()}
                      label="Total Streams"
                    />
                  </div>
                  
                  <div className="h-4 w-px bg-white/10"></div>
                  
                  <div className="text-yellow-400">
                    <MetricBadge 
                      icon={<DollarSign className="h-4 w-4" />}
                      value={formatRevenue(totalRevenue)}
                      fullValue={`$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                      label="Total Revenue"
                    />
                  </div>
                  
                  <div className="h-4 w-px bg-white/10"></div>
                  
                  <div className="text-blue-400">
                    <MetricBadge 
                      icon={<TrendingUp className="h-4 w-4" />}
                      value={`${formatNumber(streamsPerDay)}/day`}
                      fullValue={`${Math.round(streamsPerDay).toLocaleString()} streams per day`}
                      label="Daily Average"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile View - Redesigned for narrower screens */}
      <div className="md:hidden">
        {/* Top Row: Album Cover and Title */}
        <div className="flex items-start gap-4">
          <img 
            src={album.cover_art}
            alt={album.album_name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="text-lg font-bold text-white truncate">{album.album_name}</h2>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs whitespace-nowrap">{album.album_name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-white/60 truncate">{album.artist_name}</p>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs whitespace-nowrap">{album.artist_name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-white/40">
              Released {formatDate(album.release_date)}
            </p>
          </div>
        </div>
        
        {/* Performance Stats - Match desktop style with dividers */}
        <div className="mt-4 bg-white/5 rounded-xl p-2">                                
          <div className="flex items-center justify-between">
            <div className="text-green-400">
              <MetricBadge 
                icon={<Play className="h-4 w-4" />}
                value={formatNumber(totalStreams)}
                fullValue={totalStreams.toLocaleString()}
              />
            </div>
            
            <div className="h-4 w-px bg-white/10"></div>
            
            <div className="text-yellow-400">
              <MetricBadge 
                icon={<DollarSign className="h-4 w-4" />}
                value={formatRevenue(totalRevenue)}
                fullValue={`$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              />
            </div>
            
            <div className="h-4 w-px bg-white/10"></div>
            
            <div className="text-blue-400">
              <MetricBadge 
                icon={<TrendingUp className="h-4 w-4" />}
                value={`${formatNumber(streamsPerDay)}/d`}
                fullValue={`${Math.round(streamsPerDay).toLocaleString()} streams per day`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumHeader;