/**
 * Class Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { Class, PaginatedResponse } from '@/types/api';

export const classService = {
  /**
   * Get all classes
   */
  async getClasses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    teacherId?: string; // Filter classes by teacher ID
  }): Promise<ApiResponse<PaginatedResponse<Class> | Class[]>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Class> | Class[]>>('/classes', {
      params,
    });
    return response.data;
  },

  /**
   * Get class by ID
   */
  async getClassById(id: string): Promise<ApiResponse<{ class: Class }>> {
    const response = await apiClient.get<ApiResponse<{ class: Class }>>(`/classes/${id}`);
    return response.data;
  },

  /**
   * Create new class
   */
  async createClass(data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<{ class: Class }>> {
    const response = await apiClient.post<ApiResponse<{ class: Class }>>('/classes', data);
    return response.data;
  },

  /**
   * Update class
   */
  async updateClass(
    id: string,
    data: {
      name?: string;
      description?: string;
    }
  ): Promise<ApiResponse<{ class: Class }>> {
    const response = await apiClient.put<ApiResponse<{ class: Class }>>(`/classes/${id}`, data);
    return response.data;
  },

  /**
   * Delete class
   */
  async deleteClass(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/classes/${id}`);
    return response.data;
  },
};

