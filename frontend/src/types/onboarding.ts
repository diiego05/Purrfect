export interface OnboardingCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  courseCount?: number;
}

export interface OnboardingSkill {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export interface OnboardingDataResponse {
  success: boolean;
  categories: OnboardingCategory[];
  skills: OnboardingSkill[];
}

export interface OnboardingPayload {
  primaryGoal: string;
  interestedCategoryIds: string[];
  interestedSkillIds: string[];
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | string;
}

export interface OnboardingSurveyRecord {
  _id: string;
  userId: string;
  primaryGoal: string;
  interestedCategoryIds: string[];
  interestedSkillIds: string[];
  skillLevel: string;
  completedAt: string;
}

export interface OnboardingSaveResponse {
  success: boolean;
  message: string;
  survey?: OnboardingSurveyRecord;
}
