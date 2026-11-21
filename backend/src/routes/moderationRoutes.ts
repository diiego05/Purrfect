import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import {
  getReports,
  getReportDetail,
  moderateReport,
  submitReport,
  lockAccount,
} from '../controllers/moderationController';

const router = Router();

// === Public user routes (authenticated) ===
// POST /moderation/report - Người dùng báo cáo nội dung vi phạm
router.post('/moderation/report', authenticateToken, submitReport);

// === Admin-only routes ===
// GET /admin/moderation/reports - Danh sách báo cáo
router.get('/admin/moderation/reports', authenticateToken, requireAdmin, getReports);

// GET /admin/moderation/reports/:id - Chi tiết báo cáo
router.get('/admin/moderation/reports/:id', authenticateToken, requireAdmin, getReportDetail);

// PUT /admin/moderation/reports/:id - Xử lý báo cáo (Sequence Diagram 3.2.26)
router.put('/admin/moderation/reports/:id', authenticateToken, requireAdmin, moderateReport);

// POST /admin/moderation/lock-account/:userId - Khóa tài khoản (Exception Flow 5b)
router.post('/admin/moderation/lock-account/:userId', authenticateToken, requireAdmin, lockAccount);

export default router;
