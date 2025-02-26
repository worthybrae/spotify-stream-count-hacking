// lib/api.ts
import axios, { AxiosError } from 'axios';
import { NewRelease, Track, StreamCount } from '../types/api';
import { SearchResult } from '../types/search';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
  },
});

// Search albums by name - returns database results or Spotify results if none found
export const searchAlbums = async (query: string, limit: number = 10): Promise<SearchResult[]> => {
  try {
    const response = await api.get('/search/albums', {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching albums:', error);
    return [];
  }
};

// Get album details with tracks and stream counts in a single call
export const getAlbumData = async (albumId: string): Promise<{
  album: {
    album_id: string;
    album_name: string;
    artist_id: string;
    artist_name: string;
    cover_art: string;
    release_date: string;
  };
  tracks: Track[];
  total_streams: number;
}> => {
  try {
    // Updated endpoint path from /album/{id} to /albums/{id}
    const response = await api.get(`/albums/${albumId}`);
    console.log('Album data response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching album ${albumId}:`, error);
    throw error;
  }
};

// Save complete album data
export const saveAlbumData = async (
  album: NewRelease, 
  tracks: Track[], 
  streamHistory: StreamCount[]
): Promise<any> => {
  try {
    const requestData = {
      album,
      tracks,
      streamHistory
    };
    
    // Updated endpoint path from /album to /albums
    const response = await api.post('/albums', requestData);
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

// Add new stream counts
export const addStreamCounts = async (albumId: string, streams: StreamCount[]): Promise<any> => {
  try {
    const requestData = {
      album_id: albumId,
      streams
    };
    
    // This endpoint path remains the same
    const response = await api.post('/streams', requestData);
    return response.data;
  } catch (error) {
    console.error('Failed to add stream counts:', error);
    throw error;
  }
};

// Get all albums (paginated)
export const getAllAlbums = async (limit: number = 50, offset: number = 0): Promise<SearchResult[]> => {
  try {
    // This endpoint path remains the same
    const response = await api.get('/albums', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all albums:', error);
    return [];
  }
};