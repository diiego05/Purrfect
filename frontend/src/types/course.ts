export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  courseCount?: number;
}

export interface Instructor {
  _id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
}

export interface SkillItem {
  _id?: string;
  name: string;
  slug?: string;
}

export interface CourseLecture {
  _id?: string;
  title: string;
  type?: string;
  contentUrl?: string;
  fileName?: string;
  durationMinutes?: number;
  isPreview?: boolean;
  transcript?: string;
  order?: number;
  quizData?: {
    title?: string;
    description?: string;
    passingScore?: number;
    availableFrom?: string;
    availableUntil?: string;
    timeLimitMinutes?: number;
    questions: Array<{
      id: string;
      type: 'MULTIPLE_CHOICE' | 'ESSAY';
      question: string;
      options?: string[];
      correctAnswer?: number | string;
      explanation: string;
      sampleAnswer?: string;
      points?: number;
    }>;
  };
}

export interface CourseSection {
  _id?: string;
  title: string;
  order?: number;
  lectures?: CourseLecture[];
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
  descriptionEn?: string;
  thumbnailUrl: string;
  badge?: string;
  price: number;
  discountPrice?: number;
  durationHours?: number;
  durationText?: string;
  status: string;
  averageRating: number;
  totalStudents: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  skillIds?: SkillItem[] | string[];
  isForYou?: boolean;
  categoryId?: Category | string;
  instructorId?: Instructor | string;
  sections?: CourseSection[];
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
