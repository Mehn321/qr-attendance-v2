import axios, { AxiosError } from 'axios';
import { authStore } from '../store/authStore';
import * as SecureStore from 'expo-secure-store';

// OFFLINE MODE - Set to true to work without backend
export const OFFLINE_MODE = true;

// Use 10.0.2.2 on Android emulator, localhost on physical device
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

console.log('🌐 API Client Mode:', OFFLINE_MODE ? '📱 OFFLINE MODE' : '🔌 ONLINE MODE');
console.log('API Client configured with base URL:', API_BASE_URL);

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token from SecureStore:', error);
  }
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.data);
    return response;
  },
  async (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'unknown';
    
    console.error(`❌ API Error [${error.response?.status || 'NO_RESPONSE'}] ${method} ${url}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Unauthorized (401) - Clearing auth');
      await authStore.getState().clearAuth();
    }

    return Promise.reject(error);
  }
);

export const useApi = () => {
  return { apiClient };
};
