import { Router } from 'express';
import {
  checkEligibility,
  createRefundRequest,
  cancelRefundRequest,
  getMyRefundRequests,
  getAdminRefundRequests,
  processAdminRefund,
  getInstructorRefundRequests,
} from '../controllers/refundController';
import {
  authenticateToken,
  requireAdmin,
  requireInstructor,
} from '../middlewares/auth';

const router = Router();

// Student routes (requires login)
router.get('/eligibility/:orderId', authenticateToken, checkEligibility);
router.post('/request', authenticateToken, createRefundRequest);
router.post('/cancel/:id', authenticateToken, cancelRefundRequest);
router.get('/my-requests', authenticateToken, getMyRefundRequests);

// Instructor routes (  / Logs hoàn tiền học viên)
router.get(
  ['/instructor/requests', '/instructor'],
  authenticateToken,
  requireInstructor,
  getInstructorRefundRequests,
);

// Admin routes
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
