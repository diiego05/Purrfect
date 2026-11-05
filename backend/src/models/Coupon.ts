import mongoose, { Document, Schema } from 'mongoose';

export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  totalUsageLimit: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FIXED_AMOUNT'],
      required: true,
      default: 'PERCENT',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalUsageLimit: {
      type: Number,
      default: 100,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'coupons',
  }
);

export default mongoose.model<ICoupon>('Coupon', CouponSchema);

