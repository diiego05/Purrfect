import { Router } from 'express';
import {
  getCategories,
  getCategoryByIdentifier,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Routes công khai cho người dùng và khách
router.get('/', getCategories);
router.get('/:identifier', getCategoryByIdentifier);

// Routes quản trị viên (Admin only)
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;

