export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  courseCount?: number;
}

export interface Course {
  _id: string;
  id?: string;
  title: string;
  titleEn?: string;
  slug: string;
  shortDescription: string;
  shortDescriptionEn?: string;
  description?: string;
  thumbnailUrl: string;
  badge?: string; // 'NEW', 'BESTSELLER', 'HOT', etc.
  price: number;
  discountPrice?: number;
  durationHours?: number;
  durationText?: string;
  status: string;
  averageRating: number;
  totalStudents: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  skillIds?: string[];
  isForYou?: boolean;
  categoryId?: Category | string;
  createdAt?: string;
}

export interface HomeCoursesData {
  forYou: Course[];
  bestSellers: Course[];
  newReleases: Course[];
}

export interface HomeCoursesResponse {
  success: boolean;
  data: HomeCoursesData;
  message?: string;
}
