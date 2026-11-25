import mongoose, { Document, Model, Schema } from 'mongoose';
import './User';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IInstructorApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phoneNumber: string;
  expertise: string;
  experienceYears?: number;
  bio?: string;
  teachingTopics?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  status: ApplicationStatus;
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IInstructorApplicationModel = Model<IInstructorApplication>;

const instructorApplicationSchema = new Schema<IInstructorApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    expertise: {
      type: String,
      required: true,
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: 0,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    teachingTopics: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    portfolioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    cvUrl: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'instructor_applications',
  },
);

export const InstructorApplication = mongoose.model<
  IInstructorApplication,
  IInstructorApplicationModel
>('InstructorApplication', instructorApplicationSchema);

export default InstructorApplication;
