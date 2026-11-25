import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash?: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  purrPoints: number;
  googleId?: string;
  onboardingCompleted?: boolean;
  violationCount: number;
  isLocked: boolean;
  lockedUntil?: Date | null;
  aiQuizWeeklyUsage?: number;
  aiQuizWeekStartDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {
  incrementViolationCountAndWarn(
    offendingUserId: string | mongoose.Types.ObjectId,
  ): Promise<number>;

  lockAccountTemporarily(
    offendingUserId: string | mongoose.Types.ObjectId,
    days?: number,
  ): Promise<IUser | null>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      default: '',
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
      default: 'STUDENT',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
    purrPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    googleId: {
      type: String,
      default: null,
      sparse: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    violationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    aiQuizWeeklyUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiQuizWeekStartDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

// Khớp Sequence Diagram 3.2.26: User.incrementViolationCountAndWarn(offendingUserId) -> violationCount()
userSchema.statics.incrementViolationCountAndWarn = async function (
  offendingUserId: string | mongoose.Types.ObjectId,
): Promise<number> {
  const user = await this.findByIdAndUpdate(
    offendingUserId,
    { $inc: { violationCount: 1 } },
    { new: true },
  );
  return user?.violationCount ?? 0;
};

// Khớp Sequence Diagram 3.2.26: User.lockAccountTemporarily(offendingUserId, days) -> accountLocked()
userSchema.statics.lockAccountTemporarily = async function (
  offendingUserId: string | mongoose.Types.ObjectId,
  days: number = 7,
): Promise<IUser | null> {
  const lockedUntil = new Date();
  lockedUntil.setDate(lockedUntil.getDate() + days);

  return this.findByIdAndUpdate(
    offendingUserId,
    {
      $set: {
        isLocked: true,
        lockedUntil,
        status: 'BLOCKED',
      },
    },
    { new: true },
  );
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
