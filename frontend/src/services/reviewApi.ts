import { authFetch } from './authApi';
import type {
  CourseReviewsApiResponse,
  CourseReviewItem,
  InstructorReviewsApiResponse,
} from '../types/review';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/v1';

export const reviewApi = {
  /**
   * Lấy danh sách đánh giá của khóa học (kèm phân bố sao và thông tin người dùng)
   * GET /api/v1/courses/:courseId/reviews
   */
  async getCourseReviews(courseIdOrSlug: string): Promise<CourseReviewsApiResponse> {
    const res = await authFetch(`${API_BASE}/courses/${encodeURIComponent(courseIdOrSlug)}/reviews`);
    if (!res.ok) {
      const err = await parseJsonSafe<{ success: boolean; message?: string }>(
        res,
        'Không thể tải danh sách đánh giá',
      );
      return {
        success: false,
        message: err.message,
        data: {
          reviews: [],
          stats: {
            averageRating: 5.0,
            totalReviews: 0,
            starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            starPercentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 100 },
          },
          userMeta: {
            isEnrolled: false,
            isCourseOwner: false,
            hasReviewed: false,
          },
        },
      };
    }
    return parseJsonSafe<CourseReviewsApiResponse>(
      res,
      'Không thể đọc dữ liệu đánh giá',
    );
  },

  /**
   * Học viên gửi đánh giá mới hoặc cập nhật nhận xét
   * POST /api/v1/courses/:courseId/reviews
   */
  async submitCourseReview(
    courseIdOrSlug: string,
    rating: number,
    comment: string,
  ): Promise<{ success: boolean; message?: string; data?: CourseReviewItem }> {
    const res = await authFetch(`${API_BASE}/courses/${encodeURIComponent(courseIdOrSlug)}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    return parseJsonSafe<{ success: boolean; message?: string; data?: CourseReviewItem }>(
      res,
      'Không thể gửi đánh giá',
    );
  },

  /**
   * Giảng viên / Admin gửi phản hồi trực tiếp đánh giá của học viên (UC23 - SD 3.2.23)
   * POST /api/v1/reviews/:id/reply
   */
  async replyToReview(
    reviewId: string,
    instructorReply: string,
  ): Promise<{ success: boolean; message?: string; data?: CourseReviewItem }> {
    const res = await authFetch(`${API_BASE}/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ instructorReply }),
    });
    return parseJsonSafe<{ success: boolean; message?: string; data?: CourseReviewItem }>(
      res,
      'Không thể gửi phản hồi',
    );
  },

  /**
   * Chỉnh sửa phản hồi đã gửi (Alternative Flow 4a1)
   * PUT /api/v1/reviews/:id/reply
   */
  async updateReviewReply(
    reviewId: string,
    instructorReply: string,
  ): Promise<{ success: boolean; message?: string; data?: CourseReviewItem }> {
    const res = await authFetch(`${API_BASE}/reviews/${reviewId}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ instructorReply }),
    });
    return parseJsonSafe<{ success: boolean; message?: string; data?: CourseReviewItem }>(
      res,
      'Không thể cập nhật phản hồi',
    );
  },

  /**
   * Xóa phản hồi đánh giá (Alternative Flow 4a2)
   * DELETE /api/v1/reviews/:id/reply
   */
  async deleteReviewReply(
    reviewId: string,
  ): Promise<{ success: boolean; message?: string; data?: CourseReviewItem }> {
    const res = await authFetch(`${API_BASE}/reviews/${reviewId}/reply`, {
      method: 'DELETE',
    });
    return parseJsonSafe<{ success: boolean; message?: string; data?: CourseReviewItem }>(
      res,
      'Không thể xóa phản hồi',
    );
  },

  /**
   * Giảng viên / Admin lấy danh sách đánh giá của các khóa học mình quản lý
   * GET /api/v1/instructor/reviews?status=all|unreplied|replied&courseId=...
   */
  async getInstructorReviews(params?: {
    status?: 'all' | 'unreplied' | 'replied';
    courseId?: string;
  }): Promise<InstructorReviewsApiResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.courseId) query.set('courseId', params.courseId);

    const qs = query.toString();
    const url = qs ? `${API_BASE}/instructor/reviews?${qs}` : `${API_BASE}/instructor/reviews`;

    const res = await authFetch(url);
    if (!res.ok) {
      const err = await parseJsonSafe<{ success: boolean; message?: string }>(
        res,
        'Không thể tải danh sách đánh giá của giảng viên',
      );
      return {
        success: false,
        message: err.message,
        data: {
          reviews: [],
          courses: [],
          summary: {
            totalReviews: 0,
            unrepliedCount: 0,
            repliedCount: 0,
            responseRate: 100,
          },
        },
      };
    }
    return parseJsonSafe<InstructorReviewsApiResponse>(
      res,
      'Không thể đọc dữ liệu đánh giá của giảng viên',
    );
  },
};
