import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'NEW_QUESTION'
  | 'NEW_REPLY'
  | 'OFFICIAL_ANSWER_PINNED'
  | 'NEW_REVIEW_REPLY';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId | null;
  courseId?: mongoose.Types.ObjectId | null;
  lectureId?: mongoose.Types.ObjectId | null;
  discussionId?: mongoose.Types.ObjectId | null;
  reviewId?: mongoose.Types.ObjectId | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    discussionId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseDiscussion',
      default: null,
    },
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseReview',
      default: null,
    },
    type: {
      type: String,
      enum: ['NEW_QUESTION', 'NEW_REPLY', 'OFFICIAL_ANSWER_PINNED', 'NEW_REVIEW_REPLY'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  },
);

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema,
);

export default Notification;
