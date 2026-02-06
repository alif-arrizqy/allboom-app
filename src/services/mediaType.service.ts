/**
 * Media Type Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { MediaType, PaginatedResponse } from '@/types/api';

export const mediaTypeService = {
  /**
   * Get all media types
   */
  async getMediaTypes(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<MediaType> | MediaType[]>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MediaType> | MediaType[]>>('/media-types', {
      params,
    });
    return response.data;
  },

  /**
   * Get media type by ID
   */
  async getMediaTypeById(id: string): Promise<ApiResponse<{ mediaType: MediaType }>> {
    const response = await apiClient.get<ApiResponse<{ mediaType: MediaType }>>(`/media-types/${id}`);
    return response.data;
  },

  /**
   * Create new media type
   */
  async createMediaType(data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<{ mediaType: MediaType }>> {
    const response = await apiClient.post<ApiResponse<{ mediaType: MediaType }>>('/media-types', data);
    return response.data;
  },

  /**
   * Update media type
   */
  async updateMediaType(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<{ mediaType: MediaType }>> {
    const response = await apiClient.put<ApiResponse<{ mediaType: MediaType }>>(`/media-types/${id}`, data);
    return response.data;
  },

  /**
   * Delete media type
   */
  async deleteMediaType(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/media-types/${id}`);
    return response.data;
  },
};
