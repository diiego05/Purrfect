import mongoose, { Document, Schema } from 'mongoose';

export type OtpType = 'REGISTER' | 'FORGOT_PASSWORD';

export interface IOtp extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  email: string;
  code: string;
  type: OtpType;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['REGISTER', 'FORGOT_PASSWORD'],
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // auto TTL delete in MongoDB when expiresAt is reached
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'otps',
  }
);

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
