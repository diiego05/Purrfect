import { Router } from 'express';
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
} from '../controllers/couponController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Validate coupon (public / checkout)
router.post('/validate', validateCoupon);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllCoupons);
router.post('/', authenticateToken, requireAdmin, createCoupon);
router.get('/:id', authenticateToken, requireAdmin, getCouponById);
router.put('/:id', authenticateToken, requireAdmin, updateCoupon);
router.delete('/:id', authenticateToken, requireAdmin, deleteCoupon);
router.patch('/:id/toggle', authenticateToken, requireAdmin, toggleCouponStatus);

export default router;

