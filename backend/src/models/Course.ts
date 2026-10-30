import mongoose, { Document, Schema } from 'mongoose';

export type CourseStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'DISABLED';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  instructorId?: mongoose.Types.ObjectId | null;
  categoryId?: mongoose.Types.ObjectId | null;
  title: string;
  slug: string;
  shortDescription: string;
  description?: string;
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
    title: {
      type: String,
      required: true,
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
    description: {
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
    isDeleted: {
      type: Boolean,
      default: false,
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

export const Course = mongoose.model<ICourse>('Course', courseSchema);
