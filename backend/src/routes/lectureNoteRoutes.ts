import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createLectureNote,
  deleteLectureNote,
  getLectureNotes,
  updateLectureNote,
} from '../controllers/lectureNoteController';

const router = Router();
router.get(
  '/courses/:courseId/lectures/:lectureId/notes',
  authenticateToken,
  getLectureNotes,
);
router.post(
  '/courses/:courseId/lectures/:lectureId/notes',
  authenticateToken,
  createLectureNote,
);
router.patch('/lecture-notes/:noteId', authenticateToken, updateLectureNote);
router.delete('/lecture-notes/:noteId', authenticateToken, deleteLectureNote);
export default router;
