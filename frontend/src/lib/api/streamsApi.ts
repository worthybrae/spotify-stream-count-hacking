import axios from 'axios';
import { StreamCount } from '../../types/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
  },
});

// Add new stream counts
export const addStreamCounts = async (albumId: string, streams: StreamCount[]): Promise<any> => {
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