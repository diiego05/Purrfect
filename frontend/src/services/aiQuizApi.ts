import { authFetch } from './authApi';
import { parseJsonSafe } from '../utils/api';
import type { QuizDataItem } from '../types/instructorCourse';

const API_BASE = '/api/ai/quiz';

export interface GenerateQuizRequest {
  topic: string;
  content?: string;
  multipleChoiceCount?: number;
  essayCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface GenerateQuizResponse {
  success: boolean;
  data: QuizDataItem;
  isAiGenerated: boolean;
  message?: string;
}

export interface GradeEssayRequest {
  question: string;
  sampleAnswer?: string;
  studentAnswer: string;
}

export interface GradeEssayResponse {
  success: boolean;
  data: {
    score: number;
    passed: boolean;
    feedback: string;
    strengths: string;
    improvements: string;
  };
}

export const aiQuizApi = {
  /**
   * Gọi AI sinh câu hỏi trắc nghiệm & tự luận
   */
  async generateQuiz(
    payload: GenerateQuizRequest,
  ): Promise<GenerateQuizResponse> {
    const res = await authFetch(`${API_BASE}/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<GenerateQuizResponse>(
      res,
      'Không thể kết nối đến máy chủ AI soạn câu hỏi',
    );
  },

  /**
   * Gọi AI chấm điểm câu hỏi tự luận
   */
  async gradeEssay(payload: GradeEssayRequest): Promise<GradeEssayResponse> {
    const res = await authFetch(`${API_BASE}/grade-essay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<GradeEssayResponse>(
      res,
      'Không thể chấm điểm bài tự luận lúc này',
    );
  },
};
