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
  ['/instructor/apply', '/apply'],
  authenticateToken,
  requireStudent,
  submitApplication,
);
router.get(
  ['/instructor/my-application', '/my-application'],
  authenticateToken,
  requireStudent,
  getMyApplication,
);

// === Quản trị viên routes ===
router.get(
  [
    '/admin/instructor-applications',
    '/instructor-applications',
    '/instructor/applications',
    '/admin/applications',
    '/applications',
    '/',
  ],
  authenticateToken,
  requireAdmin,
  getApplications,
);
router.put(
  [
    '/admin/instructor-applications/:id/approve',
    '/instructor-applications/:id/approve',
    '/instructor/applications/:id/approve',
    '/admin/applications/:id/approve',
    '/applications/:id/approve',
    '/:id/approve',
  ],
  authenticateToken,
  requireAdmin,
  approveApplication,
);
router.put(
  [
    '/admin/instructor-applications/:id/reject',
    '/instructor-applications/:id/reject',
    '/instructor/applications/:id/reject',
    '/admin/applications/:id/reject',
    '/applications/:id/reject',
    '/:id/reject',
  ],
  authenticateToken,
  requireAdmin,
  rejectApplication,
);

export default router;
