/**
 * Achievement Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { Achievement, UserAchievement, PaginatedResponse } from '@/types/api';

export const achievementService = {
  /**
   * Get all achievements
   */
  async getAchievements(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Achievement> | Achievement[]>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Achievement> | Achievement[]>>(
      '/achievements',
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Get achievement by ID
   */
  async getAchievementById(id: string): Promise<ApiResponse<{ achievement: Achievement }>> {
    const response = await apiClient.get<ApiResponse<{ achievement: Achievement }>>(`/achievements/${id}`);
    return response.data;
  },

  /**
   * Get user achievements (current user's own achievements)
   */
  async getMyAchievements(): Promise<ApiResponse<{ achievements: UserAchievement[] }>> {
    const response = await apiClient.get<ApiResponse<{ achievements: UserAchievement[] }>>(
      '/achievements/me/achievements'
    );
    return response.data;
  },

  /**
   * Get user achievements by userId (for teacher/admin)
   */
  async getUserAchievements(userId: string): Promise<ApiResponse<{ achievements: UserAchievement[] }>> {
    const response = await apiClient.get<ApiResponse<{ achievements: UserAchievement[] }>>(
      `/achievements/user/${userId}`
    );
    return response.data;
  },

  /**
   * Create achievement (Teacher only)
   */
  async createAchievement(data: {
    name: string;
    description: string;
    icon: string;
    criteria?: Record<string, unknown>;
  }): Promise<ApiResponse<{ achievement: Achievement }>> {
    const response = await apiClient.post<ApiResponse<{ achievement: Achievement }>>('/achievements', data);
    return response.data;
  },

  /**
   * Update achievement (Teacher only)
   */
  async updateAchievement(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      criteria?: Record<string, unknown>;
    }
  ): Promise<ApiResponse<{ achievement: Achievement }>> {
    const response = await apiClient.put<ApiResponse<{ achievement: Achievement }>>(`/achievements/${id}`, data);
    return response.data;
  },

  /**
   * Delete achievement (Teacher only)
   */
  async deleteAchievement(id: string, force?: boolean): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/achievements/${id}`, {
      params: { force: force || false },
    });
    return response.data;
  },
};

