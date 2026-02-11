// src/services/api/client.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// src/services/api/client.ts
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.8.218:5000/api/v1'  // Use your computer's IP for iPhone
  : 'https://your-production-url.com/api/v1'; // Production


const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '';
const FIREBASE_REFRESH_URL = 'https://securetoken.googleapis.com/v1/token';

const refreshAuthToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken || !FIREBASE_API_KEY) {
    throw new Error('Missing refresh token or Firebase API key');
  }

  const response = await fetch(`${FIREBASE_REFRESH_URL}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Token refresh failed');
  }

  const newToken = data.id_token;
  const newRefreshToken = data.refresh_token;
  if (newToken) {
    await AsyncStorage.setItem('authToken', newToken);
  }
  if (newRefreshToken) {
    await AsyncStorage.setItem('refreshToken', newRefreshToken);
  }

  return newToken;
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    // Log request in development
    if (__DEV__) {
      console.log(`[req] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (__DEV__) {
      console.log(`[res] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      console.error('API Error:', error.response?.data || error.message);
    }

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const originalRequest: any = error.config;
      
      // Unauthorized - Clear token and redirect to login
      if (status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAuthToken();
          if (newToken) {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('refreshToken');
        }
      }
      
      // Forbidden
      if (status === 403) {
        console.error('Access forbidden');
      }
      
      // Not found
      if (status === 404) {
        console.error('Resource not found');
      }
      
      // Server error
      if (status >= 500) {
        console.error('Server error');
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - Check your connection');
    }

    return Promise.reject(error);
  }
);

// API response type
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// API error type
export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
  timestamp: string;
}

export default apiClient;
