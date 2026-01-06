/**
 * Notification Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type { Notification, PaginatedResponse } from '@/types/api';

export const notificationService = {
  /**
   * Get all notifications for current user
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Get notification by ID
   */
  async getNotificationById(id: string): Promise<ApiResponse<{ notification: Notification }>> {
    const response = await apiClient.get<ApiResponse<{ notification: Notification }>>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<{ notification: Notification }>> {
    const response = await apiClient.put<ApiResponse<{ notification: Notification }>>(
      `/notifications/${id}/read`
    );
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.put<ApiResponse<{ count: number }>>('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread/count');
    return response.data;
  },
};

