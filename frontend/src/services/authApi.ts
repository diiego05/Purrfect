import type {
  AuthResponse,
  CheckEmailResponse,
  ForgotPasswordResponse,
} from '../types/auth';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/auth';

// Token được lưu trong bộ nhớ ứng dụng (Memory) trong phiên làm việc hiện tại
// Không lưu token vào localStorage để tăng cường bảo mật chống XSS.
// Token chính được lưu và truyền tự động qua HttpOnly Cookie.
let memoryToken: string | null = null;

const clearLocalStorageTokens = () => {
  try {
    localStorage.removeItem('purr_access_token');
    localStorage.removeItem('purr_token');
    localStorage.removeItem('purr_refresh_token');
  } catch {
    // Bỏ qua lỗi storage trong các môi trường giới hạn quyền
  }
};

export const getAccessToken = () => memoryToken;
export const getRefreshToken = () => undefined;

export const setTokens = (accessToken: string, _refreshToken?: string) => {
  memoryToken = accessToken;
  void _refreshToken;
  clearLocalStorageTokens();
};

export const clearTokens = () => {
  memoryToken = null;
  clearLocalStorageTokens();
};

export const authFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Luôn gửi kèm HttpOnly Cookie tự động
  };

  let res = await fetch(url, fetchOptions);

  // Nếu 401 Unauthorized, tự động gọi refresh token qua HttpOnly Cookie
  if (
    res.status === 401 &&
    !url.includes('/refresh-token') &&
    !url.includes('/login')
  ) {
    try {
      const refreshRes = await fetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const refreshData = await parseJsonSafe<{
        success?: boolean;
        accessToken?: string;
      }>(refreshRes, 'Không thể làm mới phiên đăng nhập');
      if (refreshRes.ok && refreshData.success && refreshData.accessToken) {
        setTokens(refreshData.accessToken);
        headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
        res = await fetch(url, { ...fetchOptions, headers });
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    }
  }

  return res;
};

export const authApi = {
  // 1. Kiểm tra Email
  async checkEmail(email: string): Promise<CheckEmailResponse> {
    const res = await fetch(`${API_BASE}/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return parseJsonSafe<CheckEmailResponse>(res, 'Lỗi kiểm tra email');
  },

  // 2. Đăng nhập (nhận HttpOnly Cookie + accessToken)
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonSafe<AuthResponse>(res, 'Lỗi đăng nhập');
    if (data.success && (data.accessToken || data.token)) {
      setTokens(data.accessToken || data.token || '');
    }
    return data;
  },

  // 3. Đăng ký & Kích hoạt tài khoản bằng OTP
  async register(data: {
    email: string;
    fullName: string;
    password: string;
    otpCode?: string;
    otp?: string;
    phoneNumber?: string;
  }): Promise<AuthResponse> {
    const payload = {
      ...data,
      otpCode: data.otpCode || data.otp || '',
    };
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const result = await parseJsonSafe<AuthResponse>(
      res,
      'Lỗi đăng ký tài khoản',
    );
    if (result.success && (result.accessToken || result.token)) {
      setTokens(result.accessToken || result.token || '');
    }
    return result;
  },

  // 4. Gửi lại OTP khi đăng ký (giới hạn tối đa 3 lần)
  async resendRegisterOtp(
    email: string,
  ): Promise<{ success: boolean; message: string; remainingResends?: number }> {
    const res = await fetch(`${API_BASE}/resend-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return parseJsonSafe(res, 'Không thể gửi lại mã OTP');
  },

  // 4b. Xác thực OTP đăng ký trước khi tạo mật khẩu
  async verifyRegisterOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    return parseJsonSafe(res, 'Lỗi xác thực mã OTP');
  },

  // 5. Yêu cầu OTP Quên Mật Khẩu
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    return parseJsonSafe<ForgotPasswordResponse>(
      res,
      'Không thể gửi yêu cầu khôi phục mật khẩu',
    );
  },

  // 6. Xác thực OTP Quên Mật Khẩu
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });
    return parseJsonSafe(res, 'Lỗi xác thực mã OTP');
  },

  // 7. Đặt lại Mật Khẩu Mới
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp, newPassword }),
    });
    return parseJsonSafe<AuthResponse>(res, 'Không thể đặt lại mật khẩu');
  },

  // 8. Đặt Mật Khẩu cho Tài khoản Google
  async setGooglePassword(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const res = await authFetch(`${API_BASE}/set-google-password`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return parseJsonSafe<AuthResponse>(
      res,
      'Không thể thiết lập mật khẩu cho tài khoản Google',
    );
  },

  // 9. Lấy URL Đăng nhập Google
  async getGoogleAuthUrl(): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/google/url`, {
      credentials: 'include',
    });
    return parseJsonSafe(res, 'Không thể lấy liên kết đăng nhập Google');
  },

  // 10. Lấy thông tin tài khoản hiện tại (Me)
  async getMe(): Promise<AuthResponse> {
    const res = await authFetch(`${API_BASE}/me`);
    return parseJsonSafe<AuthResponse>(
      res,
      'Không thể tải thông tin tài khoản',
    );
  },

  // 11. Đăng xuất (xóa token cả client & server)
  async logout(): Promise<void> {
    try {
      const refreshToken = getRefreshToken();
      await authFetch(`${API_BASE}/logout`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      clearTokens();
    }
  },

  // 12. Upload Avatar lên Cloudinary
  async uploadAvatar(file: File): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await authFetch(`${API_BASE}/avatar`, {
      method: 'POST',
      body: formData,
    });
    return parseJsonSafe<AuthResponse>(res, 'Lỗi khi tải ảnh đại diện lên');
  },

  // 13. Cập nhật hồ sơ cá nhân
  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
    bio?: string;
    avatarUrl?: string;
  }): Promise<AuthResponse> {
    const res = await authFetch(`${API_BASE}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseJsonSafe<AuthResponse>(res, 'Lỗi khi cập nhật hồ sơ cá nhân');
  },
};
