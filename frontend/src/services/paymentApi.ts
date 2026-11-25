import { authFetch } from './authApi';
import { parseJsonSafe } from '../utils/api';

export interface CreatePaymentPayload {
  courseId: string;
  couponCode?: string;
  bankCode?: string;
  paymentMethod?: string;
}

export interface DirectCheckoutPayload {
  courseId: string;
  couponCode?: string;
  bankCode?: string;
  paymentMethod?:
    'DIRECT' | 'BANK_TRANSFER' | 'VNPAY' | 'MOCK' | 'FREE' | 'PURR_POINTS';
}

export interface DirectCheckoutResponse {
  success: boolean;
  isEnrolled?: boolean;
  message?: string;
  order?: VNPayReturnResponse['order'];
  orderCode?: string;
  finalAmount?: number;
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
   * Hoàn tất thanh toán trực tiếp / Kích hoạt khóa học ngay lập tức
   */
  async directCheckout(
    payload: DirectCheckoutPayload,
  ): Promise<DirectCheckoutResponse> {
    const res = await authFetch('/api/payment/direct-checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<DirectCheckoutResponse>(
      res,
      'Không thể hoàn tất thanh toán trực tiếp',
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
  async checkEnrollment(
    courseId: string,
  ): Promise<{ isEnrolled: boolean; refundStatus?: string; message?: string }> {
    try {
      const res = await authFetch(`/api/payment/check-enrollment/${courseId}`);
      if (!res.ok) return { isEnrolled: false };
      return await parseJsonSafe<{
        isEnrolled: boolean;
        refundStatus?: string;
        message?: string;
      }>(res);
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
    courseId?: string,
  ): Promise<ValidateCouponResponse> {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount, courseId }),
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

  /**
   * Lấy thông tin đơn hàng hiển thị trên Cổng VNPAY Gateway
   */
  async getGatewayOrderInfo(orderCode: string): Promise<{
    success: boolean;
    message?: string;
    order?: {
      orderCode: string;
      amount: number;
      status: string;
      course?: {
        title: string;
        slug: string;
        thumbnailUrl?: string;
        price?: number;
      };
      createdAt: string;
    };
  }> {
    try {
      const res = await fetch(`/api/payment/gateway-order/${orderCode}`);
      return await parseJsonSafe(res, 'Không thể tải thông tin đơn hàng VNPAY');
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ',
      };
    }
  },

  /**
   * Hoàn tất giao dịch tại Cổng VNPAY và nhận Redirect URL có chữ ký
   */
  async completeGatewayPayment(payload: {
    orderCode: string;
    cardNumber?: string;
    cardHolder?: string;
    issueDate?: string;
    otp?: string;
  }): Promise<{
    success: boolean;
    redirectUrl?: string;
    message?: string;
  }> {
    try {
      const res = await fetch('/api/payment/vnpay-complete-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await parseJsonSafe(res, 'Lỗi xử lý giao dịch tại cổng VNPAY');
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error ? err.message : 'Lỗi kết nối cổng thanh toán',
      };
    }
  },

  /**
   * Lấy lịch sử giao dịch mua hàng của học viên (  Trigger)
   */
  async getMyOrders(): Promise<{
    orders: Array<{
      _id: string;
      orderCode: string;
      amount: number;
      originalAmount: number;
      discountAmount: number;
      couponCode?: string;
      status:
        | 'PENDING'
        | 'PAID'
        | 'FAILED'
        | 'CANCELLED'
        | 'REFUND_PENDING'
        | 'REFUNDED';
      paymentMethod: string;
      isManualEnrollment?: boolean;
      courseId?: {
        _id: string;
        title: string;
        slug: string;
        thumbnailUrl?: string;
        price: number;
      };
      createdAt: string;
    }>;
  }> {
    const res = await authFetch('/api/payment/my-orders');
    return parseJsonSafe(res, 'Không thể tải lịch sử đơn hàng');
  },
};
