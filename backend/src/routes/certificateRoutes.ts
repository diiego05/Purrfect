import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  issueCertificateForStudent,
  getCourseLearningProgress,
} from '../controllers/certificateController';

const router = Router();

// ─── Xác thực công khai (Không cần đăng nhập) ─────────────────────────────────
router.get('/certificates/verify/:code', verifyCertificate);

// ─── Yêu cầu đăng nhập ────────────────────────────────────────────────────────
router.get('/my-certificates', authenticateToken, getMyCertificates);
router.get(
  '/my-certificates/progress/:courseId',
  authenticateToken,
  getCourseLearningProgress,
);
router.post(
  '/my-certificates/issue',
  authenticateToken,
  issueCertificateForStudent,
);
router.get('/my-certificates/:id', authenticateToken, getCertificateById);

export default router;
