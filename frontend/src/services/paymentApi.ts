import { authFetch } from './authApi';
import { parseJsonSafe } from '../utils/api';

export interface CreatePaymentPayload {
  courseId: string;
  couponCode?: string;
  bankCode?: string;
}

export interface CreatePaymentResponse {
  isFree?: boolean;
  isFreeOrder?: boolean;
  success: boolean;
  paymentUrl?: string;
  orderCode?: string;
  finalAmount?: number;
  message?: string;
}

export interface VNPayReturnResponse {
  success: boolean;
  message: string;
  order?: {
    _id: string;
    orderCode: string;
    amount: number;
    originalAmount: number;
    discountAmount: number;
    couponCode?: string;
    status: 'PAID' | 'FAILED' | 'PENDING' | 'CANCELLED';
    paymentMethod: string;
    vnpayDetails?: {
      transactionNo?: string;
      bankCode?: string;
      bankTranNo?: string;
      cardType?: string;
      payDate?: string;
      responseCode?: string;
      txnRef?: string;
    };
    courseId?: {
      _id: string;
      title: string;
      slug: string;
      thumbnailUrl?: string;
      price?: number;
    };
    createdAt?: string;
  };
}

export interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  discountAmount?: number;
  finalAmount?: number;
  coupon?: {
    code: string;
    discountType: 'PERCENT' | 'FIXED_AMOUNT';
    discountValue: number;
  };
}

export const paymentApi = {
  /**
   * Tạo URL thanh toán VNPAY (hoặc đăng ký ngay nếu miễn phí)
   */
  async createPaymentUrl(
    payload: CreatePaymentPayload,
  ): Promise<CreatePaymentResponse> {
    const res = await authFetch('/api/payment/create-vnpay-url', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<CreatePaymentResponse>(
      res,
      'Không thể khởi tạo phiên thanh toán',
    );
  },

  /**
   * Xác thực kết quả thanh toán từ VNPAY khi được redirect về
   */
  async verifyVNPayReturn(queryString: string): Promise<VNPayReturnResponse> {
    const cleanQuery = queryString.startsWith('?')
      ? queryString.substring(1)
      : queryString;
    const res = await fetch(`/api/payment/vnpay-return?${cleanQuery}`);
    return parseJsonSafe<VNPayReturnResponse>(
      res,
      'Không thể xác thực kết quả thanh toán',
    );
  },

  /**
   * Kiểm tra người dùng đã mua / đăng ký khóa học này chưa
   */
  async checkEnrollment(courseId: string): Promise<{ isEnrolled: boolean }> {
    try {
      const res = await authFetch(`/api/payment/check-enrollment/${courseId}`);
      if (!res.ok) return { isEnrolled: false };
      return await parseJsonSafe<{ isEnrolled: boolean }>(res);
    } catch {
      return { isEnrolled: false };
    }
  },

  /**
   * Kiểm tra tính hợp lệ và giá trị giảm của mã giảm giá
   */
  async validateCoupon(
    code: string,
    orderAmount: number,
  ): Promise<ValidateCouponResponse> {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount }),
      });
      return await parseJsonSafe<ValidateCouponResponse>(
        res,
        'Lỗi kiểm tra mã giảm giá',
      );
    } catch {
      return {
        valid: false,
        message: 'Lỗi kết nối khi kiểm tra mã giảm giá.',
      };
    }
  },
};
