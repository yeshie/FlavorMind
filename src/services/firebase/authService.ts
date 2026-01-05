// src/services/firebase/authService.ts - Complete Firebase Auth
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.8.218:5000/api/v1'
  : 'https://your-production-url.com/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: AuthUser;
  };
}

// ============= EMAIL/PASSWORD AUTH =============

export const registerWithEmail = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });

    if (response.data.success) {
      const { token, user } = response.data.data;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return {
        success: true,
        message: 'Registration successful',
        data: { token, user },
      };
    }

    return { success: false, message: response.data.message };
  } catch (error: any) {
    console.error('Register error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed',
    };
  }
};

export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    if (response.data.success) {
      const { token, user } = response.data.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMe', 'true');
        await AsyncStorage.setItem('userEmail', email);
      }

      return {
        success: true,
        message: 'Login successful',
        data: { token, user },
      };
    }

    return { success: false, message: response.data.message };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
};

// ============= SOCIAL AUTH (GOOGLE/APPLE) =============

export const loginWithGoogle = async (): Promise<AuthResponse> => {
  try {
    // TODO: Implement Google Sign-In
    // Use @react-native-google-signin/google-signin
    console.log('Google Sign-In: To be implemented');
    
    return {
      success: false,
      message: 'Google Sign-In will be implemented with Firebase SDK',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Google Sign-In failed',
    };
  }
};

export const loginWithApple = async (): Promise<AuthResponse> => {
  try {
    // TODO: Implement Apple Sign-In
    // Use @invertase/react-native-apple-authentication
    console.log('Apple Sign-In: To be implemented');
    
    return {
      success: false,
      message: 'Apple Sign-In will be implemented with Firebase SDK',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Apple Sign-In failed',
    };
  }
};

// ============= OTP VERIFICATION =============

export const sendOTP = async (phoneNumber: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/send-otp', {
      phoneNumber,
    });

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send OTP',
    };
  }
};

export const verifyOTP = async (
  phoneNumber: string,
  otp: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/verify-otp', {
      phoneNumber,
      otp,
    });

    if (response.data.success) {
      const { token, user } = response.data.data;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return {
        success: true,
        message: 'OTP verified successfully',
        data: { token, user },
      };
    }

    return { success: false, message: response.data.message };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'OTP verification failed',
    };
  }
};

// ============= PASSWORD RESET =============

export const sendPasswordResetEmail = async (
  email: string
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post('/auth/forgot-password', {
      email,
    });

    return {
      success: response.data.success,
      message: response.data.message || 'Password reset email sent',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to send reset email',
    };
  }
};

// ============= USER MANAGEMENT =============

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const getRememberedEmail = async (): Promise<string | null> => {
  try {
    const rememberMe = await AsyncStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
      return await AsyncStorage.getItem('userEmail');
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const rememberMe = await AsyncStorage.getItem('rememberMe');
    const userEmail = await AsyncStorage.getItem('userEmail');
    
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    
    // Keep remember me data if enabled
    if (rememberMe !== 'true') {
      await AsyncStorage.removeItem('userEmail');
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    return false;
  }
};