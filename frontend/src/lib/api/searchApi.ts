import axios from 'axios';
import { SearchResult } from '../../types/search';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
  },
});

/**
 * Search albums by name
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 10)
 * @param force_spotify - If true, skip database search and go directly to Spotify API
 * @returns List of search results
 */
export const searchAlbums = async (
  query: string, 
  limit: number = 10,
  force_spotify: boolean = false
): Promise<SearchResult[]> => {
  try {
    const response = await api.get('/search/albums', {
      params: { 
        query, 
        limit,
        force_spotify
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching albums:', error);
    return [];
  }
};