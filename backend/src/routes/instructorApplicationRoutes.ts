import { Router } from 'express';
import {
  authenticateToken,
  requireAdmin,
  requireStudent,
} from '../middlewares/auth';
import {
  submitApplication,
  getMyApplication,
  getApplications,
  approveApplication,
  rejectApplication,
} from '../controllers/instructorApplicationController';

const router = Router();

// === Học viên routes (Chỉ cho phép tài khoản Học viên) ===
router.post(
  '/instructor/apply',
  authenticateToken,
  requireStudent,
  submitApplication,
);
router.get(
  '/instructor/my-application',
  authenticateToken,
  requireStudent,
  getMyApplication,
);

// === Quản trị viên routes ===
router.get(
  '/admin/instructor-applications',
  authenticateToken,
  requireAdmin,
  getApplications,
);
router.put(
  '/admin/instructor-applications/:id/approve',
  authenticateToken,
  requireAdmin,
  approveApplication,
);
router.put(
  '/admin/instructor-applications/:id/reject',
  authenticateToken,
  requireAdmin,
  rejectApplication,
);

export default router;
