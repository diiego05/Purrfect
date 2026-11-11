import mongoose, { Document, Schema } from 'mongoose';

export type CourseStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'DISABLED';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ILecture {
  _id?: mongoose.Types.ObjectId;
  title: string;
  type: 'VIDEO' | 'DOCUMENT';
  contentUrl?: string;
  fileName?: string;
  fileSize?: number; // bytes (<= 2GB - BR06.2)
  durationMinutes: number;
  isPreview: boolean;
  order: number;
  compressionStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // BR06.5
  transcript?: string; // BR06.5 trích xuất phụ đề cho RAG Chatbot
  transcriptStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface ISection {
  _id?: mongoose.Types.ObjectId;
  title: string;
  order: number;
  lectures: ILecture[];
}

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
  sections: ISection[];
  rejectionReason?: string;
  publishedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['VIDEO', 'DOCUMENT'], default: 'VIDEO' },
    contentUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 10 },
    isPreview: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    compressionStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
    transcript: { type: String, default: '' },
    transcriptStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
  },
  { _id: true },
);

const sectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    lectures: [lectureSchema],
  },
  { _id: true },
);

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
    sections: {
      type: [sectionSchema],
      default: [],
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
    },
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
