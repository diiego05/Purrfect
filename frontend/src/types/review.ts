export type ReviewReplyRole = 'INSTRUCTOR' | 'ADMIN';

export interface ReviewUserSummary {
  _id: string;
  fullName?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
}

export interface CourseReviewItem {
  _id: string;
  courseId: string | { _id: string; title: string; slug: string; thumbnailUrl?: string };
  userId: ReviewUserSummary;
  rating: number; // 1 - 5 sao
  comment: string;
  instructorReply?: string | null;
  repliedAt?: string | Date | null;
  repliedBy?: ReviewUserSummary | null;
  replyRole?: ReviewReplyRole | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  starCounts: Record<number, number>;
  starPercentages: Record<number, number>;
}

export interface CourseReviewsApiResponse {
  success: boolean;
  message?: string;
  data: {
    reviews: CourseReviewItem[];
    stats: ReviewStats;
    userMeta: {
      isEnrolled: boolean;
      isCourseOwner: boolean;
      hasReviewed: boolean;
      myReview?: CourseReviewItem | null;
    };
  };
}

export interface InstructorReviewsSummary {
  totalReviews: number;
  unrepliedCount: number;
  repliedCount: number;
  responseRate: number;
}

export interface InstructorReviewsApiResponse {
  success: boolean;
  message?: string;
  data: {
    reviews: CourseReviewItem[];
    courses: Array<{
      _id: string;
      title: string;
      slug: string;
      thumbnailUrl?: string;
      averageRating?: number;
    }>;
    summary: InstructorReviewsSummary;
  };
}
