// src/services/api/client.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/config';
import { handleExpiredSession } from '../firebase/authService';

// API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;


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
    'ngrok-skip-browser-warning': '1',
  },
});

const normalizeAuthToken = (rawToken: string | null): string | null => {
  if (!rawToken) return null;
  const trimmed = rawToken.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || null;
  }
  return trimmed;
};

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get auth token from AsyncStorage
      const rawToken = await AsyncStorage.getItem('authToken');
      const token = normalizeAuthToken(rawToken);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    // Log request in development
    if (__DEV__) {
      const method = config.method?.toUpperCase() || 'GET';
      const payload = method === 'GET' ? config.params : config.data;
      if (typeof payload === 'undefined') {
        console.log(`[req] ${method} ${config.url}`);
      } else {
        console.log(`[req] ${method} ${config.url}`, payload);
      }
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
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const originalRequest: any = error.config;
      const apiMessage =
        (error.response.data as { message?: string } | undefined)?.message || '';
      const isInvalidTokenFormat =
        apiMessage.toLowerCase().includes('invalid token format');
      const isExpectedFeedbackDuplicate =
        apiMessage.toLowerCase().includes('feedback already submitted');
      
      // Unauthorized - Clear token and redirect to login
      if ((status === 401 || isInvalidTokenFormat) && originalRequest && !originalRequest._retry) {
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
          await handleExpiredSession();
        }
      }
      
      if (__DEV__ && !isExpectedFeedbackDuplicate) {
        console.error('API Error:', error.response?.data || error.message);
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
      if (__DEV__) {
        console.error('API Error:', error.message);
      }
      console.error('Network error - Check your connection');
    } else if (__DEV__) {
      console.error('API Error:', error.message);
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
