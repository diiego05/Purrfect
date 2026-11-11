import { Router } from 'express';
import {
  getWishlist,
  toggleWishlist,
  checkWishlistStatus,
} from '../controllers/wishlistController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.get('/check/:courseId', checkWishlistStatus);

export default router;
