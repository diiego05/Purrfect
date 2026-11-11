import { Router } from 'express';
import {
  getPublicConfigs,
  getAllConfigs,
  updateConfigs,
  resetToDefaults,
} from '../controllers/systemConfigController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public
router.get('/public', getPublicConfigs);

// Admin only
router.get('/', authenticateToken, requireAdmin, getAllConfigs);
router.put('/', authenticateToken, requireAdmin, updateConfigs);
router.post('/reset', authenticateToken, requireAdmin, resetToDefaults);

export default router;
