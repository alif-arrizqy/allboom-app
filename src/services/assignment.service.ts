/**
 * Assignment Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type {
  Assignment,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  PaginatedResponse,
} from '@/types/api';

export const assignmentService = {
  /**
   * Get all assignments with pagination and filters
   */
  async getAssignments(params?: {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
    categoryId?: string;
    classId?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Assignment>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Assignment>>>('/assignments', {
      params,
    });
    return response.data;
  },

  /**
   * Get assignment by ID
   */
  async getAssignmentById(id: string): Promise<ApiResponse<{ assignment: Assignment }>> {
    const response = await apiClient.get<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`);
    return response.data;
  },

  /**
   * Create new assignment
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<ApiResponse<{ assignment: Assignment }>> {
    const response = await apiClient.post<ApiResponse<{ assignment: Assignment }>>('/assignments', data);
    return response.data;
  },

  /**
   * Update assignment
   */
  async updateAssignment(
    id: string,
    data: UpdateAssignmentRequest
  ): Promise<ApiResponse<{ assignment: Assignment }>> {
    const response = await apiClient.put<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}`, data);
    return response.data;
  },

  /**
   * Delete assignment
   */
  async deleteAssignment(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/assignments/${id}`);
    return response.data;
  },

  /**
   * Bulk update assignment status
   */
  async bulkUpdateStatus(data: {
    assignmentIds: string[];
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  }): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.put<ApiResponse<{ count: number }>>('/assignments/bulk-status', data);
    return response.data;
  },

  /**
   * Bulk delete assignments
   */
  async bulkDelete(data: {
    assignmentIds: string[];
    action?: 'delete' | 'draft'; // Optional: 'delete' or 'draft'
  }): Promise<ApiResponse<{ count: number }>> {
    const response = await apiClient.delete<ApiResponse<{ count: number }>>('/assignments/bulk-delete', {
      data,
    });
    return response.data;
  },
};

