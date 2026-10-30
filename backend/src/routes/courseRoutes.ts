import { Router } from 'express';
import {
  getHomeCourses,
  getCourses,
  getCategories,
  getCourseBySlug,
  resetAndSeedCourses,
} from '../controllers/courseController';
import { getOnboardingData } from '../controllers/onboardingController';

const router = Router();

// Lấy danh sách dữ liệu Onboarding (Categories & Skills)
router.get('/onboarding-data', getOnboardingData);

// Lấy danh sách categories của nền tảng
router.get('/categories', getCategories);

// Lấy các danh mục khóa học cho trang chủ (Dành riêng cho bạn, Bán chạy nhất, Mới ra mắt)
router.get('/home', getHomeCourses);

// Lấy danh sách khóa học có bộ lọc
router.get('/', getCourses);

// Seed lại dữ liệu nếu cần
router.post('/seed', resetAndSeedCourses);

// Lấy chi tiết khóa học theo slug
router.get('/:slug', getCourseBySlug);

export default router;
