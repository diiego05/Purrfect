import { Request, Response } from 'express';
import {
  generateQuizWithAi,
  gradeEssayWithAi,
} from '../services/aiQuizService';

/**
 * POST /api/ai/quiz/generate
 * Soạn bộ câu hỏi trắc nghiệm & tự luận bằng AI
 */
export async function generateQuizHandler(
  req: Request,
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

    const result = await generateQuizWithAi({
      topic: topic.trim(),
      content: typeof content === 'string' ? content : undefined,
      multipleChoiceCount: Number(multipleChoiceCount) || 4,
      essayCount: essayCount !== undefined ? Number(essayCount) : 1,
      difficulty:
        difficulty === 'Easy' || difficulty === 'Hard' ? difficulty : 'Medium',
    });

    res.status(200).json({
      success: true,
      data: result.quiz,
      isAiGenerated: result.isAiGenerated,
      message: result.message,
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
