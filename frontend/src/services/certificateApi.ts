import { getAccessToken } from './authApi';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/v1';

export interface Certificate {
  _id: string;
  certificateCode: string;
  userId: string;
  courseId: string;
  studentName: string;
  courseTitle: string;
  instructorName?: string;
  issueDate: string;
  createdAt: string;
  verifyPath?: string;
  verifyUrl: string;
}

export interface VerifyCertificateData {
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  isValid: boolean;
  verifyPath?: string;
  verifyUrl: string;
}

export interface CourseLearningProgressData {
  totalLectures: number;
  completedCount: number;
  completedKeys: string[];
  progressPercent: number;
  isCompleted100: boolean;
  certificate: Certificate | null;
}

const authHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Lấy đường dẫn xác thực công khai dựa trên origin hiện tại
 */
export const buildPublicVerifyUrl = (cert: {
  certificateCode: string;
  verifyUrl?: string;
}): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/certificates/verify/${encodeURIComponent(cert.certificateCode)}`;
  }
  return cert.verifyUrl || `/certificates/verify/${cert.certificateCode}`;
};

/**
 * Lấy danh sách chứng chỉ của học viên đang đăng nhập
 */
export const getMyCertificates = async (): Promise<Certificate[]> => {
  const res = await fetch(`${API_BASE}/my-certificates`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  const data = await parseJsonSafe<{
    success: boolean;
    data?: Certificate[];
    message?: string;
  }>(res, 'Không thể lấy danh sách chứng chỉ');

  if (data.success && data.data) return data.data;
  throw new Error(data.message || 'Không thể lấy danh sách chứng chỉ');
};

/**
 * Lấy chi tiết 1 chứng chỉ theo ID
 */
export const getCertificateById = async (id: string): Promise<Certificate> => {
  const res = await fetch(`${API_BASE}/my-certificates/${id}`, {
    method: 'GET',
    headers: authHeaders(),
    credentials: 'include',
  });

  const data = await parseJsonSafe<{
    success: boolean;
    data?: Certificate;
    message?: string;
  }>(res, 'Không thể lấy thông tin chứng chỉ');

  if (data.success && data.data) return data.data;
  throw new Error(data.message || 'Không thể lấy thông tin chứng chỉ');
};

/**
 * Lấy tiến độ bài giảng đã hoàn thành & chứng chỉ (nếu có) của khóa học
 */
export const getCourseLearningProgress = async (
  courseId: string,
): Promise<CourseLearningProgressData | null> => {
  try {
    const res = await fetch(
      `${API_BASE}/my-certificates/progress/${encodeURIComponent(courseId)}`,
      {
        method: 'GET',
        headers: authHeaders(),
        credentials: 'include',
      },
    );
    if (!res.ok) return null;
    const data = await parseJsonSafe<{
      success: boolean;
      data?: CourseLearningProgressData;
    }>(res, 'Không thể tải tiến độ khóa học');
    return data.success && data.data ? data.data : null;
  } catch {
    return null;
  }
};

/**
 * Xác thực chứng chỉ công khai theo mã certificateCode (Không cần đăng nhập)
 */
export const verifyCertificate = async (
  code: string,
): Promise<VerifyCertificateData> => {
  const res = await fetch(
    `${API_BASE}/certificates/verify/${encodeURIComponent(code)}`,
    {
      method: 'GET',
    },
  );

  const data = await parseJsonSafe<{
    success: boolean;
    data?: VerifyCertificateData;
    message?: string;
  }>(res, 'Không thể xác thực chứng chỉ');

  if (data.success && data.data) return data.data;
  throw new Error(data.message || 'Không thể xác thực chứng chỉ');
};

/**
 * Phát hành chứng chỉ khi học viên hoàn thành 100% khóa học
 */
export const issueCertificate = async (
  courseId: string,
): Promise<Certificate> => {
  const res = await fetch(`${API_BASE}/my-certificates/issue`, {
    method: 'POST',
    headers: authHeaders(),
    credentials: 'include',
    body: JSON.stringify({ courseId }),
  });

  const data = await parseJsonSafe<{
    success: boolean;
    data?: Certificate;
    message?: string;
  }>(res, 'Không thể phát hành chứng chỉ');

  if (data.success && data.data) return data.data;
  throw new Error(data.message || 'Không thể phát hành chứng chỉ');
};
