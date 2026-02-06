/**
 * Certificate Service
 */
import { apiClient } from '@/config/api';
import type { ApiResponse } from '@/config/api';

export interface Certificate {
  id: string;
  submissionId: string;
  studentId: string;
  studentName: string;
  artworkTitle: string;
  mediaTypeId?: string;
  mediaTypeName?: string;
  artworkSize?: string;
  yearCreated?: number;
  description?: string;
  createdAt: string;
}

export interface CertificateData {
  id: string;
  token: string;
  studentName: string;
  artworkTitle: string;
  mediaTypeName: string;
  artworkSize: string;
  yearCreated: number;
  description: string;
  imageUrl: string;
}

export const certificateService = {
  /**
   * Create a certificate for a graded submission
   */
  async createCertificate(submissionId: string): Promise<ApiResponse<{ certificate: Certificate }>> {
    const response = await apiClient.post<any>('/certificates', {
      submissionId,
    });
    return response.data;
  },

  /**
   * Get certificate data as JSON (for page render)
   */
  async getCertificateData(token: string): Promise<ApiResponse<CertificateData>> {
    const response = await apiClient.get(`/certificates/${token}`, {
      headers: { 'Accept': 'application/json' },
    });
    const data = response.data as ApiResponse<CertificateData>;
    return { success: true, message: data.message || '', data: data.data };
  },

  /**
   * Get certificate by token (renders HTML view for print)
   */
  async getCertificateHTML(token: string): Promise<string> {
    const response = await apiClient.get(`/certificates/${token}`, {
      headers: { 'Accept': 'text/html' },
    });
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  },

  /**
   * Open certificate in new tab
   */
  openCertificateInNewTab(token: string) {
    const certificateUrl = `/api/certificates/${token}`;
    window.open(certificateUrl, '_blank');
  },
};
