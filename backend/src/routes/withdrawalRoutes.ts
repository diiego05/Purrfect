import { Router } from 'express';
import {
  getInstructorBalance,
  createWithdrawalRequest,
  getAdminWithdrawals,
  processAdminWithdrawal,
} from '../controllers/withdrawalController';
import {
  authenticateToken,
  requireAdmin,
  requireInstructor,
} from '../middlewares/auth';

const router = Router();

// Instructor routes
router.get(
  ['/instructor/balance', '/balance'],
  authenticateToken,
  requireInstructor,
  getInstructorBalance,
);
router.post(
  ['/instructor/request', '/request'],
  authenticateToken,
  requireInstructor,
  createWithdrawalRequest,
);

// Admin routes
router.get(
  '/admin/requests',
  authenticateToken,
  requireAdmin,
  getAdminWithdrawals,
);
router.post(
  '/admin/process/:id',
  authenticateToken,
  requireAdmin,
  processAdminWithdrawal,
);

export default router;
