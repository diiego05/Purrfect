import { Router } from 'express';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getCart);
router.post('/add', addToCart);
router.delete('/remove/:courseId', removeFromCart);
router.delete('/clear', clearCart);

export default router;
