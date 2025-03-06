// lib/api/apiKeyApi.ts
import axios, { AxiosError } from 'axios';
import { ApiKeyInfo } from '@/types/api';

// Create a state variable to store the user's real IP
let userRealIp: string = '';

// Function to get the user's IP
const getUserIp = async (): Promise<string> => {
  // If we already have the IP, return it
  if (userRealIp) return userRealIp;
  
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    userRealIp = data.ip;
    return userRealIp;
  } catch (error) {
    console.error('Error fetching user IP:', error);
    return 'unknown';
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY || 'dev-key',
  },
});

/**
 * Create a new API key for the current user (IP address)
 * @returns Promise<ApiKeyInfo>
 */
export const createApiKey = async (): Promise<ApiKeyInfo> => {
  try {
    console.log('Making API call to create API key');
    
    // Get the user's real IP
    const userIp = await getUserIp();
    console.log('Using IP address for API key creation:', userIp);
    
    // Send the IP in the request body
    const response = await api.post('/auth/api-keys', {
      client_ip: userIp // Explicitly pass IP in the body
    });
    
    console.log('Create API key raw response:', response);
    
    if (!response.data || !response.data.api_key) {
      console.error('API returned invalid data format:', response.data);
      throw new Error('Invalid response format from API');
    }
    
    // Convert dates to proper format if needed
    if (response.data.created_at && typeof response.data.created_at === 'string') {
      response.data.created_at = new Date(response.data.created_at).toISOString();
    }
    
    // Store the API key in localStorage for persistence between page refreshes
    try {
      localStorage.setItem('apiKeyInfo', JSON.stringify(response.data));
      console.log('API key info saved to localStorage');
    } catch (e) {
      console.warn('Failed to save API key to localStorage:', e);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating API key:', error);
    
    // Additional detailed logging for Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Status:', axiosError.response?.status);
      console.error('Data:', axiosError.response?.data);
      console.error('Headers:', axiosError.response?.headers);
    }
    
    throw error;
  }
};

/**
 * Get information about the current user's API key including request history
 * @returns Promise<ApiKeyInfo | null>
 */
export const getApiKeyInfo = async (): Promise<ApiKeyInfo | null> => {
  try {
    // First try to get from localStorage
    const storedData = localStorage.getItem('apiKeyInfo');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Retrieved API key info from localStorage:', parsedData);
        
        // As a double-check, verify with the server if we have local data
        // This will update our data with the latest info as well
        try {
          console.log('Verifying API key info with server...');
          
          // Get the user's real IP
          const userIp = await getUserIp();
          console.log('Using IP address for API key lookup:', userIp);
          
          // Send the IP as a query parameter
          const response = await api.get(`/auth/api-keys/info?client_ip=${encodeURIComponent(userIp)}`);
          
          console.log('Server API key info:', response.data);
          
          // Update localStorage with the latest data
          localStorage.setItem('apiKeyInfo', JSON.stringify(response.data));
          
          return response.data;
        } catch (serverError) {
          // If server verification fails but we have local data, use it
          console.warn('Server verification failed, using cached data:', serverError);
          return parsedData;
        }
      } catch (parseError) {
        console.error('Error parsing stored API key info:', parseError);
        localStorage.removeItem('apiKeyInfo');
      }
    }
    
    // If nothing in localStorage or parsing failed, try to get from server
    console.log('Getting API key info from server');
    
    // Get the user's real IP
    const userIp = await getUserIp();
    console.log('Using IP address for API key lookup:', userIp);
    
    // Send the IP as a query parameter
    const response = await api.get(`/auth/api-keys/info?client_ip=${encodeURIComponent(userIp)}`);
    
    console.log('API key info response:', response.data);
    
    if (response.data) {
      // Store in localStorage for future use
      try {
        localStorage.setItem('apiKeyInfo', JSON.stringify(response.data));
        console.log('API key info saved to localStorage');
      } catch (e) {
        console.warn('Failed to save API key to localStorage:', e);
      }
      
      return response.data;
    }
    
    return null;
  } catch (error) {
    // If the user doesn't have an API key yet, return null instead of throwing
    if (axios.isAxiosError(error)) {
      console.log('Error fetching API key info:', error.response?.status, error.response?.data);
      if (error.response?.status === 404) {
        // Clear any stale data in localStorage
        localStorage.removeItem('apiKeyInfo');
        return null;
      }
    }
    
    console.error('Error fetching API key info:', error);
    // Don't throw, just return null to handle gracefully
    return null;
  }
};