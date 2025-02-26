import axios from 'axios';
import { Track, StreamCount } from '../../types/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
  },
});

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
  album: any, 
  tracks: Track[], 
  streamHistory: StreamCount[]
): Promise<any> => {
  try {
    const requestData = {
      album,
      tracks,
      streamHistory
    };
    
    const response = await api.post('/albums', requestData);
    return response.data;
  } catch (error) {
    console.error('Failed to save album data:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    throw error;
  }
};

// Get all albums (paginated)
export const getAllAlbums = async (limit: number = 50, offset: number = 0): Promise<any[]> => {
  try {
    const response = await api.get('/albums', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all albums:', error);
    return [];
  }
};