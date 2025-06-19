import api from './apiClient';
import { AlbumResponse, StreamResponse } from '../../types/api';

/**
 * Fetch detailed album data including tracks and stream counts
 * @param albumId - Spotify album ID
 * @param time_period - Time period for percentage change calculation ('7d' or '30d')
 * @returns Album data with tracks and stream counts
 */
export const getAlbumData = async (albumId: string, time_period: string = '7d'): Promise<AlbumResponse> => {
  try {
    const response = await api.get(`/albums/${albumId}`, {
      params: {
        time_period
      }
    });
    console.log('Raw API response:', response);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);
    console.log('Is array?', Array.isArray(response.data));
    return response.data;
  } catch (error) {
    console.error('Error fetching album data:', error);
    throw error;
  }
};

/**
 * Get stream counts for all tracks in an album
 * @param albumId - Spotify album ID
 * @param time_period - Time period for percentage change calculation ('7d' or '30d')
 * @returns List of stream responses for each track
 */
export const getAlbumStreams = async (albumId: string, time_period: string = '7d'): Promise<StreamResponse[]> => {
  try {
    const response = await api.get(`/albums/${albumId}`, {
      params: {
        time_period
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching album streams:', error);
    throw error;
  }
};