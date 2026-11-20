import { Router } from 'express';
import {
  generateQuizHandler,
  gradeEssayHandler,
} from '../controllers/aiQuizController';
import { optionalAuthenticateToken } from '../middlewares/auth';

const router = Router();

// Endpoint sinh câu hỏi trắc nghiệm & tự luận bằng AI
router.post('/generate', optionalAuthenticateToken, generateQuizHandler);

// Endpoint chấm điểm câu hỏi tự luận bằng AI
router.post('/grade-essay', optionalAuthenticateToken, gradeEssayHandler);

export default router;
