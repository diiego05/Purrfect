import { Router } from 'express';
import {
  replyToReview,
  updateReviewReply,
  deleteReviewReply,
  getCourseReviews,
  submitCourseReview,
  getInstructorReviews,
} from '../controllers/reviewController';
import {
  authenticateToken,
  optionalAuthenticateToken,
  requireInstructor,
} from '../middlewares/auth';

const router = Router();

// ==========================================
// 1. Phản hồi đánh giá (UC23)
// Khớp Lược đồ tuần tự Sequence Diagram 3.2.23 (sd PhanHoiDanhGia)
// ==========================================

// Giảng viên phản hồi trực tiếp đánh giá của học viên
// POST /api/v1/reviews/:id/reply (instructorReply)
router.post('/reviews/:id/reply', authenticateToken, replyToReview);

// Chỉnh sửa phản hồi (Alternative Flow 4a1)
// PUT /api/v1/reviews/:id/reply
router.put('/reviews/:id/reply', authenticateToken, updateReviewReply);

// Xóa phản hồi (Alternative Flow 4a2)
// DELETE /api/v1/reviews/:id/reply
router.delete('/reviews/:id/reply', authenticateToken, deleteReviewReply);

// ==========================================
// 2. Danh sách đánh giá & Gửi đánh giá
// ==========================================

// Lấy danh sách đánh giá của khóa học (kèm phân bố sao và phản hồi)
// GET /api/v1/courses/:courseId/reviews
router.get('/courses/:courseId/reviews', optionalAuthenticateToken, getCourseReviews);

// Học viên gửi đánh giá cho khóa học
// POST /api/v1/courses/:courseId/reviews
router.post('/courses/:courseId/reviews', authenticateToken, submitCourseReview);

// Giảng viên / Admin xem danh sách đánh giá trong Dashboard
// GET /api/v1/instructor/reviews
router.get(
  '/instructor/reviews',
  authenticateToken,
  requireInstructor,
  getInstructorReviews,
);

export default router;
