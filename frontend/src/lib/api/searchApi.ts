import axios from 'axios';
import { SearchResult } from '../../types/search';

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