import { authFetch } from './authApi';
import type {
  ApplicationsResponse,
  InstructorApplicationItem,
  SubmitApplicationPayload,
} from '../types/instructorApplication';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/v1';

export const instructorApplicationApi = {
  /**
   * Học viên gửi đơn đăng ký làm Giảng viên
   * POST /api/v1/instructor/apply
   */
  async submitApplication(
    payload: SubmitApplicationPayload,
  ): Promise<{ success: boolean; message?: string; data?: InstructorApplicationItem }> {
    const res = await authFetch(`${API_BASE}/instructor/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<{ success: boolean; message?: string; data?: InstructorApplicationItem }>(
      res,
      'Không thể gửi đơn đăng ký',
    );
  },

  /**
   * Học viên lấy đơn đăng ký của mình
   * GET /api/v1/instructor/my-application
   */
  async getMyApplication(): Promise<{
    success: boolean;
    data: InstructorApplicationItem | null;
  }> {
    const res = await authFetch(`${API_BASE}/instructor/my-application`);
    if (!res.ok) {
      return { success: false, data: null };
    }
    return parseJsonSafe<{ success: boolean; data: InstructorApplicationItem | null }>(
      res,
      'Không thể đọc đơn đăng ký',
    );
  },

  /**
   * Admin lấy danh sách đơn đăng ký
   * GET /api/v1/admin/instructor-applications
   */
  async getApplications(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApplicationsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const url = qs
      ? `${API_BASE}/admin/instructor-applications?${qs}`
      : `${API_BASE}/admin/instructor-applications`;

    const res = await authFetch(url);
    if (!res.ok) {
      return {
        success: false,
        message: 'Không thể tải danh sách đơn đăng ký',
        data: {
          applications: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
        },
      };
    }
    return parseJsonSafe<ApplicationsResponse>(
      res,
      'Không thể đọc dữ liệu đơn đăng ký',
    );
  },

  /**
   * Admin duyệt đơn -> Cấp quyền INSTRUCTOR
   * PUT /api/v1/admin/instructor-applications/:id/approve
   */
  async approveApplication(
    id: string,
  ): Promise<{ success: boolean; message?: string; data?: InstructorApplicationItem }> {
    const res = await authFetch(
      `${API_BASE}/admin/instructor-applications/${id}/approve`,
      { method: 'PUT' },
    );
    return parseJsonSafe<{ success: boolean; message?: string; data?: InstructorApplicationItem }>(
      res,
      'Không thể phê duyệt đơn',
    );
  },

  /**
   * Admin từ chối đơn
   * PUT /api/v1/admin/instructor-applications/:id/reject
   */
  async rejectApplication(
    id: string,
    reason?: string,
  ): Promise<{ success: boolean; message?: string; data?: InstructorApplicationItem }> {
    const res = await authFetch(
      `${API_BASE}/admin/instructor-applications/${id}/reject`,
      {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      },
    );
    return parseJsonSafe<{ success: boolean; message?: string; data?: InstructorApplicationItem }>(
      res,
      'Không thể từ chối đơn',
    );
  },
};
