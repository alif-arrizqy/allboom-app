/**
 * Dashboard Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { DashboardOverview } from '@/types/api';

export const dashboardService = {
  /**
   * Get dashboard overview (automatically returns teacher or student data based on role)
   */
  async getOverview(): Promise<ApiResponse<DashboardOverview>> {
    const response = await apiClient.get<ApiResponse<DashboardOverview>>('/dashboard/overview');
    return response.data;
  },
};

