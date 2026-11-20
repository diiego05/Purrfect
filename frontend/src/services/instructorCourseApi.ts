import { authFetch } from './authApi';
import type {
  InstructorCourse,
  InstructorStats,
  LectureItem,
  LectureType,
} from '../types/instructorCourse';
import { parseApiJson } from '../utils/api';

const API_BASE = '/api/instructor/courses';

/**
 * Lấy danh sách khóa học của Giảng viên & Thống kê KPI
 */
export const fetchInstructorCourses = async (params?: {
  status?: string;
  search?: string;
  all?: boolean;
  adminView?: boolean;
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
  if (params?.all) query.append('all', 'true');
  if (params?.adminView) query.append('adminView', 'true');

  const url = `${API_BASE}${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return parseApiJson(res, 'Lỗi khi tải danh sách khóa học');
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
    type: LectureType;
    fileName: string;
    fileSize: number;
    durationMinutes: number;
    isPreview: boolean;
    transcript?: string;
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
    if (payload.transcript) {
      formData.append('transcript', payload.transcript);
    }

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

/**
 * Cập nhật transcript bài giảng trực tiếp
 */
export const updateLectureTranscript = async (
  courseId: string,
  lectureId: string,
  transcript: string,
): Promise<{ success: boolean; message: string; data: LectureItem }> => {
  const res = await authFetch(
    `${API_BASE}/${courseId}/lectures/${lectureId}/transcript`,
    {
      method: 'PUT',
      body: JSON.stringify({ transcript }),
    },
  );
  return parseApiJson(res, 'Lỗi khi cập nhật transcript bài giảng');
};

/**
 * Yêu cầu AI trích xuất lại transcript từ video bài giảng
 */
export const transcribeLectureWithAI = async (
  courseId: string,
  lectureId: string,
): Promise<{ success: boolean; message: string; data: LectureItem }> => {
  const res = await authFetch(
    `${API_BASE}/${courseId}/lectures/${lectureId}/transcribe`,
    {
      method: 'POST',
    },
  );
  return parseApiJson(res, 'Lỗi khi trích xuất transcript AI');
};

/**
 * Lấy danh sách học viên ghi danh vào các khóa học của Giảng viên
 */
export const fetchInstructorStudents = async (params?: {
  courseId?: string;
  search?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}): Promise<import('../types/instructorCourse').InstructorStudentsResponse> => {
  const query = new URLSearchParams();
  if (params?.courseId) query.append('courseId', params.courseId);
  if (params?.search) query.append('search', params.search);
  if (params?.paymentMethod)
    query.append('paymentMethod', params.paymentMethod);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const url = `${API_BASE}/students${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return parseApiJson(res, 'Lỗi khi tải danh sách học viên ghi danh');
};

/**
 * Giảng viên ghi danh thủ công học viên mới vào khóa học
 */
export const enrollManualStudentApi = async (payload: {
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId: string;
  paymentMethod?: 'VNPAY' | 'FREE';
  amount?: number;
}): Promise<{ success: boolean; message: string }> => {
  const res = await authFetch(`${API_BASE}/students/enroll-manual`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi ghi danh học viên thủ công');
};

/**
 * Lấy danh sách học viên của 1 khóa học cụ thể
 */
export const fetchCourseStudentsApi = async (
  courseId: string,
  params?: {
    search?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  },
): Promise<import('../types/instructorCourse').InstructorStudentsResponse> => {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.paymentMethod)
    query.append('paymentMethod', params.paymentMethod);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const url = `${API_BASE}/${courseId}/students${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return parseApiJson(res, 'Lỗi khi tải danh sách học viên của khóa học');
};

/**
 * Giảng viên chặn hoặc mở chặn quyền học của học viên trong khóa học
 */
export const toggleBlockStudentApi = async (payload: {
  enrollmentId?: string;
  studentId?: string;
  courseId?: string;
  isBlocked: boolean;
}): Promise<{
  success: boolean;
  message: string;
  data?: { isBlocked: boolean };
}> => {
  const res = await authFetch(`${API_BASE}/students/toggle-block`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi thay đổi trạng thái chặn học viên');
};

/**
 * Giảng viên xóa học viên ra khỏi khóa học
 */
export const removeStudentFromCourseApi = async (payload: {
  enrollmentId?: string;
  studentId?: string;
  courseId?: string;
}): Promise<{ success: boolean; message: string }> => {
  const res = await authFetch(`${API_BASE}/students/remove`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi xóa học viên ra khỏi khóa học');
};

/**
 * Thống kê giảng viên: Thống kê tổng khóa học đang có và tổng doanh thu từng tháng
 */
export const fetchInstructorStatisticsApi = async (): Promise<{
  success: boolean;
  data: {
    coursesStats: {
      totalCourses: number;
      publishedCourses: number;
      pendingCourses: number;
      draftCourses: number;
      disabledCourses: number;
      totalStudentsCount: number;
      totalEstimatedRevenue: number;
      coursesList: Array<{
        id: string;
        title: string;
        slug: string;
        thumbnailUrl: string;
        status: string;
        level: string;
        price: number;
        discountPrice?: number;
        totalStudents: number;
        sectionsCount: number;
        lecturesCount: number;
        badge: string;
        createdAt: string;
        revenue: number;
      }>;
    };
    revenueStats: {
      year: number;
      totalAccumulatedRevenue: number;
      currentMonthRevenue: number;
      lastMonthRevenue: number;
      avgMonthlyRevenue: number;
      monthlyBreakdown: Array<{
        monthNumber: number;
        monthLabel: string;
        year: number;
        revenue: number;
        ordersCount: number;
        enrollmentsCount: number;
      }>;
    };
  };
}> => {
  const res = await authFetch(`${API_BASE}/statistics`);
  return parseApiJson(res, 'Lỗi khi tải dữ liệu thống kê');
};
