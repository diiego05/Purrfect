import { Router } from 'express';
import {
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  createUser,
  deleteUser,
} from '../controllers/userController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Tất cả các route quản lý người dùng yêu cầu đăng nhập và có quyền ADMIN
router.use(authenticateToken, requireAdmin);

router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:id/status', toggleUserStatus);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
