import mongoose, { Document, Schema } from 'mongoose';

export type InteractionType =
  'SEARCH' | 'VIEW' | 'CART' | 'ENROLL' | 'PROGRESS' | 'RATING';

export interface IUserInteraction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId | null;
  actionType: InteractionType;
  searchKeyword?: string;
  weightScore: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const userInteractionSchema = new Schema<IUserInteraction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    actionType: {
      type: String,
      enum: ['SEARCH', 'VIEW', 'CART', 'ENROLL', 'PROGRESS', 'RATING'],
      required: true,
      index: true,
    },
    searchKeyword: {
      type: String,
      default: '',
      trim: true,
    },
    weightScore: {
      type: Number,
      required: true,
      default: 1.0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'user_interactions',
  },
);

userInteractionSchema.index({ userId: 1, actionType: 1, createdAt: -1 });
userInteractionSchema.index({ courseId: 1, actionType: 1 });

export const UserInteraction = mongoose.model<IUserInteraction>(
  'UserInteraction',
  userInteractionSchema,
);
