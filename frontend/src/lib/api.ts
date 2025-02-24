// api.ts - Simplified approach
import axios, { AxiosError } from 'axios';
import { AlbumResponse, NewRelease, Track, StreamCount } from '../types/api';
import { SearchResult } from '../types/search';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY,
  },
});

// Search functions
export const searchAlbums = async (query: string) => {
  const response = await api.get<SearchResult[]>('/search/albums', {
    params: { 
      query,
      limit: 5,
      fields: 'album_id,album_name,artist_name,cover_art,release_date'
    },
  });
  return response.data;
};

export const searchSpotifyAlbums = async (query: string, limit: number = 5) => {
  const response = await api.get<NewRelease[]>('/search/spotify-albums', {
    params: { 
      query,
      limit
    },
  });
  return response.data;
};

// Get data functions
export const getNewReleases = async (limit: number = 20) => {
  const response = await api.get<NewRelease[]>('/new-releases', {
    params: { limit },
  });
  return response.data;
};

export const getAlbumTracks = async (albumId: string) => {
  const response = await api.get<AlbumResponse>(`/album/${albumId}/tracks`);
  return response.data;
};

export const getTrackInfo = async (trackId: string) => {
  const response = await api.get<Track>(`/track/${trackId}`);
  return response.data;
};

export const getTrackHistory = async (trackId: string, limit: number = 30) => {
  const response = await api.get<StreamCount[]>(`/track/${trackId}/history`, {
    params: { limit },
  });
  return response.data;
};

export const saveAlbumData = async (album: NewRelease, tracks: Track[], streamHistory: StreamCount[]) => {
  try {
    // Single API call that saves everything in one go
    const response = await api.post('/save-album-data', {
      album, // This is now a NewRelease with artist_id included
      tracks,
      streamHistory
    });
    
    console.log('Saved album data successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to save album data:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('API Error Details:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
    }
    throw error;
  }
};