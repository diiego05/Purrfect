import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  _id: mongoose.Types.ObjectId;
  certificateCode: string;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentName: string;
  courseTitle: string;
  issueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'certificates',
  },
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate = mongoose.model<ICertificate>(
  'Certificate',
  certificateSchema,
);
export default Certificate;
