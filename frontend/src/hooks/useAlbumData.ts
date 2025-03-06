import { useState, useCallback } from 'react';
import { getAlbumData } from '../lib/api';
import { SearchResult } from '../types/search';
import { Track } from '../types/api';
import { processTrackData } from '@/lib/utils/dataProcessors';

interface AlbumDataState {
  tracks: Track[];
  totalStreams: number;
  loading: boolean;
  error: string | null;
  // Add any new fields from your updated API here
  albumDetails: {
    album_id: string;
    album_name: string;
    artist_id: string;
    artist_name: string;
    cover_art: string;
    release_date: string;
  } | null;
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
      const albumData = await getAlbumData(album.album_id);
      console.log('Album data loaded:', albumData);
      
      // Updated to handle the new response structure
      if (albumData) {
        if (albumData.tracks && albumData.tracks.length > 0) {
          console.log('Raw tracks sample:', albumData.tracks.slice(0, 5));
          
          // Check if the tracks have the day property
          // Check if the tracks have the day property
          const hasDayProperty = albumData.tracks.some((track: any) => track.day);
          console.log('Tracks have day property:', hasDayProperty);
          
          // Debug the track data structure to see what we're working with
          console.log('Track data structure sample:', albumData.tracks.slice(0, 5));
          
          // Process tracks to group by track_id
          const processedTracks = processTrackData(albumData.tracks);
          console.log('Processed tracks count:', processedTracks.length);
          
          // Log first processed track as sample with full stream history for debugging
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