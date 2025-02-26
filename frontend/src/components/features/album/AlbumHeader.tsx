import React, { useMemo } from 'react';
import { Play, DollarSign, TrendingUp } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { formatNumber, formatDate, calculateRevenue, formatRevenue, calculateStreamsPerDay } from '@/lib/utils/formatters';

interface AlbumHeaderProps {
  album: SearchResult;
  totalStreams: number;
}

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
            <h2 className="text-xl font-bold text-white truncate max-w-full">{album.album_name}</h2>
            
            {/* Second Row: Artist and Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-1">
              <div className="flex-1 min-w-0">
                <p className="text-lg text-white/60 truncate">{album.artist_name}</p>
                <p className="text-sm text-white/40">
                  Released {formatDate(album.release_date)}
                </p>
              </div>
              
              {/* Performance Stats */}
              <div className="flex-shrink-0 bg-white/5 rounded-xl p-2 mt-2 sm:mt-0">                                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Play className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">{formatNumber(totalStreams)}</span>
                  </div>
                  
                  <div className="h-4 w-px bg-white/10"></div>
                  
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">{formatRevenue(totalRevenue)}</span>
                  </div>
                  
                  <div className="h-4 w-px bg-white/10"></div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">{formatNumber(streamsPerDay)}/day</span>
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
            <h2 className="text-lg font-bold text-white truncate">{album.album_name}</h2>
            <p className="text-sm text-white/60 truncate">{album.artist_name}</p>
            <p className="text-xs text-white/40">
              Released {formatDate(album.release_date)}
            </p>
          </div>
        </div>
        
        {/* Performance Stats - Match desktop style with dividers */}
        <div className="mt-4 bg-white/5 rounded-xl p-2">                                
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Play className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">{formatNumber(totalStreams)}</span>
            </div>
            
            <div className="h-4 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">{formatRevenue(totalRevenue)}</span>
            </div>
            
            <div className="h-4 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">{formatNumber(streamsPerDay)}/d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumHeader;