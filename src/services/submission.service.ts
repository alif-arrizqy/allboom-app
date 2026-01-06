/**
 * Submission Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';
import type {
  Submission,
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  PaginatedResponse,
} from '@/types/api';

export const submissionService = {
  /**
   * Get all submissions with pagination and filters
   */
  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    assignmentId?: string;
    studentId?: string;
    status?: 'NOT_SUBMITTED' | 'PENDING' | 'REVISION' | 'GRADED';
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Submission>>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Submission>>>('/submissions', {
      params,
    });
    return response.data;
  },

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: string): Promise<ApiResponse<{ submission: Submission }>> {
    const response = await apiClient.get<ApiResponse<{ submission: Submission }>>(`/submissions/${id}`);
    return response.data;
  },

  /**
   * Create new submission (with file upload)
   */
  async createSubmission(data: CreateSubmissionRequest): Promise<ApiResponse<{ submission: Submission }>> {
    const formData = new FormData();
    formData.append('assignmentId', data.assignmentId);
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('image', data.image);

    const response = await apiClient.post<ApiResponse<{ submission: Submission }>>(
      '/submissions',
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
   * Update submission (with optional file upload)
   */
  async updateSubmission(
    id: string,
    data: UpdateSubmissionRequest
  ): Promise<ApiResponse<{ submission: Submission }>> {
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

    const response = await apiClient.put<ApiResponse<{ submission: Submission }>>(
      `/submissions/${id}`,
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
   * Delete submission
   */
  async deleteSubmission(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/submissions/${id}`);
    return response.data;
  },

  /**
   * Grade submission (Teacher only)
   */
  async gradeSubmission(
    id: string,
    data: { grade: number; feedback?: string }
  ): Promise<ApiResponse<{ submission: Submission }>> {
    const response = await apiClient.post<ApiResponse<{ submission: Submission }>>(
      `/submissions/${id}/grade`,
      data
    );
    return response.data;
  },

  /**
   * Return submission for revision (Teacher only)
   */
  async returnForRevision(
    id: string,
    data: { revisionNote: string }
  ): Promise<ApiResponse<{ submission: Submission }>> {
    const response = await apiClient.post<ApiResponse<{ submission: Submission }>>(
      `/submissions/${id}/revision`,
      data
    );
    return response.data;
  },
};

