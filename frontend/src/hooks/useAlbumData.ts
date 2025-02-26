import { useState, useCallback } from 'react';
import { getAlbumData } from '../lib/api';
import { SearchResult } from '../types/search';
import { Track } from '../types/api';

interface AlbumDataState {
  tracks: Track[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
}

export const useAlbumData = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const [albumData, setAlbumData] = useState<AlbumDataState>({
    tracks: [],
    totalStreams: 0,
    loading: false,
    error: null
  });

  const fetchAlbumData = useCallback(async (album: SearchResult) => {
    setAlbumData(prev => ({ ...prev, loading: true, error: null }));
    setSelectedAlbum(album);
    
    try {
      // Get all album data in a single call
      const albumData = await getAlbumData(album.album_id);
      console.log('Album data loaded:', albumData);
      
      if (albumData && albumData.tracks) {
        setAlbumData({
          tracks: albumData.tracks,
          totalStreams: albumData.total_streams,
          loading: false,
          error: null
        });
      } else {
        setAlbumData(prev => ({
          ...prev,
          loading: false,
          error: 'No track data found for this album'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch album data:', error);
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
      error: null
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