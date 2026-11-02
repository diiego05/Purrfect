import mongoose, { Document, Schema } from 'mongoose';

export type CourseStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'DISABLED';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  instructorId?: mongoose.Types.ObjectId | null;
  categoryId?: mongoose.Types.ObjectId | null;
  skillIds: mongoose.Types.ObjectId[];
  level: CourseLevel;
  title: string;
  titleEn?: string;
  slug: string;
  shortDescription: string;
  shortDescriptionEn?: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl: string;
  badge?: string; // 'NEW', 'HOT', 'BESTSELLER', etc.
  price: number;
  discountPrice?: number;
  durationHours: number; // e.g. 20 -> displays as '20h'
  durationText?: string; // e.g. '20h'
  status: CourseStatus;
  averageRating: number;
  totalStudents: number;
  isForYou: boolean;
  prerequisiteCourseIds?: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    skillIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleEn: {
      type: String,
      default: '',
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      default: '',
      trim: true,
    },
    shortDescriptionEn: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    descriptionEn: {
      type: String,
      default: '',
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    durationHours: {
      type: Number,
      default: 0,
    },
    durationText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'DISABLED'],
      default: 'PUBLISHED',
      index: true,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    isForYou: {
      type: Boolean,
      default: false,
    },
    prerequisiteCourseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'courses',
  },
);

// Indexes phục vụ Content-Based search và lọc
courseSchema.index({ categoryId: 1, level: 1, status: 1 });
courseSchema.index({ skillIds: 1 });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
