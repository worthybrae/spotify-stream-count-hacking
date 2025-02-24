import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Track, StreamCount } from '@/types/api';
import { StreamChart } from './StreamChart';
import { TrackList } from './TrackList';

interface AlbumStatsProps {
  tracks: Track[];
  streamHistory: StreamCount[];
  loading?: boolean;
  onTrackSelect?: (track: Track) => void;
}

export function AlbumStats({ 
  tracks, 
  streamHistory, 
  loading = false,
  onTrackSelect 
}: AlbumStatsProps) {
  const calculateTotalRevenue = (streams: number) => {
    const revenuePerStream = 0.004;
    return streams * revenuePerStream;
  };

  const totalStreams = tracks.reduce((sum, track) => sum + track.playcount, 0);
  const totalRevenue = calculateTotalRevenue(totalStreams);

  if (loading) {
    return (
      <Card className="p-6 bg-background/80 backdrop-blur-xl border-white/20">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!tracks.length) {
    return (
      <Card className="p-6 bg-background/80 backdrop-blur-xl border-white/20">
        <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
          <p>Search and select an album to view statistics</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-background/80 backdrop-blur-xl border-white/20">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-primary/10">
            <h4 className="text-sm text-muted-foreground">Total Streams</h4>
            <p className="text-2xl font-bold">
              {totalStreams.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-primary/10">
            <h4 className="text-sm text-muted-foreground">Total Revenue</h4>
            <p className="text-2xl font-bold">
              ${totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </Card>
        </div>

        <StreamChart 
          data={streamHistory}
          title="Daily Streams"
        />

        <TrackList 
          tracks={tracks}
          onTrackSelect={onTrackSelect}
        />
      </div>
    </Card>
  );
}