import { Router } from 'express';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../middlewares/auth';
import {
  getPublicPlaylists,
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addCourseToPlaylist,
  removeCourseFromPlaylist,
  toggleFollowPlaylist,
} from '../controllers/playlistController';

const router = Router();

// 1. Lấy danh sách playlist công khai (khách hoặc user đều xem được)
router.get('/public', optionalAuthenticateToken, getPublicPlaylists);

// 2. Lấy playlist cá nhân (đã tạo + đang theo dõi)
router.get('/my', authenticateToken, getMyPlaylists);

// 3. Lấy chi tiết 1 playlist
router.get('/:id', optionalAuthenticateToken, getPlaylistById);

// 4. Tạo playlist mới
router.post('/', authenticateToken, createPlaylist);

// 5. Cập nhật playlist
router.put('/:id', authenticateToken, updatePlaylist);

// 6. Xóa playlist
router.delete('/:id', authenticateToken, deletePlaylist);

// 7. Thêm khóa học vào playlist
router.post('/:id/courses', authenticateToken, addCourseToPlaylist);

// 8. Xóa khóa học khỏi playlist
router.delete(
  '/:id/courses/:courseId',
  authenticateToken,
  removeCourseFromPlaylist,
);

// 9. Theo dõi / Bỏ theo dõi playlist công khai
router.post('/:id/follow', authenticateToken, toggleFollowPlaylist);

export default router;
