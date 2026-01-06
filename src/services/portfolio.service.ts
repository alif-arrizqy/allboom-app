/**
 * Portfolio Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type {
  Portfolio,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  PaginatedResponse,
} from '@/types/api';

export const portfolioService = {
  /**
   * Get all portfolios with pagination and filters
   */
  async getPortfolios(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    studentId?: string;
    classId?: string;
    search?: string;
    minGrade?: number;
    sortBy?: 'grade' | 'submittedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ items: Portfolio[]; pagination: PaginatedResponse<Portfolio>['pagination'] }>> {
    const response = await apiClient.get<ApiResponse<{ items: Portfolio[]; pagination: PaginatedResponse<Portfolio>['pagination'] }>>('/portfolio', {
      params,
    });
    return response.data;
  },

  /**
   * Get portfolio by ID
   */
  async getPortfolioById(id: string): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    const response = await apiClient.get<ApiResponse<{ portfolio: Portfolio }>>(`/portfolio/${id}`);
    return response.data;
  },

  /**
   * Create new portfolio (with file upload)
   */
  async createPortfolio(data: CreatePortfolioRequest): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('image', data.image);
    if (data.categoryId) {
      formData.append('categoryId', data.categoryId);
    }
    if (data.isPublic !== undefined) {
      formData.append('isPublic', data.isPublic.toString());
    }

    const response = await apiClient.post<ApiResponse<{ portfolio: Portfolio }>>(
      '/portfolio',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Update portfolio (with optional file upload)
   */
  async updatePortfolio(
    id: string,
    data: UpdatePortfolioRequest
  ): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    const formData = new FormData();
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.description !== undefined) {
      formData.append('description', data.description || '');
    }
    if (data.image) {
      formData.append('image', data.image);
    }
    if (data.categoryId) {
      formData.append('categoryId', data.categoryId);
    }
    if (data.isPublic !== undefined) {
      formData.append('isPublic', data.isPublic.toString());
    }

    const response = await apiClient.put<ApiResponse<{ portfolio: Portfolio }>>(
      `/portfolio/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Delete portfolio
   */
  async deletePortfolio(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/portfolio/${id}`);
    return response.data;
  },

  /**
   * Like portfolio
   */
  async likePortfolio(id: string): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    const response = await apiClient.post<ApiResponse<{ portfolio: Portfolio }>>(`/portfolio/${id}/like`);
    return response.data;
  },

  /**
   * Unlike portfolio
   */
  async unlikePortfolio(id: string): Promise<ApiResponse<{ portfolio: Portfolio }>> {
    const response = await apiClient.delete<ApiResponse<{ portfolio: Portfolio }>>(`/portfolio/${id}/like`);
    return response.data;
  },
};

