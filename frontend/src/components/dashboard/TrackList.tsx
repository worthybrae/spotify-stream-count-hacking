import { Card } from '@/components/ui/card';
import { Track } from '@/types/api';

interface TrackListProps {
  tracks: Track[];
  onTrackSelect?: (track: Track) => void;
}

export function TrackList({ tracks, onTrackSelect }: TrackListProps) {
  const calculateRevenue = (streams: number) => {
    const revenuePerStream = 0.004;
    return streams * revenuePerStream;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Track Breakdown</h3>
      {tracks.map((track) => (
        <Card 
          key={track.track_id} 
          className="p-4 hover:bg-primary/5 transition-colors cursor-pointer"
          onClick={() => onTrackSelect?.(track)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">{track.name}</h4>
              <p className="text-sm text-muted-foreground">
                {track.playcount.toLocaleString()} streams
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">
                ${calculateRevenue(track.playcount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}