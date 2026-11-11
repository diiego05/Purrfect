import { Router } from 'express';
import {
  sendChatMessage,
  sendChatMessageStream,
  getChatMessages,
  getAiQuota,
  resetAiQuota,
  getAiSuggestions,
} from '../controllers/aiChatController';
import {
  authenticateToken,
  optionalAuthenticateToken,
} from '../middlewares/auth';

const router = Router();

// Chat - cho cả Guest và Student (khớp POST /api/v1/ai/chat trong Lược đồ 3.2.21)
router.post('/chat', optionalAuthenticateToken, sendChatMessage);
router.post('/chat/stream', optionalAuthenticateToken, sendChatMessageStream);

// Lịch sử tin nhắn ChatMessage
router.get('/messages', authenticateToken, getChatMessages);

// Quota - hỗ trợ cả Guest và người đã đăng nhập (50 lượt)
router.get('/quota', optionalAuthenticateToken, getAiQuota);
router.post('/quota/reset', optionalAuthenticateToken, resetAiQuota);

// Gợi ý câu hỏi nhanh - public
router.get('/suggestions', getAiSuggestions);

export default router;
