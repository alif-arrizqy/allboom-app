/**
 * Authentication Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LoginResponse,
  RefreshTokenResponse,
  User,
} from '@/types/api';

export const authService = {
  /**
   * Login with NIP (for TEACHER) or NIS (for STUDENT)
   */
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', data);
    return response.data;
  },

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },
};

