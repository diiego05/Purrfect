import { authFetch } from './authApi';
import { parseJsonSafe } from '../utils/api';

export interface RefundEligibilityResponse {
  success: boolean;
  isEligible: boolean;
  errorCode?:
    | 'OVER_14_DAYS'
    | 'COMPLETED_3_OR_MORE'
    | 'CERTIFICATE_ISSUED'
    | 'ALREADY_REQUESTED'
    | 'MANUAL_ENROLLMENT_NON_REFUNDABLE'
    | 'EXCEEDED_MAX_REFUND_LIMIT';
  errorMessage?: string;
  message?: string;
  daysPassed: number;
  completedLecturesCount: number;
  hasCertificate: boolean;
  refundCount?: number;
  maxRefunds?: number;
  pointConversionRate?: number;
  estimatedPoints?: number;
  order?: {
    _id: string;
    orderCode: string;
    amount: number;
    createdAt: string;
    course?: {
      _id: string;
      title: string;
      thumbnailUrl?: string;
      price: number;
    };
  };
}

export interface RefundRequestItem {
  _id: string;
  orderId: {
    _id: string;
    orderCode: string;
    amount: number;
    paymentMethod: string;
    createdAt: string;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
  courseId: {
    _id: string;
    title: string;
    slug?: string;
    thumbnailUrl?: string;
    price: number;
  };
  instructorId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  amount: number;
  reason: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  adminNotes?: string;
  pointsRefunded?: number;
  processedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  processedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const refundApi = {
  // Kiểm tra điều kiện hoàn tiền
  async checkEligibility(orderId: string): Promise<RefundEligibilityResponse> {
    const res = await authFetch(`/api/refunds/eligibility/${orderId}`);
    return parseJsonSafe<RefundEligibilityResponse>(
      res,
      'Lỗi khi kiểm tra điều kiện hoàn tiền',
    );
  },

  // Gửi yêu cầu hoàn tiền (  Basic Flow 4, 5)
  async createRefundRequest(
    orderId: string,
    reason: string,
    notes?: string,
  ): Promise<{
    success: boolean;
    message: string;
    refundRequest?: RefundRequestItem;
  }> {
    const res = await authFetch('/api/refunds/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason, notes }),
    });
    return parseJsonSafe(res, 'Lỗi khi gửi yêu cầu hoàn tiền');
  },

  // Hủy yêu cầu hoàn tiền khi đang PENDING (  Alternative Flow 4a &
  async cancelRefundRequest(
    requestId: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`/api/refunds/cancel/${requestId}`, {
      method: 'POST',
    });
    return parseJsonSafe(res, 'Lỗi khi hủy yêu cầu hoàn tiền');
  },

  // Lấy các yêu cầu hoàn tiền của học viên hiện tại
  async getMyRefundRequests(): Promise<{
    success: boolean;
    requests: RefundRequestItem[];
  }> {
    const res = await authFetch('/api/refunds/my-requests');
    return parseJsonSafe(res, 'Không thể tải danh sách yêu cầu hoàn tiền');
  },

  // [Admin] Lấy danh sách toàn bộ yêu cầu hoàn tiền
  async getAdminRefundRequests(
    status?: string,
    search?: string,
  ): Promise<{ success: boolean; requests: RefundRequestItem[] }> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await authFetch(`/api/refunds/admin/requests${query}`);
    return parseJsonSafe(res, 'Lỗi tải danh sách yêu cầu hoàn tiền admin');
  },

  // [Admin] Phê duyệt hoặc Từ chối yêu cầu hoàn tiền
  async processAdminRefund(
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    adminNotes?: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`/api/refunds/admin/process/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rejectionReason, adminNotes }),
    });
    return parseJsonSafe(res, 'Lỗi khi xử lý yêu cầu hoàn tiền');
  },

  // [Giảng viên] Lấy nhật ký yêu cầu hoàn tiền của học viên đối với khóa học của mình
  async getInstructorRefundRequests(): Promise<{
    success: boolean;
    data: {
      totalRequests: number;
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      refundedRevenue: number;
      pendingRefundRevenue: number;
      requests: RefundRequestItem[];
    };
  }> {
    const res = await authFetch('/api/refunds/instructor/requests');
    return parseJsonSafe(res, 'Không thể tải nhật ký hoàn tiền giảng viên');
  },
};
