import api from './apiClient';
import { StreamCount } from '../../types/api';

interface StreamResponse {
  success: boolean;
  message: string;
  streams_added: number;
}

// Add new stream counts
export const addStreamCounts = async (albumId: string, streams: StreamCount[]): Promise<StreamResponse> => {
  try {
    const requestData = {
      album_id: albumId,
      streams
    };

    const response = await api.post('/streams', requestData);
    return response.data;
  } catch (error) {
    console.error('Failed to add stream counts:', error);
    throw error;
  }
};