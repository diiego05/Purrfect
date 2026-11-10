import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AiQuota } from '../models/AiQuota';
import { ChatMessage, saveMessage } from '../models/ChatMessage';
import { chat, streamChat, getQuickSuggestions } from '../services/aiChatService';

// Hạn mức cho khách vãng lai (Guest) - 10 lượt/phiên
const GUEST_LIMIT_PER_SESSION = 10;
const guestUsageMap = new Map<string, number>();

// BR21.3: Hạn mức mặc định cho người dùng đã đăng nhập (50 lượt/tháng)
const DEFAULT_MONTHLY_LIMIT = 50;

/**
 * Chuẩn hóa IP của client phục vụ tracking quota khách vãng lai
 */
function getClientIp(req: AuthRequest): string {
  const raw =
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  if (raw === '::1' || raw === '::ffff:127.0.0.1') return '127.0.0.1';
  return raw;
}

/**
 * Lấy tháng-năm hiện tại dạng YYYY-MM
 */
function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

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
    const userPrompt = (
      req.body.userPrompt ||
      req.body.message ||
      ''
    ).toString().trim();
    const courseId = req.body.courseId || null;

    if (!userPrompt || userPrompt.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi của bạn.',
      });
      return;
    }

    if (userPrompt.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Câu hỏi quá dài, vui lòng giới hạn dưới 1000 ký tự.',
      });
      return;
    }

    const monthYear = getCurrentMonthYear();
    const studentId = req.user ? String(req.user._id) : null;

    // Bước 1: saveMessage(studentId, courseId, role = 'USER', prompt = userPrompt)
    await saveMessage({
      studentId,
      courseId,
      role: 'USER',
      prompt: userPrompt,
    });

    // Kiểm tra quota (BR21.3)
    if (req.user) {
      const userId = String(req.user._id);
      let quota = await AiQuota.findOne({ userId, monthYear });

      if (!quota) {
        quota = await AiQuota.create({
          userId,
          monthYear,
          aiChatUsed: 0,
          aiChatLimit: DEFAULT_MONTHLY_LIMIT,
        });
      }

      if (quota.aiChatUsed >= quota.aiChatLimit) {
        res.status(429).json({
          success: false,
          message: `Bạn đã sử dụng hết ${quota.aiChatLimit} lượt hỏi AI trong tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau.`,
          quota: {
            used: quota.aiChatUsed,
            limit: quota.aiChatLimit,
            remaining: 0,
          },
        });
        return;
      }

      // Gọi RAG Service
      const aiResponse = await chat(userPrompt, courseId);

      // Bước 2: saveMessage(studentId, courseId, role = 'ASSISTANT', responseText)
      await saveMessage({
        studentId,
        courseId,
        role: 'ASSISTANT',
        prompt: aiResponse.message,
      });

      // Tăng usage
      quota.aiChatUsed += 1;
      await quota.save();

      res.json({
        success: true,
        data: {
          message: aiResponse.message,
          suggestedCourses: aiResponse.suggestedCourses,
          quota: {
            used: quota.aiChatUsed,
            limit: quota.aiChatLimit,
            remaining: quota.aiChatLimit - quota.aiChatUsed,
          },
        },
      });
    } else {
      // Khách vãng lai - theo dõi bằng IP
      const clientIp = getClientIp(req);
      const guestUsed = guestUsageMap.get(clientIp) || 0;
      if (guestUsed >= GUEST_LIMIT_PER_SESSION) {
        res.status(429).json({
          success: false,
          message: `Bạn đã sử dụng hết ${GUEST_LIMIT_PER_SESSION} lượt hỏi miễn phí. Vui lòng đăng ký tài khoản để tiếp tục sử dụng Trợ lý AI với ${DEFAULT_MONTHLY_LIMIT} lượt/tháng.`,
          quota: {
            used: guestUsed,
            limit: GUEST_LIMIT_PER_SESSION,
            remaining: 0,
          },
        });
        return;
      }

      // Gọi RAG Service
      const aiResponse = await chat(userPrompt, courseId);

      // Lưu tin nhắn ASSISTANT
      await saveMessage({
        studentId: null,
        courseId,
        role: 'ASSISTANT',
        prompt: aiResponse.message,
      });

      // Tăng usage
      guestUsageMap.set(clientIp, guestUsed + 1);

      res.json({
        success: true,
        data: {
          message: aiResponse.message,
          suggestedCourses: aiResponse.suggestedCourses,
          quota: {
            used: guestUsed + 1,
            limit: GUEST_LIMIT_PER_SESSION,
            remaining: Math.max(0, GUEST_LIMIT_PER_SESSION - (guestUsed + 1)),
          },
        },
      });
    }
  } catch {
    // Exception Flow 3a: Dịch vụ AI gián đoạn
    res.status(503).json({
      success: false,
      message:
        'Trợ lý AI đang bận phản hồi. Bạn có thể tham khảo Danh mục khóa học nổi bật hoặc Trung tâm hỗ trợ.',
      fallback: {
        faqUrl: '/faq',
        coursesUrl: '/courses',
        supportEmail: 'support@learnova.com',
      },
    });
  }
};

/**
 * POST /api/v1/ai/chat/stream hoặc POST /api/ai/chat/stream
 * Endpoint Server-Sent Events (SSE) để truyền phát token chuỗi ký tự nối tiếp (< 3s)
 * Khớp Lược đồ tuần tự 3.2.21:
 * saveMessage(USER) -> streamTokensResponse() -> saveMessage(ASSISTANT) -> 200 OK (SSE Stream)
 */
export const sendChatMessageStream = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userPrompt = (
    req.body.userPrompt ||
    req.body.message ||
    ''
  ).toString().trim();
  const courseId = req.body.courseId || null;

  if (!userPrompt || userPrompt.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Vui lòng nhập câu hỏi của bạn.',
    });
    return;
  }

  const monthYear = getCurrentMonthYear();
  const studentId = req.user ? String(req.user._id) : null;

  // Bước 1: saveMessage(studentId, courseId, role = 'USER', prompt = userPrompt)
  await saveMessage({
    studentId,
    courseId,
    role: 'USER',
    prompt: userPrompt,
  });

  let quotaRecord: InstanceType<typeof AiQuota> | null = null;
  let guestIp = '';
  let guestUsed = 0;

  if (req.user) {
    const userId = String(req.user._id);
    quotaRecord = await AiQuota.findOne({ userId, monthYear });
    if (!quotaRecord) {
      quotaRecord = await AiQuota.create({
        userId,
        monthYear,
        aiChatUsed: 0,
        aiChatLimit: DEFAULT_MONTHLY_LIMIT,
      });
    }

    if (quotaRecord.aiChatUsed >= quotaRecord.aiChatLimit) {
      res.status(429).json({
        success: false,
        message: `Bạn đã sử dụng hết ${quotaRecord.aiChatLimit} lượt hỏi AI trong tháng này.`,
        quota: {
          used: quotaRecord.aiChatUsed,
          limit: quotaRecord.aiChatLimit,
          remaining: 0,
        },
      });
      return;
    }
  } else {
    guestIp = getClientIp(req);
    guestUsed = guestUsageMap.get(guestIp) || 0;
    if (guestUsed >= GUEST_LIMIT_PER_SESSION) {
      res.status(429).json({
        success: false,
        message: `Bạn đã sử dụng hết ${GUEST_LIMIT_PER_SESSION} lượt hỏi miễn phí. Vui lòng đăng ký tài khoản để tiếp tục.`,
        quota: {
          used: guestUsed,
          limit: GUEST_LIMIT_PER_SESSION,
          remaining: 0,
        },
      });
      return;
    }
  }

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
        res.write(`data: ${JSON.stringify({ type: 'token', token: chunk.token })}\n\n`);
      } else if (chunk.type === 'done') {
        // Bước 2: saveMessage(studentId, courseId, role = 'ASSISTANT', responseText)
        await saveMessage({
          studentId,
          courseId,
          role: 'ASSISTANT',
          prompt: fullResponseText,
        });

        let quotaInfo = { used: 0, limit: 0, remaining: 0 };
        if (req.user && quotaRecord) {
          quotaRecord.aiChatUsed += 1;
          await quotaRecord.save();
          quotaInfo = {
            used: quotaRecord.aiChatUsed,
            limit: quotaRecord.aiChatLimit,
            remaining: quotaRecord.aiChatLimit - quotaRecord.aiChatUsed,
          };
        } else {
          guestUsageMap.set(guestIp, guestUsed + 1);
          quotaInfo = {
            used: guestUsed + 1,
            limit: GUEST_LIMIT_PER_SESSION,
            remaining: Math.max(0, GUEST_LIMIT_PER_SESSION - (guestUsed + 1)),
          };
        }

        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            suggestedCourses: chunk.suggestedCourses || [],
            quota: quotaInfo,
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
 * Lấy thông tin hạn mức AI chat của người dùng hiện tại
 */
export const getAiQuota = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const monthYear = getCurrentMonthYear();

    if (req.user) {
      const userId = String(req.user._id);

      let quota = await AiQuota.findOne({ userId, monthYear });
      if (!quota) {
        quota = await AiQuota.create({
          userId,
          monthYear,
          aiChatUsed: 0,
          aiChatLimit: DEFAULT_MONTHLY_LIMIT,
        });
      }

      res.json({
        success: true,
        data: {
          used: quota.aiChatUsed,
          limit: quota.aiChatLimit,
          remaining: Math.max(0, quota.aiChatLimit - quota.aiChatUsed),
          monthYear,
        },
      });
      return;
    }

    // Khách vãng lai (Guest) - hạn mức 10 lượt/phiên
    const clientIp = getClientIp(req);
    const guestUsed = guestUsageMap.get(clientIp) || 0;

    res.json({
      success: true,
      data: {
        used: guestUsed,
        limit: GUEST_LIMIT_PER_SESSION,
        remaining: Math.max(0, GUEST_LIMIT_PER_SESSION - guestUsed),
        monthYear,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin hạn mức.',
    });
  }
};

/**
 * POST /api/v1/ai/quota/reset hoặc POST /api/ai/quota/reset
 * Đặt lại hạn mức AI chat về 0 (cho cả User và Guest) phục vụ kiểm thử
 */
export const resetAiQuota = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const monthYear = getCurrentMonthYear();

    if (req.user) {
      const userId = String(req.user._id);
      await AiQuota.findOneAndUpdate(
        { userId, monthYear },
        { $set: { aiChatUsed: 0, aiChatLimit: DEFAULT_MONTHLY_LIMIT } },
        { upsert: true, new: true },
      );
    }

    // Xóa toàn bộ usage map của khách vãng lai
    guestUsageMap.clear();

    const isGuest = !req.user;
    const currentLimit = isGuest ? GUEST_LIMIT_PER_SESSION : DEFAULT_MONTHLY_LIMIT;

    res.json({
      success: true,
      message: `Đã đặt lại số lượt hỏi AI về 0 thành công (Hạn mức: ${currentLimit} lượt).`,
      data: {
        used: 0,
        limit: currentLimit,
        remaining: currentLimit,
        monthYear,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Không thể reset hạn mức.',
    });
  }
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
