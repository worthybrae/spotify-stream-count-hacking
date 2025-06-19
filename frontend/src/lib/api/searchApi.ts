import api from './apiClient';
import { SearchResult } from '../../types/search';

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

/**
 * Fetch top tracks (trending songs)
 * @param time_period - Time period for percentage change calculation ('7d' or '30d')
 * @returns List of top tracks
 */
export const getTopTracks = async (time_period: string = '7d') => {
  try {
    const apiKey = import.meta.env.VITE_API_KEY || localStorage.getItem('apiKey');
    const response = await api.get('/search/top-tracks', {
      headers: {
        'X-API-Key': apiKey,
      },
      params: {
        time_period
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return [];
  }
};