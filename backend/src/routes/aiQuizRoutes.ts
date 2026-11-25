import { Router } from 'express';
import {
  generateQuizHandler,
  gradeEssayHandler,
  getAiQuizQuotaHandler,
} from '../controllers/aiQuizController';
import { optionalAuthenticateToken } from '../middlewares/auth';

const router = Router();

// Endpoint kiểm tra hạn mức credit tạo Quiz bằng AI trong tuần
router.get('/quota', optionalAuthenticateToken, getAiQuizQuotaHandler);

// Endpoint sinh câu hỏi trắc nghiệm & tự luận bằng AI
router.post('/generate', optionalAuthenticateToken, generateQuizHandler);

// Endpoint chấm điểm câu hỏi tự luận bằng AI
router.post('/grade-essay', optionalAuthenticateToken, gradeEssayHandler);

export default router;
