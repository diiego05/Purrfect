import { Router } from 'express';
import {
  createLectureDiscussion,
  createDiscussionReply,
  pinOfficialAnswer,
  getLectureDiscussions,
  toggleUpvoteDiscussion,
  deleteDiscussion,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/discussionController';
import { authenticateToken, optionalAuthenticateToken } from '../middlewares/auth';

const router = Router();

// ==========================================
// 1. Thảo luận theo bài giảng (UC22)
// Khớp Lược đồ tuần tự 3.2.22
// ==========================================

// Đăng câu hỏi mới gắn liền bài giảng
// POST /api/v1/lectures/:id/discussions (content)
router.post(
  '/lectures/:id/discussions',
  authenticateToken,
  createLectureDiscussion,
);

// Lấy danh sách câu hỏi & phản hồi lồng nhau của bài giảng
// GET /api/v1/lectures/:id/discussions
router.get(
  '/lectures/:id/discussions',
  optionalAuthenticateToken,
  getLectureDiscussions,
);

// Phản hồi / trả lời câu hỏi thảo luận
// POST /api/v1/discussions/:id/replies (content)
router.post(
  '/discussions/:id/replies',
  authenticateToken,
  createDiscussionReply,
);

// Giảng viên ghim câu trả lời chính thức
// PATCH /api/v1/discussions/:replyId/pin ()
router.patch(
  '/discussions/:replyId/pin',
  authenticateToken,
  pinOfficialAnswer,
);

// Thích / Bỏ thích câu hỏi hoặc phản hồi
router.patch(
  '/discussions/:id/upvote',
  authenticateToken,
  toggleUpvoteDiscussion,
);
router.post(
  '/discussions/:id/upvote',
  authenticateToken,
  toggleUpvoteDiscussion,
);

// Xóa câu hỏi / phản hồi
router.delete(
  '/discussions/:id',
  authenticateToken,
  deleteDiscussion,
);

// ==========================================
// 2. Thông báo bài giảng (Notifications)
// ==========================================
router.get('/notifications', authenticateToken, getUserNotifications);
router.patch('/notifications/read-all', authenticateToken, markAllNotificationsAsRead);
router.patch('/notifications/:id/read', authenticateToken, markNotificationAsRead);

export default router;
