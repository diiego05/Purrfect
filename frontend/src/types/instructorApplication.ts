export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface InstructorApplicationItem {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    role?: string;
  };
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  experienceYears?: number;
  bio?: string;
  teachingTopics?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  status: ApplicationStatus;
  reviewedBy?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ApplicationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApplicationsResponse {
  success: boolean;
  message?: string;
  data: {
    applications: InstructorApplicationItem[];
    pagination: ApplicationPagination;
    summary: ApplicationSummary;
  };
}

export interface SubmitApplicationPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  experienceYears?: number;
  bio?: string;
  teachingTopics?: string;
  portfolioUrl?: string;
  cvUrl?: string;
}
