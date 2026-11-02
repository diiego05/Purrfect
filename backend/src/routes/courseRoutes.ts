import { Router } from 'express';
import {
  getHomeCourses,
  getCourses,
  getCategories,
  getCourseBySlug,
  resetAndSeedCourses,
  recordCourseInteraction,
} from '../controllers/courseController';
import { getOnboardingData } from '../controllers/onboardingController';
import { optionalAuthenticateToken } from '../middlewares/auth';

const router = Router();

// Lấy danh sách dữ liệu Onboarding (Categories & Skills)
router.get('/onboarding-data', getOnboardingData);

// Lấy danh sách categories của nền tảng
router.get('/categories', getCategories);

// Lấy các danh mục khóa học cho trang chủ (Dành riêng cho bạn có AI gợi ý, Bán chạy nhất, Mới ra mắt)
router.get('/home', optionalAuthenticateToken, getHomeCourses);

// Ghi nhận tương tác học viên (tìm kiếm, xem khóa học, thêm giỏ hàng) phục vụ AI
router.post(
  '/interactions',
  optionalAuthenticateToken,
  recordCourseInteraction,
);

// Lấy danh sách khóa học có bộ lọc
router.get('/', getCourses);

// Seed lại dữ liệu nếu cần
router.post('/seed', resetAndSeedCourses);

// Lấy chi tiết khóa học theo slug
router.get('/:slug', getCourseBySlug);

export default router;
