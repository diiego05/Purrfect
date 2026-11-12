import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { ChatMessage, saveMessage } from '../models/ChatMessage';
import {
  chat,
  streamChat,
  getQuickSuggestions,
} from '../services/aiChatService';

/**
 * POST /api/v1/ai/chat hoặc POST /api/ai/chat
 * Khớp chuẩn Lược đồ tuần tự 3.2.21:
 * POST /api/v1/ai/chat (courseId, userPrompt)
 * -> saveMessage(studentId, courseId, role = 'USER', prompt = userPrompt)
 * -> POST /ai/v1/rag/query (courseId, userPrompt)
 * -> saveMessage(studentId, courseId, role = 'ASSISTANT', responseText)
 * -> 200 OK (fullResponse)
 */
export const sendChatMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userPrompt = (req.body.userPrompt || req.body.message || '')
      .toString()
      .trim();
    const courseId = req.body.courseId || null;

    if (!userPrompt || userPrompt.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi của bạn.',
      });
      return;
    }

    const studentId = req.user ? String(req.user._id) : null;

    // Bước 1: saveMessage(studentId, courseId, role = 'USER', prompt = userPrompt)
    await saveMessage({
      studentId,
      courseId,
      role: 'USER',
      prompt: userPrompt,
    });

    // Gọi RAG Service (không giới hạn lượt hỏi / token)
    const aiResponse = await chat(userPrompt, courseId);

    // Bước 2: saveMessage(studentId, courseId, role = 'ASSISTANT', responseText)
    await saveMessage({
      studentId,
      courseId,
      role: 'ASSISTANT',
      prompt: aiResponse.message,
    });

    res.json({
      success: true,
      data: {
        message: aiResponse.message,
        suggestedCourses: aiResponse.suggestedCourses,
      },
    });
  } catch {
    // Exception Flow 3a: Dịch vụ AI gián đoạn
    res.status(503).json({
      success: false,
      message:
        'Trợ lý AI đang bận phản hồi. Bạn có thể tham khảo Danh mục khóa học nổi bật hoặc Trung tâm hỗ trợ.',
      fallback: {
        faqUrl: '/faq',
        coursesUrl: '/courses',
        supportEmail: 'support@purrfect.com',
      },
    });
  }
};

export const sendChatMessageStream = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userPrompt = (req.body.userPrompt || req.body.message || '')
    .toString()
    .trim();
  const courseId = req.body.courseId || null;

  if (!userPrompt || userPrompt.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Vui lòng nhập câu hỏi của bạn.',
    });
    return;
  }

  const studentId = req.user ? String(req.user._id) : null;

  // Bước 1: saveMessage(studentId, courseId, role = 'USER', prompt = userPrompt)
  await saveMessage({
    studentId,
    courseId,
    role: 'USER',
    prompt: userPrompt,
  });

  // Khởi tạo luồng Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    const stream = streamChat(userPrompt, courseId);
    let fullResponseText = '';

    for await (const chunk of stream) {
      if (chunk.type === 'token') {
        fullResponseText += chunk.token;
        res.write(
          `data: ${JSON.stringify({ type: 'token', token: chunk.token })}\n\n`,
        );
      } else if (chunk.type === 'done') {
        // Bước 2: saveMessage(studentId, courseId, role = 'ASSISTANT', responseText)
        await saveMessage({
          studentId,
          courseId,
          role: 'ASSISTANT',
          prompt: fullResponseText,
        });

        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            suggestedCourses: chunk.suggestedCourses || [],
          })}\n\n`,
        );
      }
    }
    res.end();
  } catch {
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Trợ lý AI đang bận phản hồi. Vui lòng thử lại sau.',
      })}\n\n`,
    );
    res.end();
  }
};

/**
 * GET /api/v1/ai/messages hoặc GET /api/ai/messages
 * Lấy lịch sử tin nhắn ChatMessage của học viên
 */
export const getChatMessages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.json({ success: true, data: [] });
      return;
    }

    const { courseId } = req.query;
    const filter: Record<string, unknown> = { studentId: req.user._id };
    if (courseId) {
      filter.courseId = courseId;
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: messages,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lịch sử tin nhắn.',
    });
  }
};

/**
 * GET /api/v1/ai/quota hoặc GET /api/ai/quota
 * Trả về trạng thái không giới hạn lượt hỏi (giữ tương thích ngược endpoint)
 */
export const getAiQuota = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  res.json({
    success: true,
    data: {
      used: 0,
      limit: null,
      remaining: null,
      unlimited: true,
    },
  });
};

/**
 * POST /api/v1/ai/quota/reset hoặc POST /api/ai/quota/reset
 * Giữ tương thích ngược endpoint khi hệ thống không giới hạn lượt hỏi
 */
export const resetAiQuota = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  res.json({
    success: true,
    message: 'Trợ lý AI hoạt động không giới hạn lượt hỏi.',
    data: {
      used: 0,
      limit: null,
      remaining: null,
      unlimited: true,
    },
  });
};

/**
 * GET /api/v1/ai/suggestions hoặc GET /api/ai/suggestions
 * Lấy danh sách câu hỏi gợi ý nhanh
 */
export const getAiSuggestions = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const suggestions = getQuickSuggestions();
    res.json({
      success: true,
      data: suggestions,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách gợi ý.',
    });
  }
};
