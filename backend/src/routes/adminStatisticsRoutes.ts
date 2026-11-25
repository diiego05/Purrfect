import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { getAdminStatistics } from '../controllers/adminStatisticsController';

const router = Router();

// GET /api/v1/admin/statistics
router.get(
  ['/admin/statistics', '/statistics', '/'],
  authenticateToken,
  requireAdmin,
  getAdminStatistics,
);

export default router;
