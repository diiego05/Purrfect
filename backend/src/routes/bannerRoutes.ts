import { Router } from 'express';
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  reorderBanners,
} from '../controllers/bannerController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Public
router.get('/', getActiveBanners);

// Admin only
router.get('/all', authenticateToken, requireAdmin, getAllBanners);
router.post('/', authenticateToken, requireAdmin, createBanner);
router.patch('/reorder', authenticateToken, requireAdmin, reorderBanners);
router.put('/:id', authenticateToken, requireAdmin, updateBanner);
router.delete('/:id', authenticateToken, requireAdmin, deleteBanner);
router.patch('/:id/toggle', authenticateToken, requireAdmin, toggleBanner);

export default router;

