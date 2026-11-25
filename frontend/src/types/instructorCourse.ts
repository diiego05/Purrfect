import type { Category, SkillItem } from './course';

export type LectureType = 'VIDEO' | 'DOCUMENT' | 'QUIZ';

export interface QuizQuestionItem {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  question: string;
  options?: string[];
  correctAnswer?: number | string;
  explanation: string;
  sampleAnswer?: string;
  points?: number;
}

export interface QuizDataItem {
  title?: string;
  description?: string;
  passingScore?: number;
  questions: QuizQuestionItem[];
  availableFrom?: string; // Thời điểm bắt đầu mở đề
  availableUntil?: string; // Thời điểm đóng đề (hạn chót)
  timeLimitMinutes?: number; // Thời gian làm bài (phút)
}

export interface LectureItem {
  _id?: string;
  title: string;
  type: LectureType;
  contentUrl?: string;
  fileName?: string;
  fileSize?: number; // bytes (max 2GB)
  durationMinutes: number;
  isPreview: boolean;
  order: number;
  compressionStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transcript?: string; // trích xuất phụ đề cho RAG Chatbot
  transcriptStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  quizData?: QuizDataItem;
}

export interface SectionItem {
  _id?: string;
  title: string;
  order: number;
  lectures: LectureItem[];
}

export type InstructorCourseStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'DISABLED';

export interface InstructorUserSummary {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  headline?: string;
  bio?: string;
}

export interface InstructorCourse {
  _id: string;
  instructorId?: InstructorUserSummary | string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  categoryId?: Category | string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  skillIds?: SkillItem[] | string[];
  thumbnailUrl: string;
  badge?: string;
  price: number;
  discountPrice?: number;
  durationHours?: number;
  durationText?: string;
  status: InstructorCourseStatus;
  averageRating: number;
  totalStudents: number;
  sections: SectionItem[];
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstructorStats {
  total: number;
  published: number;
  pendingApproval: number;
  draft: number;
  rejected: number;
  disabled: number;
  totalStudents: number;
  totalRevenue: number;
}

export interface EnrolledStudentItem {
  id: string;
  enrollmentId: string;
  orderCode: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    phoneNumber?: string;
  };
  course: {
    id: string;
    title: string;
    slug?: string;
    thumbnail?: string;
    price: number;
    totalLectures: number;
  };
  paymentMethod: 'VNPAY' | 'FREE';
  isManualEnrollment?: boolean;
  amount: number;
  enrolledAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'BLOCKED';
  progress?: number;
  completedLectures?: number;
}

export interface InstructorStudentsStats {
  totalEnrollments: number;
  uniqueStudents: number;
  paidEnrollments: number;
  freeEnrollments: number;
  totalRevenue: number;
  coursesCount: number;
}

export interface InstructorStudentsResponse {
  success: boolean;
  data: {
    students: EnrolledStudentItem[];
    stats: InstructorStudentsStats;
    courses: Array<{
      id: string;
      title: string;
      totalStudents: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
