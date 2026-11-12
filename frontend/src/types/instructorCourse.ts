import type { Category, SkillItem } from './course';

export type LectureType = 'VIDEO' | 'DOCUMENT';

export interface LectureItem {
  _id?: string;
  title: string;
  type: LectureType;
  contentUrl?: string;
  fileName?: string;
  fileSize?: number; // bytes (max 2GB - BR06.2)
  durationMinutes: number;
  isPreview: boolean;
  order: number;
  compressionStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // BR06.5
  transcript?: string; // BR06.5 trích xuất phụ đề cho RAG Chatbot
  transcriptStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface SectionItem {
  _id?: string;
  title: string;
  order: number;
  lectures: LectureItem[];
}

export type InstructorCourseStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'DISABLED';

export interface InstructorCourse {
  _id: string;
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
