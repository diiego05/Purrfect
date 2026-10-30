import mongoose, { Document, Schema } from 'mongoose';

export interface IOnboardingSurvey extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  primaryGoal: string; // Bước 1: Mục tiêu học tập chính
  interestedCategoryIds: mongoose.Types.ObjectId[]; // Bước 2: Lĩnh vực quan tâm
  interestedSkillIds: mongoose.Types.ObjectId[]; // Bước 3: Kỹ năng cụ thể
  skillLevel: string; // Bước 4: Trình độ hiện tại (Beginner, Intermediate, Advanced)
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const onboardingSurveySchema = new Schema<IOnboardingSurvey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Mỗi user có 1 bản khảo sát onboarding chính
    },
    primaryGoal: {
      type: String,
      required: true,
      trim: true,
    },
    interestedCategoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    interestedSkillIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    skillLevel: {
      type: String,
      required: true,
      enum: [
        'Beginner',
        'Intermediate',
        'Advanced',
        'Mới bắt đầu',
        'Trung cấp',
        'Nâng cao',
      ],
      default: 'Beginner',
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'onboarding_surveys',
  },
);

export const OnboardingSurvey = mongoose.model<IOnboardingSurvey>(
  'OnboardingSurvey',
  onboardingSurveySchema,
);
