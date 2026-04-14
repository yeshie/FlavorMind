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
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
  User,
  Auth,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, hasFirebaseConfig, storage } from './firebase';
import { API_CONFIG } from '../../constants/config';

const API_BASE_URL = API_CONFIG.BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

const normalizeStoredToken = (rawToken: string | null) => {
  if (!rawToken) return null;
  const trimmed = rawToken.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || null;
  }
  return trimmed;
};

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

const mergeDefinedAuthFields = (
  baseUser: AuthUser,
  overrideUser?: Partial<AuthUser> | null
): AuthUser => {
  if (!overrideUser) {
    return baseUser;
  }

  const nextUser: AuthUser = { ...baseUser };

  (Object.keys(overrideUser) as Array<keyof AuthUser>).forEach((key) => {
    const value = overrideUser[key];
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    if (typeof value === 'string' && !value.trim()) {
      return;
    }

    nextUser[key] = value as never;
  });

  return nextUser;
};

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

const persistCurrentSession = async (
  user: User,
  overrideUser?: Partial<AuthUser>
): Promise<AuthUser> => {
  const idToken = await user.getIdToken(true);
  const refreshToken = user.refreshToken;
  const mappedUser = mergeDefinedAuthFields(mapFirebaseUser(user), overrideUser);

  await AsyncStorage.setItem('authToken', idToken);
  if (refreshToken) {
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }
  await AsyncStorage.setItem('userData', JSON.stringify(mappedUser));

  return mappedUser;
};

const getImageMimeType = (uri: string) => {
  const normalizedUri = uri.toLowerCase();
  if (normalizedUri.endsWith('.png')) {
    return { extension: 'png', contentType: 'image/png' };
  }
  if (normalizedUri.endsWith('.webp')) {
    return { extension: 'webp', contentType: 'image/webp' };
  }

  return { extension: 'jpg', contentType: 'image/jpeg' };
};

const buildProfilePhotoFormData = (
  photoUri: string,
  fileName: string,
  contentType: string
) => {
  const formData = new FormData();
  formData.append('image', {
    uri: photoUri,
    name: fileName,
    type: contentType,
  } as any);

  return formData;
};

const getFreshAuthToken = async (user: User) => {
  try {
    const authToken = await user.getIdToken(true);
    if (authToken) {
      await AsyncStorage.setItem('authToken', authToken);
    }
    return authToken;
  } catch (tokenError) {
    console.warn('Fresh token request failed during profile upload, using stored token:', tokenError);
    return normalizeStoredToken(await AsyncStorage.getItem('authToken'));
  }
};

const uploadProfilePhotoWithApi = async (
  user: User,
  photoUri: string,
  fileName: string,
  contentType: string
) => {
  const uploadWithToken = async (authToken: string | null) => {
    const uploadResponse = await apiClient.post(
      '/recipes/upload-image',
      buildProfilePhotoFormData(photoUri, fileName, contentType),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': '1',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        timeout: 60000,
      }
    );

    const imageUrl = uploadResponse.data?.data?.imageUrl;
    if (!imageUrl) {
      throw new Error('Profile photo upload did not return an image URL.');
    }

    return imageUrl;
  };

  const authToken = await getFreshAuthToken(user);

  try {
    return await uploadWithToken(authToken);
  } catch (error) {
    const isUnauthorized = axios.isAxiosError(error) && error.response?.status === 401;
    if (!isUnauthorized) {
      throw error;
    }

    const retryToken = await getFreshAuthToken(user);
    return await uploadWithToken(retryToken);
  }
};

const uploadProfilePhoto = async (user: User, photoUri: string) => {
  const userId = user.uid;
  const { extension, contentType } = getImageMimeType(photoUri);
  const fileName = `profile_${userId}_${Date.now()}.${extension}`;

  if (storage) {
    try {
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const storageRef = ref(
        storage,
        `profile-photos/${userId}/avatar-${Date.now()}.${extension}`
      );

      await uploadBytes(storageRef, blob, { contentType });
      return await getDownloadURL(storageRef);
    } catch (storageError) {
      console.warn('Firebase Storage profile upload failed, falling back to API upload:', storageError);
    }
  }

  return await uploadProfilePhotoWithApi(user, photoUri, fileName, contentType);
};

const clearStoredAuth = async (keepRememberedEmail = true) => {
  const rememberMe = keepRememberedEmail
    ? await AsyncStorage.getItem('rememberMe')
    : null;

  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('refreshToken');
  await AsyncStorage.removeItem('userData');

  if (rememberMe !== 'true') {
    await AsyncStorage.removeItem('userEmail');
  }
};

const completeFirebaseLogin = async (
  firebaseAuth: Auth,
  user: User,
  options?: { rememberMe?: boolean; email?: string }
): Promise<AuthResponse> => {
  const idToken = await user.getIdToken();

  const response = await apiClient.post('/auth/login', { idToken });
  if (!response.data?.success) {
    await firebaseSignOut(firebaseAuth);
    return { success: false, message: response.data?.message || 'Login failed' };
  }

  const mappedUser = response.data?.data?.user || mapFirebaseUser(user);

  await persistCurrentSession(user, mappedUser);

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

interface UpdateCurrentUserProfileInput {
  displayName: string;
  photoUri?: string | null;
  removePhoto?: boolean;
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
    const firebaseAuth = requireFirebaseAuth();
    await firebaseSendPasswordResetEmail(firebaseAuth, email);
    return { success: true, message: 'Password reset email sent' };
  } catch (error: any) {
    return {
      success: false,
      message: formatAuthError(error) || 'Failed to send reset email',
    };
  }
};

export const changeCurrentUserEmail = async (
  currentPassword: string,
  newEmail: string
): Promise<AuthResponse> => {
  try {
    const firebaseAuth = requireFirebaseAuth();
    const user = firebaseAuth.currentUser;

    if (!user || !user.email) {
      return { success: false, message: 'You need to sign in again before changing your email.' };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdateEmail(user, newEmail);
    await firebaseSendEmailVerification(user);
    const mappedUser = await persistCurrentSession(user, { email: newEmail });

    notifyAuthChange(true);
    return {
      success: true,
      message: 'Email changed successfully. Please verify your new address.',
      data: {
        token: await user.getIdToken(),
        user: mappedUser,
      },
    };
  } catch (error: any) {
    console.error('Change email error:', error);
    return {
      success: false,
      message: formatAuthError(error),
    };
  }
};

export const changeCurrentUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> => {
  try {
    const firebaseAuth = requireFirebaseAuth();
    const user = firebaseAuth.currentUser;

    if (!user || !user.email) {
      return { success: false, message: 'You need to sign in again before changing your password.' };
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdatePassword(user, newPassword);
    const mappedUser = await persistCurrentSession(user);

    notifyAuthChange(true);
    return {
      success: true,
      message: 'Password changed successfully.',
      data: {
        token: await user.getIdToken(),
        user: mappedUser,
      },
    };
  } catch (error: any) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: formatAuthError(error),
    };
  }
};

export const updateCurrentUserProfile = async ({
  displayName,
  photoUri,
  removePhoto = false,
}: UpdateCurrentUserProfileInput): Promise<AuthResponse> => {
  try {
    const firebaseAuth = requireFirebaseAuth();
    const user = firebaseAuth.currentUser;

    if (!user) {
      return { success: false, message: 'Please sign in again before editing your profile.' };
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      return { success: false, message: 'Please enter your name.' };
    }

    let nextPhotoURL = user.photoURL || null;
    if (removePhoto) {
      nextPhotoURL = null;
    } else if (photoUri) {
      nextPhotoURL = await uploadProfilePhoto(user, photoUri);
    }

    await updateProfile(user, {
      displayName: trimmedName,
      photoURL: nextPhotoURL,
    });

    const mappedUser = await persistCurrentSession(user);

    notifyAuthChange(true);
    return {
      success: true,
      message: 'Profile updated successfully.',
      data: {
        token: await user.getIdToken(),
        user: mappedUser,
      },
    };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: formatAuthError(error) || 'Failed to update profile.',
    };
  }
};

// ============= USER MANAGEMENT =============

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    const storedUser = userData ? JSON.parse(userData) as Partial<AuthUser> : null;
    const firebaseUser = getFirebaseUser();

    if (firebaseUser) {
      return mergeDefinedAuthFields(mapFirebaseUser(firebaseUser), storedUser);
    }

    if (!storedUser) {
      return null;
    }

    return {
      uid: storedUser.uid || '',
      email: storedUser.email || '',
      displayName:
        storedUser.displayName
        || storedUser.email?.split('@')[0]
        || 'User',
      photoURL: storedUser.photoURL || undefined,
      emailVerified:
        typeof storedUser.emailVerified === 'boolean'
          ? storedUser.emailVerified
          : false,
    };
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

export const subscribeToFirebaseUser = (listener: (user: User | null) => void) => {
  if (!hasFirebaseConfig || !auth) {
    listener(null);
    return () => {};
  }

  return onAuthStateChanged(auth, listener);
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
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (signOutError) {
        console.warn('Firebase sign-out error:', signOutError);
      }
    }

    await clearStoredAuth(true);
    notifyAuthChange(false);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const handleExpiredSession = async (): Promise<void> => {
  try {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (signOutError) {
        console.warn('Firebase sign-out error after session expiry:', signOutError);
      }
    }

    await clearStoredAuth(true);
  } finally {
    notifyAuthChange(false);
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
