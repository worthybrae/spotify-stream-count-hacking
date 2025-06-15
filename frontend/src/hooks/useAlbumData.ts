import { useState, useCallback } from 'react';
import { getAlbumData } from '../lib/api/albumApi';
import { SearchResult } from '@/types/search';
import { Track, AlbumResponse } from '@/types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';

// Define interfaces for types
interface StreamHistoryItem {
  date: string;
  streams: number;
}

interface ProcessedTrack extends Track {
  streamHistory: StreamHistoryItem[];
}

interface AlbumDataState {
  tracks: ProcessedTrack[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
  albumDetails: AlbumResponse['album'] | null;
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
      const responseData = await getAlbumData(album.album_id);
      console.log('Album data loaded:', responseData);

      // Handle case where response is an array of tracks
      const tracks = Array.isArray(responseData) ? responseData : responseData.tracks;

      if (tracks && tracks.length > 0) {
        console.log('Raw tracks sample:', tracks.slice(0, 5));

        // Process tracks to group by track_id and add stream history
        const processedTracks = processTrackData(tracks);
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
          totalStreams: processedTracks.reduce((sum, track) => sum + (track.stream_count || 0), 0),
          loading: false,
          error: null,
          albumDetails: !Array.isArray(responseData) ? responseData.album : null
        });
      } else {
        console.warn('No tracks found in album data');
        setAlbumData({
          tracks: [],
          totalStreams: 0,
          loading: false,
          error: 'No tracks found for this album',
          albumDetails: !Array.isArray(responseData) ? responseData.album : null
        });
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