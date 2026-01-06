/**
 * Export Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';

export interface ExportGradesRequest {
  classIds?: string[];
  assignmentIds?: string[];
  studentIds?: string[];
  statuses?: string[];
  startDate?: string;
  endDate?: string;
  format?: 'summary' | 'detailed'; // For PDF only
}

export const exportService = {
  /**
   * Export grades to Excel file
   * POST /export/grades/excel
   */
  async exportGradesExcel(data: ExportGradesRequest): Promise<Blob> {
    const response = await apiClient.post('/export/grades/excel', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export grades to PDF file
   * POST /export/grades/pdf
   */
  async exportGradesPDF(data: ExportGradesRequest): Promise<Blob> {
    const response = await apiClient.post('/export/grades/pdf', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export student report card as PDF
   * GET /export/report-card/:id
   */
  async exportReportCard(studentId: string, format: 'summary' | 'detailed' = 'detailed'): Promise<Blob> {
    const response = await apiClient.get(`/export/report-card/${studentId}`, {
      responseType: 'blob',
      params: { format },
    });
    return response.data;
  },
};

