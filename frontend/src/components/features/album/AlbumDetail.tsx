import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { Track } from '@/types/api';
import TrackCards from '../tracks/TrackCards';
import AlbumHeader from './AlbumHeader';

interface AlbumDetailProps {
  selectedAlbum: SearchResult | null;
  tracks: Track[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
  onBackToSearch: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({
  selectedAlbum,
  tracks,
  totalStreams,
  loading,
  error,
  onBackToSearch
}) => {
  if (!selectedAlbum) return null;

  return (
    <div className="space-y-6">
      <button
        onClick={onBackToSearch}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Search
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 p-4 rounded-lg text-red-300">
          {error}
        </div>
      )}

      <Card className="p-6 bg-black border-white/10">
        {/* Album Header with Performance Stats */}
        <AlbumHeader 
          album={selectedAlbum} 
          totalStreams={totalStreams} 
        />

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center h-32 mt-6">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="space-y-6">                              
            {/* Track Cards */}
            {tracks.length > 0 ? (
              <TrackCards 
                tracks={tracks}
                selectedAlbum={selectedAlbum}
              />
            ) : (
              <div className="text-center py-8 text-white/60">
                No tracks found for this album
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AlbumDetail;