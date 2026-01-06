/**
 * API Configuration
 * Base URL and axios instance setup
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Get API base URL with validation
 * Ensures the URL always ends with /seniku/api/v1
 */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Default for development
  const defaultUrl = 'http://localhost:8989/seniku/api/v1';
  
  if (!envUrl) {
    return defaultUrl;
  }
  
  // Remove trailing slash
  let baseUrl = envUrl.trim().replace(/\/+$/, '');
  
  // If URL doesn't end with /api/v1, append it
  if (!baseUrl.endsWith('/api/v1')) {
    // If URL ends with /seniku, just append /api/v1
    if (baseUrl.endsWith('/seniku')) {
      baseUrl = `${baseUrl}/api/v1`;
    } else {
      // Otherwise, append /seniku/api/v1
      baseUrl = `${baseUrl}/seniku/api/v1`;
    }
  }
  
  return baseUrl;
}

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthToken();
        window.location.href = '/auth';
        processQueue(new Error('No refresh token'), null);
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        setAuthToken(accessToken, refreshToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthToken();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to get refresh token
export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.refreshToken || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to set auth token
export const setAuthToken = (accessToken: string, refreshToken?: string) => {
  if (typeof window === 'undefined') return;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      userData.accessToken = accessToken;
      if (refreshToken) {
        userData.refreshToken = refreshToken;
      }
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      // If parsing fails, create new user object
      localStorage.setItem('user', JSON.stringify({ accessToken, refreshToken }));
    }
  } else {
    localStorage.setItem('user', JSON.stringify({ accessToken, refreshToken }));
  }
};

// Helper function to clear auth token
export const clearAuthToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
};

// Helper function to get user data
export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  return null;
};

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

// API Error type
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
  statusCode?: number;
}

// Log API base URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}
