import { authFetch } from './authApi';
import { parseJsonSafe } from '../utils/api';

export interface WithdrawalRequestItem {
  _id: string;
  instructorId: {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    phoneNumber?: string;
  };
  amount: number;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  adminNotes?: string;
  processedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorBalanceData {
  totalRevenue: number;
  availableBalance: number;
  pendingWithdrawalAmount: number;
  approvedWithdrawalAmount: number;
  minWithdrawal: number;
  coursesCount: number;
  ordersCount: number;
  withdrawals: WithdrawalRequestItem[];
}

export const withdrawalApi = {
  // Lấy số dư và lịch sử rút tiền của Giảng viên
  async getInstructorBalance(): Promise<{
    success: boolean;
    data: InstructorBalanceData;
  }> {
    const res = await authFetch('/api/withdrawals/instructor/balance');
    return parseJsonSafe(res, 'Không thể tải thông tin số dư giảng viên');
  },

  // Giảng viên gửi yêu cầu rút tiền
  async createWithdrawalRequest(params: {
    amount: number;
    bankName: string;
    bankAccount: string;
    accountHolder: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message: string;
    withdrawalRequest?: WithdrawalRequestItem;
  }> {
    const res = await authFetch('/api/withdrawals/instructor/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return parseJsonSafe(res, 'Lỗi khi gửi yêu cầu rút tiền');
  },

  // [Admin] Lấy toàn bộ danh sách yêu cầu rút tiền
  async getAdminWithdrawals(
    status?: string,
    search?: string,
  ): Promise<{ success: boolean; withdrawals: WithdrawalRequestItem[] }> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (search) params.append('search', search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await authFetch(`/api/withdrawals/admin/requests${query}`);
    return parseJsonSafe(res, 'Lỗi tải danh sách yêu cầu rút tiền admin');
  },

  // [Admin] Duyệt hoặc từ chối yêu cầu rút tiền
  async processAdminWithdrawal(
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    adminNotes?: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`/api/withdrawals/admin/process/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rejectionReason, adminNotes }),
    });
    return parseJsonSafe(res, 'Lỗi khi xử lý duyệt rút tiền');
  },
};
