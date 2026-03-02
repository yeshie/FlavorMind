// src/services/firebase/authService.ts - Complete Firebase Auth
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  updateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  signOut as firebaseSignOut,
  User,
  Auth,
} from 'firebase/auth';
import { auth, hasFirebaseConfig } from './firebase';
import { API_CONFIG } from '../../constants/config';

const API_BASE_URL = API_CONFIG.BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

type AuthChangeListener = (isAuthenticated: boolean) => void;
const authChangeListeners = new Set<AuthChangeListener>();

export const subscribeToAuthChanges = (listener: AuthChangeListener) => {
  authChangeListeners.add(listener);
  return () => {
    authChangeListeners.delete(listener);
  };
};

const notifyAuthChange = (isAuth: boolean) => {
  authChangeListeners.forEach((listener) => {
    try {
      listener(isAuth);
    } catch (error) {
      console.warn('Auth listener error:', error);
    }
  });
};

const requireFirebaseAuth = () => {
  if (!hasFirebaseConfig || !auth) {
    throw new Error(
      'Firebase config missing. Set EXPO_PUBLIC_FIREBASE_* env vars to enable Firebase.'
    );
  }
  return auth;
};

const mapFirebaseUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email || '',
  displayName: user.displayName || user.email?.split('@')[0] || 'User',
  photoURL: user.photoURL || undefined,
  emailVerified: user.emailVerified ?? false,
});

const formatAuthError = (error: any): string => {
  const code = error?.code;
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
    return 'Invalid email or password';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Email already registered';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please try again.';
  }

  return error?.response?.data?.message || error?.message || 'Authentication failed';
};

const completeFirebaseLogin = async (
  firebaseAuth: Auth,
  user: User,
  options?: { rememberMe?: boolean; email?: string }
): Promise<AuthResponse> => {
  const idToken = await user.getIdToken();
  const refreshToken = user.refreshToken;

  const response = await apiClient.post('/auth/login', { idToken });
  if (!response.data?.success) {
    await firebaseSignOut(firebaseAuth);
    return { success: false, message: response.data?.message || 'Login failed' };
  }

  const mappedUser = response.data?.data?.user || mapFirebaseUser(user);

  await AsyncStorage.setItem('authToken', idToken);
  if (refreshToken) {
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }
  await AsyncStorage.setItem('userData', JSON.stringify(mappedUser));

  if (options?.rememberMe && options.email) {
    await AsyncStorage.setItem('rememberMe', 'true');
    await AsyncStorage.setItem('userEmail', options.email);
  } else {
    await AsyncStorage.removeItem('rememberMe');
    await AsyncStorage.removeItem('userEmail');
  }

  notifyAuthChange(true);

  return {
    success: true,
    message: response.data?.message || 'Login successful',
    data: { token: idToken, user: mappedUser },
  };
};

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
    const firebaseAuth = requireFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

    const trimmedName = name.trim();
    if (trimmedName) {
      await updateProfile(credential.user, { displayName: trimmedName });
    }

    try {
      await firebaseSendEmailVerification(credential.user);
    } catch (verificationError) {
      console.warn('Email verification not sent:', verificationError);
    }

    return await completeFirebaseLogin(firebaseAuth, credential.user);
  } catch (error: any) {
    console.error('Register error:', error);
    try {
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (signOutError) {
      console.warn('Firebase sign-out failed after register error:', signOutError);
    }
    return {
      success: false,
      message: formatAuthError(error),
    };
  }
};

export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> => {
  try {
    const firebaseAuth = requireFirebaseAuth();
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return await completeFirebaseLogin(firebaseAuth, credential.user, { rememberMe, email });
  } catch (error: any) {
    console.error('Login error:', error);
    try {
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (signOutError) {
      console.warn('Firebase sign-out failed after login error:', signOutError);
    }
    return {
      success: false,
      message: formatAuthError(error),
    };
  }
};

// ============= SOCIAL AUTH (GOOGLE/APPLE) =============

export const loginWithGoogleIdToken = async (
  idToken: string,
  accessToken?: string
): Promise<AuthResponse> => {
  try {
    const firebaseAuth = requireFirebaseAuth();
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(firebaseAuth, credential);
    return await completeFirebaseLogin(firebaseAuth, userCredential.user);
  } catch (error: any) {
    console.error('Google login error:', error);
    try {
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (signOutError) {
      console.warn('Firebase sign-out failed after Google login error:', signOutError);
    }
    return {
      success: false,
      message: formatAuthError(error),
    };
  }
};

export const loginWithAppleIdToken = async (
  idToken: string,
  rawNonce?: string
): Promise<AuthResponse> => {
  try {
    const firebaseAuth = requireFirebaseAuth();
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken, rawNonce });
    const userCredential = await signInWithCredential(firebaseAuth, credential);
    return await completeFirebaseLogin(firebaseAuth, userCredential.user);
  } catch (error: any) {
    console.error('Apple login error:', error);
    try {
      if (auth?.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (signOutError) {
      console.warn('Firebase sign-out failed after Apple login error:', signOutError);
    }
    return {
      success: false,
      message: formatAuthError(error),
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
      if (response.data.data?.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      notifyAuthChange(true);
      
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

export const getFirebaseUser = (): User | null => {
  if (!hasFirebaseConfig || !auth) {
    return null;
  }
  return auth.currentUser;
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
    
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userData');

    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (signOutError) {
        console.warn('Firebase sign-out error:', signOutError);
      }
    }
    
    // Keep remember me data if enabled
    if (rememberMe !== 'true') {
      await AsyncStorage.removeItem('userEmail');
    }
    notifyAuthChange(false);
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
