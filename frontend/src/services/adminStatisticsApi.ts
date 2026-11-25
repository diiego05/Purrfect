import { authFetch } from './authApi';
import type { AdminStatisticsApiResponse } from '../types/adminStatistics';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/v1/admin/statistics';

export const adminStatisticsApi = {
  /**
   * Lấy toàn bộ dữ liệu thống kê tổng thể cho Admin Dashboard:
   * Doanh thu theo tháng (sơ đồ đường), tăng giảm số lượng giảng viên, độ ổn định của AI gợi ý
   */
  async getStatistics(year?: number): Promise<AdminStatisticsApiResponse> {
    try {
      const query = year ? `?year=${year}` : '';
      let res = await authFetch(`${API_BASE}${query}`);
      if (!res.ok) {
        res = await authFetch(`/api/admin/statistics${query}`);
      }
      return parseJsonSafe<AdminStatisticsApiResponse>(
        res,
        'Không thể tải dữ liệu thống kê quản trị viên',
      );
    } catch (error) {
      console.error('[adminStatisticsApi] getStatistics error:', error);
      throw error;
    }
  },
};
