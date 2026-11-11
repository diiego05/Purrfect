import { authFetch } from './authApi';
import type {
  InstructorCourse,
  InstructorStats,
  LectureItem,
} from '../types/instructorCourse';
import { parseApiJson } from '../utils/api';

const API_BASE = '/api/instructor/courses';

/**
 * Lấy danh sách khóa học của Giảng viên & Thống kê KPI
 */
export const fetchInstructorCourses = async (params?: {
  status?: string;
  search?: string;
}): Promise<{
  success: boolean;
  data: {
    courses: InstructorCourse[];
    stats: InstructorStats;
  };
}> => {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);

  const url = `${API_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return parseApiJson(res, 'Lỗi khi tải danh sách khóa học giảng viên');
};

/**
 * Lấy chi tiết 1 khóa học để chỉnh sửa
 */
export const fetchInstructorCourseById = async (
  id: string,
): Promise<{ success: boolean; data: InstructorCourse }> => {
  const res = await authFetch(`${API_BASE}/${id}`);
  return parseApiJson(res, 'Lỗi khi tải chi tiết khóa học');
};

/**
 * Khởi tạo khóa học mới (Bản nháp - DRAFT)
 */
export const createCourseDraft = async (
  payload: Partial<InstructorCourse>,
): Promise<{ success: boolean; message: string; data: InstructorCourse }> => {
  const res = await authFetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi tạo bản nháp khóa học');
};

/**
 * Cập nhật thông tin khóa học / đề cương / học phí
 */
export const updateInstructorCourse = async (
  id: string,
  payload: Partial<InstructorCourse>,
): Promise<{ success: boolean; message: string; data: InstructorCourse }> => {
  const res = await authFetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi cập nhật khóa học');
};

/**
 * Tải ảnh đại diện khóa học lên Cloudinary
 */
export const uploadCourseThumbnail = async (
  file: File,
  courseId?: string,
): Promise<{
  success: boolean;
  message: string;
  url: string;
  thumbnailUrl: string;
}> => {
  const formData = new FormData();
  formData.append('image', file);
  if (courseId) {
    formData.append('courseId', courseId);
  }

  const url = courseId
    ? `${API_BASE}/${courseId}/upload-thumbnail`
    : `${API_BASE}/upload-thumbnail`;

  const res = await authFetch(url, {
    method: 'POST',
    body: formData,
  });

  return parseApiJson(res, 'Lỗi khi tải ảnh lên');
};

/**
 * Tải lên tệp video hoặc tài liệu bài giảng (BR06.2, BR06.5)
 * Kích hoạt xử lý nén video và trích xuất transcript phục vụ AI RAG Chatbot
 */
export const uploadLectureMedia = async (
  id: string | undefined | null,
  payload: {
    lectureTitle: string;
    type: 'VIDEO' | 'DOCUMENT';
    fileName: string;
    fileSize: number;
    durationMinutes: number;
    isPreview: boolean;
    file?: File;
  },
): Promise<{ success: boolean; message: string; data: LectureItem }> => {
  const url =
    id && id !== 'temp' && id !== 'new'
      ? `${API_BASE}/${id}/upload-lecture`
      : `${API_BASE}/upload-lecture`;

  let res: Response;

  if (payload.file) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('lectureTitle', payload.lectureTitle);
    formData.append('type', payload.type);
    formData.append('fileName', payload.fileName || payload.file.name);
    formData.append('fileSize', String(payload.fileSize || payload.file.size));
    formData.append('durationMinutes', String(payload.durationMinutes || 12));
    formData.append('isPreview', String(payload.isPreview));

    res = await authFetch(url, {
      method: 'POST',
      body: formData,
    });
  } else {
    res = await authFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  return parseApiJson(res, 'Lỗi khi xử lý tệp bài giảng');
};

/**
 * Gửi yêu cầu phê duyệt khóa học lên Admin (BR06.1, Exception 8a)
 */
export const submitCourseForApproval = async (
  id: string,
): Promise<{ success: boolean; message: string; data: InstructorCourse }> => {
  const res = await authFetch(`${API_BASE}/${id}/submit-approval`, {
    method: 'POST',
  });
  return parseApiJson(res, 'Lỗi khi gửi phê duyệt khóa học');
};

/**
 * Xóa hoặc chuyển trạng thái ngừng kinh doanh (BR06.4)
 */
export const deleteOrDisableCourse = async (
  id: string,
): Promise<{
  success: boolean;
  action: 'DELETED' | 'DISABLED';
  message: string;
  data?: InstructorCourse;
}> => {
  const res = await authFetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return parseApiJson(res, 'Lỗi khi xóa khóa học');
};

/**
 * Chuyển đổi trạng thái giữa PUBLISHED và DISABLED
 */
export const toggleCourseStatus = async (
  id: string,
): Promise<{ success: boolean; message: string; data: InstructorCourse }> => {
  const res = await authFetch(`${API_BASE}/${id}/toggle-status`, {
    method: 'PATCH',
  });
  return parseApiJson(res, 'Lỗi khi thay đổi trạng thái khóa học');
};

/**
 * Quản trị viên duyệt khóa học (Chuyển sang PUBLISHED - BR06.1)
 */
export const approveInstructorCourse = async (
  id: string,
): Promise<{ success: boolean; message: string; data: InstructorCourse }> => {
  const res = await authFetch(`${API_BASE}/${id}/approve`, {
    method: 'POST',
  });
  return parseApiJson(res, 'Lỗi khi phê duyệt khóa học');
};

/**
 * Quản trị viên từ chối phê duyệt khóa học (Chuyển sang REJECTED)
 */
export const rejectInstructorCourse = async (
  id: string,
  reason?: string,
): Promise<{ success: boolean; message: string; data: InstructorCourse }> => {
  const res = await authFetch(`${API_BASE}/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return parseApiJson(res, 'Lỗi khi từ chối khóa học');
};
