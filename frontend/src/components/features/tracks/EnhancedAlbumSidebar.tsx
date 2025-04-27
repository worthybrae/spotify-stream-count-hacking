import React from 'react';
import { Track } from '@/types/api';
import { SearchResult } from '@/types/search';
import { formatNumber, formatDate, calculateRevenue, formatRevenue } from '@/lib/utils/formatters';
import { downloadAlbumData } from '@/lib/utils/downloadUtils';
import {
  Play,
  DollarSign,
  ListMusic,
  Download,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedAlbumSidebarProps {
  album: SearchResult;
  tracks: Track[];
  totalStreams: number;
}

const EnhancedAlbumSidebar: React.FC<EnhancedAlbumSidebarProps> = ({
  album,
  tracks,
  totalStreams
}) => {
  // Calculate revenue from streams
  const revenue = calculateRevenue(totalStreams);

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
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/10">
      {/* Large Album Cover with gradient overlay */}
      <div className="relative mb-6 rounded-lg overflow-hidden shadow-lg">
        <img
          src={album.cover_art}
          alt={album.album_name}
          className="w-full aspect-square object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>

      {/* Album Info */}
      <h1 className="text-2xl font-bold text-white mb-1">{album.album_name}</h1>
      <p className="text-lg text-white/70 mb-3">{album.artist_name}</p>

      {/* Release Date with icon */}
      <div className="flex items-center mb-6 text-white/50">
        <Calendar className="h-4 w-4 mr-2" />
        <p className="text-sm">
          Released {formatDate(album.release_date)}
        </p>
      </div>

      {/* Stats Cards - visually appealing grid */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Total Streams - animated counter */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-600/10 rounded-lg border border-emerald-500/20 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-emerald-800/40 p-2 rounded-full mr-3">
                <Play className="h-5 w-5 text-emerald-400 fill-emerald-400/30" />
              </div>
              <div>
                <h3 className="text-xs text-white/60 uppercase tracking-wide">Total Streams</h3>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(totalStreams)}</p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-emerald-400/30" />
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-600/10 rounded-lg border border-amber-500/20 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-amber-800/40 p-2 rounded-full mr-3">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xs text-white/60 uppercase tracking-wide">Revenue</h3>
                <p className="text-2xl font-bold text-white mt-1">${formatRevenue(revenue)}</p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-amber-400/30" />
          </div>
        </div>

        {/* Tracks Card */}
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-600/10 rounded-lg border border-blue-500/20 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-blue-800/40 p-2 rounded-full mr-3">
                <ListMusic className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xs text-white/60 uppercase tracking-wide">Tracks</h3>
                <p className="text-2xl font-bold text-white mt-1">{tracks.length}</p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-blue-400/30" />
          </div>
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        variant="default"
        className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 py-6"
      >
        <Download className="h-5 w-5 mr-2" />
        Download Stream Data
      </Button>

      {/* Updated info */}
      <p className="text-center text-xs text-white/40 mt-4">
        Data updated {new Date().toLocaleDateString()}
      </p>
    </div>
  );
};

export default EnhancedAlbumSidebar;