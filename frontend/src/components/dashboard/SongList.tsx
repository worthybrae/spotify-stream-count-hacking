import React from 'react';
import { Card } from '@/components/ui/card';

interface Song {
  name: string;
  artist: string;
  streams: number;
}

// Helper function to format large numbers to k/m/b format
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return Math.floor(num / 1000000000) + 'b';
  }
  if (num >= 1000000) {
    return Math.floor(num / 1000000) + 'm';
  }
  if (num >= 1000) {
    return Math.floor(num / 1000) + 'k';
  }
  return num.toString();
};

const CompactSongList: React.FC = () => {
  const songs: Song[] = [
    {
      name: "Fortnight (feat. Post Malone)",
      artist: "Taylor Swift",
      streams: 850910311,
    },
    {
      name: "The Tortured Poets Department",
      artist: "Taylor Swift",
      streams: 255133961,
    }
  ];

  return (
    <div className="w-full space-y-2">
      {songs.map((song, index) => {
        const revenue = song.streams * 0.004;
        
        return (
          <Card key={index} className="p-3 bg-white/5 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white truncate">{song.name}</h3>
                <p className="text-xs text-white/60">{song.artist}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatNumber(song.streams)}</p>
                  <p className="text-xs text-white/60">streams</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-medium text-white">${formatNumber(revenue)}</p>
                  <p className="text-xs text-white/60">revenue</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default CompactSongList;