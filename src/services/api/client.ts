// src/services/api/client.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// src/services/api/client.ts
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.8.218:5000/api/v1'  // Use your computer's IP for iPhone
  : 'https://your-production-url.com/api/v1'; // Production


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
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data);
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
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (__DEV__) {
      console.error('❌ API Error:', error.response?.data || error.message);
    }

    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      
      // Unauthorized - Clear token and redirect to login
      if (status === 401) {
        await AsyncStorage.removeItem('authToken');
        // TODO: Navigate to login screen
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