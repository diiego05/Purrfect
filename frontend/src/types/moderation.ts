export type ReportTargetType = 'DISCUSSION' | 'REVIEW';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'HARASSMENT'
  | 'MALICIOUS_LINK'
  | 'OFF_TOPIC'
  | 'OTHER';

export interface ContentReportUser {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  violationCount?: number;
  isLocked?: boolean;
  lockedUntil?: string | null;
}

export interface ReportTargetContent {
  _id: string;
  content?: string;
  comment?: string;
  rating?: number;
  status?: string;
  userId?: ContentReportUser;
  courseId?: {
    _id: string;
    title: string;
    slug: string;
  };
  createdAt?: string;
}

export interface ContentReportItem {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  offendingUserId: ContentReportUser;
  reportedBy: ContentReportUser;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  moderatedBy?: ContentReportUser | null;
  moderatedAt?: string | null;
  moderationAction?: 'HIDE' | 'DELETE' | null;
  targetContent?: ReportTargetContent | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationSummary {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

export interface ModerationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ModerationReportsResponse {
  success: boolean;
  message?: string;
  data: {
    reports: ContentReportItem[];
    pagination: ModerationPagination;
    summary: ModerationSummary;
  };
}

export interface ModerationActionResponse {
  success: boolean;
  message?: string;
  data?: {
    report?: ContentReportItem;
    violationCount?: number;
    accountLocked?: boolean;
  };
}

export interface SubmitReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam / Quảng cáo',
  INAPPROPRIATE: 'Nội dung không phù hợp',
  HARASSMENT: 'Quấy rối / Xúc phạm',
  MALICIOUS_LINK: 'Liên kết độc hại',
  OFF_TOPIC: 'Lạc đề / Không liên quan',
  OTHER: 'Lý do khác',
};
