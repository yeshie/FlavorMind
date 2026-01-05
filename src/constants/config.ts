// src/constants/config.ts

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.flavormind.com',
  TIMEOUT: 10000,
};

export const DOA_CONFIG = {
  BASE_URL: 'https://doa.gov.lk/api',
  API_KEY: process.env.EXPO_PUBLIC_DOA_API_KEY || '',
};

export const APP_CONFIG = {
  APP_NAME: 'FlavorMind',
  APP_VERSION: '1.0.0',
  DEFAULT_LOCATION: {
    city: 'Colombo',
    country: 'Sri Lanka',
  },
};