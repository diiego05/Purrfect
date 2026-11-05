export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT';

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  totalUsageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponFormData {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  totalUsageLimit: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface CouponValidateResult {
  valid: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
  coupon?: {
    _id: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number | null;
    minOrderAmount: number;
    description?: string;
  };
}

