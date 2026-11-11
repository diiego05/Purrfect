import mongoose, { Document, Schema } from 'mongoose';

export interface IAiQuota extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  monthYear: string; // YYYY-MM
  aiChatUsed: number;
  aiChatLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiQuotaSchema = new Schema<IAiQuota>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    monthYear: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    aiChatUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiChatLimit: {
      type: Number,
      default: 50,
      min: 1,
    },
  },
  {
    timestamps: true,
    collection: 'ai_quotas',
  },
);

// Mỗi user chỉ có 1 bản ghi quota mỗi tháng
aiQuotaSchema.index({ userId: 1, monthYear: 1 }, { unique: true });

export const AiQuota = mongoose.model<IAiQuota>('AiQuota', aiQuotaSchema);

