import { Router } from 'express';
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  getInstructorCourseCoupons,
  createInstructorCourseCoupon,
  deleteInstructorCoupon,
} from '../controllers/couponController';
import {
  authenticateToken,
  requireAdmin,
  requireInstructor,
} from '../middlewares/auth';

const router = Router();

// Validate coupon (public / checkout)
router.post('/validate', validateCoupon);

// Instructor routes (Mỗi khóa học tạo tối đa 5 mã giảm 10%)
router.get(
  '/instructor/course/:courseId',
  authenticateToken,
  requireInstructor,
  getInstructorCourseCoupons,
);
router.post(
  '/instructor/course/:courseId',
  authenticateToken,
  requireInstructor,
  createInstructorCourseCoupon,
);
router.delete(
  '/instructor/:id',
  authenticateToken,
  requireInstructor,
  deleteInstructorCoupon,
);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllCoupons);
router.post('/', authenticateToken, requireAdmin, createCoupon);
router.get('/:id', authenticateToken, requireAdmin, getCouponById);
router.put('/:id', authenticateToken, requireAdmin, updateCoupon);
router.delete('/:id', authenticateToken, requireAdmin, deleteCoupon);
router.patch(
  '/:id/toggle',
  authenticateToken,
  requireAdmin,
  toggleCouponStatus,
);

export default router;
