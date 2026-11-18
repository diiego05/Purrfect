export interface DiscussionUser {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export interface DiscussionReply {
  _id: string;
  courseId: string;
  lectureId: string;
  userId: DiscussionUser;
  parentId?: string | null;
  content: string;
  upvoteCount: number;
  isPinned: boolean;
  isAuthor: boolean;
  isInstructor: boolean;
  isUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionQuestion {
  _id: string;
  courseId: string;
  lectureId: string;
  userId: DiscussionUser;
  parentId?: string | null;
  content: string;
  upvoteCount: number;
  isPinned: boolean;
  isAuthor: boolean;
  isInstructor: boolean;
  isUpvoted: boolean;
  replies: DiscussionReply[];
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionsMeta {
  totalQuestions: number;
  totalReplies: number;
  isCourseInstructor: boolean;
  isAdmin: boolean;
  isEnrolled: boolean;
}

export interface DiscussionsApiResponse {
  success: boolean;
  message?: string;
  isEnrolled?: boolean;
  data: DiscussionQuestion[];
  meta: DiscussionsMeta;
}

export interface DiscussionSingleApiResponse<T = DiscussionQuestion | DiscussionReply> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
  };
  courseId: {
    _id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
  };
  lectureId: string;
  discussionId?: string;
  type: 'NEW_QUESTION' | 'NEW_REPLY' | 'OFFICIAL_ANSWER_PINNED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
