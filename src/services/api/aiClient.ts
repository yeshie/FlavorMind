import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { AI_CONFIG } from '../../constants/config';

const aiClient: AxiosInstance = axios.create({
  baseURL: AI_CONFIG.BASE_URL,
  timeout: AI_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '1',
  },
});

aiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`[ai:res] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      console.error('[ai] API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default aiClient;
