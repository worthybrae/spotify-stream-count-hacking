import React, { useMemo } from 'react';
import { Play, DollarSign } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { formatNumber, formatDate, calculateRevenue, formatRevenue } from '@/lib/utils/formatters';

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

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      {/* Album Cover and Info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <img 
          src={album.cover_art}
          alt={album.album_name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          {/* Added truncate class and max-w-[calc(100%-80px)] at smaller screens */}
          <h2 className="text-xl font-bold text-white truncate max-w-full">{album.album_name}</h2>
          <p className="text-lg text-white/60 truncate">{album.artist_name}</p>
          <p className="text-sm text-white/40">
            Released {formatDate(album.release_date)}
          </p>
        </div>
      </div>

      {/* Performance Stats - Made responsive */}
      <div className="flex-shrink-0 bg-white/5 rounded-xl p-3 self-start mt-2 sm:mt-0">                                
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
        </div>
      </div>
    </div>
  );
};

export default AlbumHeader;