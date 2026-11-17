import { authFetch } from './authApi';
import type {
  DiscussionsApiResponse,
  DiscussionSingleApiResponse,
  DiscussionQuestion,
  DiscussionReply,
  NotificationItem,
} from '../types/discussion';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/v1';

export const discussionApi = {
  /**
   * Lấy danh sách câu hỏi và phản hồi của bài giảng
   * GET /api/v1/lectures/:id/discussions
   */
  async getLectureDiscussions(
    lectureId: string,
    courseId?: string,
  ): Promise<DiscussionsApiResponse> {
    const url = courseId
      ? `${API_BASE}/lectures/${lectureId}/discussions?courseId=${encodeURIComponent(courseId)}`
      : `${API_BASE}/lectures/${lectureId}/discussions`;

    const res = await authFetch(url);
    if (!res.ok) {
      const err = await parseJsonSafe<{ success: boolean; message?: string; isEnrolled?: boolean }>(
        res,
        'Không thể tải danh sách thảo luận',
      );
      return {
        success: false,
        message: err.message || 'Không thể tải thảo luận',
        isEnrolled: err.isEnrolled,
        data: [],
        meta: {
          totalQuestions: 0,
          totalReplies: 0,
          isCourseInstructor: false,
          isAdmin: false,
          isEnrolled: false,
        },
      };
    }
    return parseJsonSafe<DiscussionsApiResponse>(
      res,
      'Không thể đọc dữ liệu thảo luận',
    );
  },

  /**
   * Đăng câu hỏi mới cho bài giảng
   * POST /api/v1/lectures/:id/discussions
   */
  async createQuestion(
    lectureId: string,
    content: string,
    courseId?: string,
  ): Promise<DiscussionSingleApiResponse<DiscussionQuestion>> {
    const res = await authFetch(`${API_BASE}/lectures/${lectureId}/discussions`, {
      method: 'POST',
      body: JSON.stringify({ content, courseId }),
    });

    return parseJsonSafe<DiscussionSingleApiResponse<DiscussionQuestion>>(
      res,
      'Không thể đăng câu hỏi',
    );
  },

  /**
   * Trả lời / phản hồi một câu hỏi
   * POST /api/v1/discussions/:id/replies
   */
  async createReply(
    parentDiscussionId: string,
    content: string,
  ): Promise<DiscussionSingleApiResponse<DiscussionReply>> {
    const res = await authFetch(
      `${API_BASE}/discussions/${parentDiscussionId}/replies`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    );

    return parseJsonSafe<DiscussionSingleApiResponse<DiscussionReply>>(
      res,
      'Không thể gửi phản hồi',
    );
  },

  /**
   * Giảng viên ghim / bỏ ghim câu trả lời chính thức
   * PATCH /api/v1/discussions/:replyId/pin
   */
  async togglePin(
    replyId: string,
    isPinned?: boolean,
  ): Promise<{ success: boolean; message?: string; data?: DiscussionReply }> {
    const res = await authFetch(`${API_BASE}/discussions/${replyId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify(isPinned !== undefined ? { isPinned } : {}),
    });

    return parseJsonSafe<{ success: boolean; message?: string; data?: DiscussionReply }>(
      res,
      'Không thể cập nhật trạng thái ghim',
    );
  },

  /**
   * Thích hoặc bỏ thích câu hỏi / phản hồi
   * PATCH /api/v1/discussions/:id/upvote
   */
  async toggleUpvote(
    discussionId: string,
  ): Promise<{ success: boolean; data?: { upvoteCount: number; isUpvoted: boolean } }> {
    const res = await authFetch(
      `${API_BASE}/discussions/${discussionId}/upvote`,
      {
        method: 'PATCH',
      },
    );

    return parseJsonSafe<{ success: boolean; data?: { upvoteCount: number; isUpvoted: boolean } }>(
      res,
      'Không thể thích thảo luận',
    );
  },

  /**
   * Xóa câu hỏi / phản hồi
   * DELETE /api/v1/discussions/:id
   */
  async deleteDiscussion(
    discussionId: string,
  ): Promise<{ success: boolean; message?: string }> {
    const res = await authFetch(`${API_BASE}/discussions/${discussionId}`, {
      method: 'DELETE',
    });

    return parseJsonSafe<{ success: boolean; message?: string }>(
      res,
      'Không thể xóa thảo luận',
    );
  },

  /**
   * Lấy danh sách thông báo
   * GET /api/v1/notifications
   */
  async getNotifications(): Promise<{
    success: boolean;
    data: NotificationItem[];
    unreadCount: number;
  }> {
    const res = await authFetch(`${API_BASE}/notifications`);
    if (!res.ok) return { success: false, data: [], unreadCount: 0 };
    return parseJsonSafe<{
      success: boolean;
      data: NotificationItem[];
      unreadCount: number;
    }>(res, 'Không thể tải thông báo');
  },

  /**
   * Đánh dấu thông báo đã đọc
   * PATCH /api/v1/notifications/:id/read
   */
  async markNotificationAsRead(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return parseJsonSafe<{ success: boolean }>(res, 'Lỗi cập nhật');
  },

  /**
   * Đánh dấu đọc tất cả
   * PATCH /api/v1/notifications/read-all
   */
  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const res = await authFetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
    });
    return parseJsonSafe<{ success: boolean }>(res, 'Lỗi cập nhật');
  },
};
