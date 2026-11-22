import { authFetch } from './authApi';
import type {
  ModerationReportsResponse,
  ModerationActionResponse,
  SubmitReportPayload,
} from '../types/moderation';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/v1';

export const moderationApi = {
  /**
   * Admin: Lấy danh sách báo cáo vi phạm
   * GET /api/v1/admin/moderation/reports
   */
  async getReports(params?: {
    status?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<ModerationReportsResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const url = qs
      ? `${API_BASE}/admin/moderation/reports?${qs}`
      : `${API_BASE}/admin/moderation/reports`;

    const res = await authFetch(url);
    if (!res.ok) {
      return {
        success: false,
        message: 'Không thể tải danh sách báo cáo',
        data: {
          reports: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          summary: { total: 0, pending: 0, resolved: 0, dismissed: 0 },
        },
      };
    }
    return parseJsonSafe<ModerationReportsResponse>(
      res,
      'Không thể đọc dữ liệu báo cáo',
    );
  },

  /**
   * Admin: Xử lý báo cáo (Sequence Diagram 3.2.26)
   * PUT /api/v1/admin/moderation/reports/:id
   */
  async moderateReport(
    reportId: string,
    action: 'DISMISS' | 'HIDE_OR_DELETE',
    moderationAction?: 'HIDE' | 'DELETE',
  ): Promise<ModerationActionResponse> {
    const res = await authFetch(
      `${API_BASE}/admin/moderation/reports/${reportId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ action, moderationAction }),
      },
    );
    return parseJsonSafe<ModerationActionResponse>(
      res,
      'Không thể xử lý báo cáo',
    );
  },

  /**
   * Admin: Khóa tài khoản vi phạm (Exception Flow 5b)
   * POST /api/v1/admin/moderation/lock-account/:userId
   */
  async lockAccount(
    userId: string,
    days: number = 7,
  ): Promise<ModerationActionResponse> {
    const res = await authFetch(
      `${API_BASE}/admin/moderation/lock-account/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify({ days }),
      },
    );
    return parseJsonSafe<ModerationActionResponse>(
      res,
      'Không thể khóa tài khoản',
    );
  },

  /**
   * User: Báo cáo nội dung vi phạm
   * POST /api/v1/moderation/report
   */
  async submitReport(
    payload: SubmitReportPayload,
  ): Promise<{ success: boolean; message?: string }> {
    const res = await authFetch(`${API_BASE}/moderation/report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<{ success: boolean; message?: string }>(
      res,
      'Không thể gửi báo cáo',
    );
  },
};
