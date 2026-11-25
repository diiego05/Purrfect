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

export interface AiQuizQuotaResponse {
  success: boolean;
  data: {
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
  message?: string;
}

export interface GenerateQuizResponse {
  success: boolean;
  data: QuizDataItem;
  isAiGenerated: boolean;
  message?: string;
  quota?: {
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  };
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
   * Lấy số lượt quota tạo Quiz AI trong tuần của giảng viên (tối đa 5 lượt/tuần)
   */
  async getQuota(): Promise<AiQuizQuotaResponse> {
    const res = await authFetch(`${API_BASE}/quota`);
    return parseJsonSafe<AiQuizQuotaResponse>(
      res,
      'Không thể kiểm tra hạn mức AI Quiz',
    );
  },

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
