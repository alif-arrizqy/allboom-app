/**
 * Category Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { Category, PaginatedResponse } from '@/types/api';

export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Category> | Category[]>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Category> | Category[]>>('/categories', {
      params,
    });
    return response.data;
  },

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<ApiResponse<{ category: Category }>> {
    const response = await apiClient.get<ApiResponse<{ category: Category }>>(`/categories/${id}`);
    return response.data;
  },

  /**
   * Create new category
   */
  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
  }): Promise<ApiResponse<{ category: Category }>> {
    const response = await apiClient.post<ApiResponse<{ category: Category }>>('/categories', data);
    return response.data;
  },

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<{ category: Category }>> {
    const response = await apiClient.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete category
   */
  async deleteCategory(id: string, force?: boolean): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/categories/${id}`, {
      params: { force: force || false },
    });
    return response.data;
  },
};

