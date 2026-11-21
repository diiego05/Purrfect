import mongoose, { Document, Schema } from 'mongoose';

export type WithdrawalStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface IWithdrawalRequest extends Document {
  _id: mongoose.Types.ObjectId;
  instructorId: mongoose.Types.ObjectId;
  amount: number;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  notes?: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    bankAccount: {
      type: String,
      required: true,
      trim: true,
    },
    accountHolder: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'withdrawal_requests',
  },
);

withdrawalRequestSchema.index({ instructorId: 1, createdAt: -1 });
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>(
  'WithdrawalRequest',
  withdrawalRequestSchema,
);
export default WithdrawalRequest;
