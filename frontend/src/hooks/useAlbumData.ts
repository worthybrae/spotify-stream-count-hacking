import { useState, useCallback } from 'react';
import { getAlbumData } from '../lib/api';
import { SearchResult } from '../types/search';
import { Track } from '../types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';

// Define interfaces for API response types
interface AlbumDetails {
  album_id: string;
  album_name: string;
  artist_id: string;
  artist_name: string;
  cover_art: string;
  release_date: string;
}

interface AlbumApiResponse {
  tracks: Track[];
  total_streams?: number;
  album?: AlbumDetails;
}

interface ProcessedTrack extends Track {
  streamHistory: StreamHistoryItem[];
}

interface StreamHistoryItem {
  date: string;
  streams: number;
}

interface AlbumDataState {
  tracks: ProcessedTrack[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
  albumDetails: AlbumDetails | null;
}

export const useAlbumData = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const [albumData, setAlbumData] = useState<AlbumDataState>({
    tracks: [],
    totalStreams: 0,
    loading: false,
    error: null,
    albumDetails: null
  });

  const fetchAlbumData = useCallback(async (album: SearchResult) => {
    setAlbumData(prev => ({ ...prev, loading: true, error: null }));
    setSelectedAlbum(album);

    try {
      // Get all album data in a single call
      const albumData = await getAlbumData(album.album_id) as AlbumApiResponse;
      console.log('Album data loaded:', albumData);

      if (albumData) {
        if (albumData.tracks && albumData.tracks.length > 0) {
          console.log('Raw tracks sample:', albumData.tracks.slice(0, 5));

          // Check if the tracks have the day property (for stream history creation)
          const hasDayProperty = albumData.tracks.some((track: Track) => 'day' in track);
          console.log('Tracks have day property:', hasDayProperty);

          // Debug the track data structure
          console.log('Track data structure sample:', albumData.tracks.slice(0, 5));

          // Process tracks to group by track_id and add stream history
          const processedTracks = processTrackData(albumData.tracks) as ProcessedTrack[];
          console.log('Processed tracks count:', processedTracks.length);

          // Log first processed track as sample
          if (processedTracks.length > 0) {
            console.log('Sample processed track:', {
              ...processedTracks[0],
              streamHistory: processedTracks[0].streamHistory.length > 0
                ? processedTracks[0].streamHistory
                : 'empty'
            });
          }

          setAlbumData({
            tracks: processedTracks,
            totalStreams: albumData.total_streams || 0,
            loading: false,
            error: null,
            albumDetails: albumData.album || null
          });
        } else {
          console.warn('No tracks found in album data');
          setAlbumData({
            tracks: [],
            totalStreams: albumData.total_streams || 0,
            loading: false,
            error: null,
            albumDetails: albumData.album || null
          });
        }
      } else {
        console.error('No album data returned from API');
        setAlbumData(prev => ({
          ...prev,
          loading: false,
          error: 'No album data found'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch album data:', error instanceof Error ? error.message : String(error));
      setAlbumData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load album data. Please try again.'
      }));
    }
  }, []);

  const clearAlbumData = useCallback(() => {
    setSelectedAlbum(null);
    setAlbumData({
      tracks: [],
      totalStreams: 0,
      loading: false,
      error: null,
      albumDetails: null
    });
  }, []);

  return {
    selectedAlbum,
    ...albumData,
    fetchAlbumData,
    clearAlbumData
  };
};

export default useAlbumData;