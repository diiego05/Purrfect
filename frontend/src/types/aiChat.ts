export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedCourses?: ChatSuggestedCourse[];
  timestamp: Date;
}

export interface ChatSuggestedCourse {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number;
  thumbnailUrl?: string;
  averageRating?: number;
  level?: string;
}

export interface AiQuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  monthYear?: string;
}

export interface AiChatApiResponse {
  success: boolean;
  message?: string;
  data?: {
    message: string;
    suggestedCourses: ChatSuggestedCourse[];
    quota: AiQuotaInfo;
  };
  fallback?: {
    faqUrl: string;
    coursesUrl: string;
    supportEmail: string;
  };
  quota?: AiQuotaInfo;
}

