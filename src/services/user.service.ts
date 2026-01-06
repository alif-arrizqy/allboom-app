/**
 * User Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { User, UpdateUserRequest, PaginatedResponse } from '@/types/api';

export interface CreateUserRequest {
  email?: string;
  nip?: string;
  nis?: string;
  password: string;
  name: string;
  role: 'STUDENT' | 'TEACHER';
  phone?: string;
  address?: string;
  bio?: string;
  birthdate?: string;
  classId?: string; // Required untuk STUDENT
  classIds?: string[]; // Optional untuk TEACHER
}

export const userService = {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: 'TEACHER' | 'STUDENT' | 'ADMIN';
    classId?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params,
    });
    return response.data;
  },

  /**
   * Create new user (Teacher only)
   */
  async createUser(data: CreateUserRequest): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/users', data);
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<{ user: User }>> {
    // Check if we need FormData (for file upload) or JSON (for regular updates)
    const hasFile = data.avatar !== undefined;
    
    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData();
      if (data.name) {
        formData.append('name', data.name);
      }
      if (data.phone) {
        formData.append('phone', data.phone);
      }
      if (data.address) {
        formData.append('address', data.address);
      }
      if (data.bio) {
        formData.append('bio', data.bio);
      }
      if (data.birthdate) {
        formData.append('birthdate', data.birthdate);
      }
      if (data.avatar) {
        formData.append('avatar', data.avatar);
      }
      if (data.classId) {
        formData.append('classId', data.classId);
      }
      if (data.classIds && data.classIds.length > 0) {
        // Append each classId separately for FormData
        data.classIds.forEach((classId) => {
          formData.append('classIds[]', classId);
        });
      }

      const response = await apiClient.put<ApiResponse<{ user: User }>>(`/users/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Use JSON for regular updates
      // For classIds array, send as JSON array
      const jsonData: UpdateUserRequest & { classIds?: string[] } = { ...data };
      if (data.classIds && data.classIds.length > 0) {
        jsonData.classIds = data.classIds;
      }
      const response = await apiClient.put<ApiResponse<{ user: User }>>(`/users/${id}`, jsonData);
      return response.data;
    }
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },

  /**
   * Import students from Excel file
   */
  async importStudents(file: File): Promise<ApiResponse<{
    total: number;
    success: number;
    failed: number;
    errors: Array<{
      row: number;
      nis: string;
      error: string;
    }>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<{
      total: number;
      success: number;
      failed: number;
      errors: Array<{
        row: number;
        nis: string;
        error: string;
      }>;
    }>>('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

