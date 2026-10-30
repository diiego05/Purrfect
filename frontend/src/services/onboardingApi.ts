import type {
  OnboardingDataResponse,
  OnboardingPayload,
  OnboardingSaveResponse,
} from '../types/onboarding';
import { getAccessToken } from './authApi';

const COURSE_API_BASE = '/api/courses';
const AUTH_API_BASE = '/api/auth';

/**
 * Lấy dữ liệu danh mục & kỹ năng để hiển thị trên màn hình Onboarding
 */
export const fetchOnboardingData =
  async (): Promise<OnboardingDataResponse> => {
    try {
      const res = await fetch(`${COURSE_API_BASE}/onboarding-data`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu định hướng');
      const data = await res.json();
      return data;
    } catch (error) {
      console.warn(
        '[OnboardingApi] Lỗi khi tải dữ liệu onboarding, dùng fallback:',
        error,
      );
      // Fallback data nếu offline hoặc lỗi mạng
      return {
        success: true,
        categories: [
          {
            id: '1',
            name: 'Kỹ năng số',
            slug: 'digital-skills',
            description: 'Kỹ năng số và công nghệ hiện đại',
          },
          {
            id: '2',
            name: 'Lập trình & Phát triển',
            slug: 'development',
            description: 'Lập trình web, app, backend',
          },
          {
            id: '3',
            name: 'Thiết kế & Sáng tạo',
            slug: 'design',
            description: 'UI/UX Design, đồ họa và truyền thông',
          },
          {
            id: '4',
            name: 'Kinh doanh & Quản lý',
            slug: 'business',
            description: 'Khởi nghiệp, marketing và quản trị',
          },
          {
            id: '5',
            name: 'Trí tuệ nhân tạo',
            slug: 'ai-data',
            description: 'AI, Machine Learning và Data Science',
          },
        ],
        skills: [
          {
            id: 's1',
            name: 'Tin học văn phòng (Word, Excel, PowerPoint)',
            slug: 'tin-hoc-van-phong',
            categoryId: '1',
          },
          {
            id: 's2',
            name: 'Phân tích dữ liệu với Excel nâng cao',
            slug: 'excel-nang-cao',
            categoryId: '1',
          },
          {
            id: 's3',
            name: 'Lập trình Web Frontend (React, Next.js)',
            slug: 'react-frontend',
            categoryId: '2',
          },
          {
            id: 's4',
            name: 'Lập trình Web Backend (Node.js, Express)',
            slug: 'nodejs-backend',
            categoryId: '2',
          },
          {
            id: 's5',
            name: 'Lập trình Python & Tự động hóa',
            slug: 'python-tu-dong-hoa',
            categoryId: '2',
          },
          {
            id: 's6',
            name: 'Thiết kế giao diện UI/UX (Figma)',
            slug: 'figma-uiux',
            categoryId: '3',
          },
          {
            id: 's7',
            name: 'Thiết kế đồ họa & Visual Branding (Photoshop, AI)',
            slug: 'photoshop-ai',
            categoryId: '3',
          },
          {
            id: 's8',
            name: 'Digital Marketing & Social Media',
            slug: 'digital-marketing',
            categoryId: '4',
          },
          {
            id: 's9',
            name: 'SEO & Quản lý dự án Agile/Scrum',
            slug: 'seo-agile',
            categoryId: '4',
          },
          {
            id: 's10',
            name: 'ChatGPT, Claude & Prompt Engineering',
            slug: 'prompt-engineering',
            categoryId: '5',
          },
          {
            id: 's11',
            name: 'Machine Learning & Data Science',
            slug: 'machine-learning',
            categoryId: '5',
          },
        ],
      };
    }
  };

/**
 * Lưu kết quả khảo sát định hướng của người dùng
 */
export const saveOnboardingSurvey = async (
  payload: OnboardingPayload,
): Promise<OnboardingSaveResponse> => {
  const token = getAccessToken();
  const res = await fetch(`${AUTH_API_BASE}/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Lỗi khi lưu kết quả khảo sát');
  }
  return data;
};

/**
 * Lấy khảo sát hiện tại của user
 */
export const getUserOnboardingSurvey = async () => {
  const token = getAccessToken();
  if (!token) return null;
  const res = await fetch(`${AUTH_API_BASE}/onboarding`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.survey || null;
};
