import { Request, Response } from 'express';
import {
  generateQuizWithAi,
  gradeEssayWithAi,
} from '../services/aiQuizService';
import { AuthRequest } from '../middlewares/auth';
import { User } from '../models/User';

const WEEKLY_AI_QUIZ_LIMIT = 5;

/**
 * Tính toán hạn mức tạo Quiz AI hàng tuần cho Giảng viên (tối đa 5 lần/tuần)
 */
async function getUserQuizQuota(userId: string | any) {
  const user = await User.findById(userId);
  if (!user) {
    return {
      limit: WEEKLY_AI_QUIZ_LIMIT,
      used: 0,
      remaining: WEEKLY_AI_QUIZ_LIMIT,
      resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  const now = new Date();
  const weekStart = user.aiQuizWeekStartDate
    ? new Date(user.aiQuizWeekStartDate)
    : now;
  const diffDays =
    (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);

  // Nếu đã sang tuần mới (>= 7 ngày) -> tự động reset quota về 5 lần
  if (diffDays >= 7) {
    user.aiQuizWeeklyUsage = 0;
    user.aiQuizWeekStartDate = now;
    await user.save();
  }

  const used = user.aiQuizWeeklyUsage || 0;
  const remaining = Math.max(0, WEEKLY_AI_QUIZ_LIMIT - used);
  const resetDate = new Date(
    new Date(user.aiQuizWeekStartDate || now).getTime() +
      7 * 24 * 60 * 60 * 1000,
  );

  return {
    limit: WEEKLY_AI_QUIZ_LIMIT,
    used,
    remaining,
    resetDate,
  };
}

/**
 * GET /api/ai/quiz/quota
 * Lấy số credit / hạn mức tạo quiz tuần này của giảng viên
 */
export async function getAiQuizQuotaHandler(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(200).json({
        success: true,
        data: {
          limit: WEEKLY_AI_QUIZ_LIMIT,
          used: 0,
          remaining: WEEKLY_AI_QUIZ_LIMIT,
          resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return;
    }

    const quota = await getUserQuizQuota(userId);
    res.status(200).json({
      success: true,
      data: quota,
    });
  } catch (error) {
    console.error('Error getting AI quiz quota:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra hạn mức AI Quiz.',
    });
  }
}

/**
 * POST /api/ai/quiz/generate
 * Soạn bộ câu hỏi trắc nghiệm & tự luận bằng AI
 */
export async function generateQuizHandler(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const { topic, content, multipleChoiceCount, essayCount, difficulty } =
      req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp chủ đề hoặc tên bài học (topic)',
      });
      return;
    }

    // Kiểm tra hạn mức tuần nếu người dùng đã đăng nhập
    const userId = req.user?._id;
    let quotaInfo = null;
    if (userId) {
      quotaInfo = await getUserQuizQuota(userId);
      if (quotaInfo.remaining <= 0) {
        res.status(429).json({
          success: false,
          message:
            'Bạn đã sử dụng hết hạn mức 5 lần tạo Quiz bằng AI trong tuần này. Vui lòng chờ đến tuần mới để được cấp lại hạn mức!',
          quota: quotaInfo,
        });
        return;
      }
    }

    const result = await generateQuizWithAi({
      topic: topic.trim(),
      content: typeof content === 'string' ? content : undefined,
      multipleChoiceCount: Number(multipleChoiceCount) || 4,
      essayCount: essayCount !== undefined ? Number(essayCount) : 1,
      difficulty:
        difficulty === 'Easy' || difficulty === 'Hard' ? difficulty : 'Medium',
    });

    // Trừ 1 lượt credit nếu tạo thành công
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { aiQuizWeeklyUsage: 1 },
      });
      if (quotaInfo) {
        quotaInfo.used += 1;
        quotaInfo.remaining = Math.max(0, quotaInfo.remaining - 1);
      }
    }

    res.status(200).json({
      success: true,
      data: result.quiz,
      isAiGenerated: result.isAiGenerated,
      message: result.message,
      quota: quotaInfo,
    });
  } catch (error) {
    console.error('Error generating quiz with AI:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo bộ câu hỏi lúc này. Vui lòng thử lại sau.',
    });
  }
}

/**
 * POST /api/ai/quiz/grade-essay
 * Chấm điểm câu hỏi tự luận bằng AI
 */
export async function gradeEssayHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { question, sampleAnswer, studentAnswer } = req.body;

    if (!question || !studentAnswer) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp câu hỏi và bài làm của học viên',
      });
      return;
    }

    const result = await gradeEssayWithAi({
      question: String(question),
      sampleAnswer: sampleAnswer ? String(sampleAnswer) : undefined,
      studentAnswer: String(studentAnswer),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error grading essay with AI:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể chấm điểm tự luận lúc này.',
    });
  }
}
