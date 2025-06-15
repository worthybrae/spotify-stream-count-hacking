import api from './apiClient';
import { AlbumResponse, StreamResponse } from '../../types/api';

/**
 * Fetch detailed album data including tracks and stream counts
 * @param albumId - Spotify album ID
 * @returns Album data with tracks and stream counts
 */
export const getAlbumData = async (albumId: string): Promise<AlbumResponse> => {
  try {
    const response = await api.get(`/albums/${albumId}`);
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
 * @returns List of stream responses for each track
 */
export const getAlbumStreams = async (albumId: string): Promise<StreamResponse[]> => {
  try {
    const response = await api.get(`/albums/${albumId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching album streams:', error);
    throw error;
  }
};