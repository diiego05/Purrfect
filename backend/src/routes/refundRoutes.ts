import { Router } from 'express';
import {
  checkEligibility,
  createRefundRequest,
  cancelRefundRequest,
  getMyRefundRequests,
  getAdminRefundRequests,
  processAdminRefund,
} from '../controllers/refundController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Student routes (requires login)
router.get('/eligibility/:orderId', authenticateToken, checkEligibility);
router.post('/request', authenticateToken, createRefundRequest);
router.post('/cancel/:id', authenticateToken, cancelRefundRequest);
router.get('/my-requests', authenticateToken, getMyRefundRequests);

// Admin routes (UC33)
router.get(
  '/admin/requests',
  authenticateToken,
  requireAdmin,
  getAdminRefundRequests,
);
router.post(
  '/admin/process/:id',
  authenticateToken,
  requireAdmin,
  processAdminRefund,
);

export default router;
