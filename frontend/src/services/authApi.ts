import type {
  AuthResponse,
  CheckEmailResponse,
  ForgotPasswordResponse,
} from '../types/auth';

const API_BASE = '/api/auth';

export const getAccessToken = () =>
  localStorage.getItem('purr_access_token') ||
  localStorage.getItem('purr_token');
export const getRefreshToken = () => localStorage.getItem('purr_refresh_token');

export const setTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem('purr_access_token', accessToken);
  localStorage.setItem('purr_token', accessToken); // backward compatibility
  if (refreshToken) {
    localStorage.setItem('purr_refresh_token', refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('purr_access_token');
  localStorage.removeItem('purr_token');
  localStorage.removeItem('purr_refresh_token');
};

export const authFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res = await fetch(url, { ...options, headers });

  // If 401 Unauthorized, try refreshing token using refreshToken
  if (res.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.success && refreshData.accessToken) {
          setTokens(refreshData.accessToken);
          // Retry original request with new token
          headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
          res = await fetch(url, { ...options, headers });
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      }
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
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // 2. Đăng nhập (nhận accessToken 7 ngày và refreshToken 30 ngày)
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
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
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // 4. Gửi lại OTP khi đăng ký (giới hạn tối đa 3 lần)
  async resendRegisterOtp(
    email: string,
  ): Promise<{ success: boolean; message: string; remainingResends?: number }> {
    const res = await fetch(`${API_BASE}/resend-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // 4b. Xác thực OTP đăng ký trước khi tạo mật khẩu
  async verifyRegisterOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  // 5. Yêu cầu OTP Quên Mật Khẩu
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // 6. Xác thực OTP Quên Mật Khẩu
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
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
      body: JSON.stringify({ email, otp, newPassword }),
    });
    return res.json();
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
    return res.json();
  },

  // 9. Lấy URL Đăng nhập Google
  async getGoogleAuthUrl(): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/google/url`);
    return res.json();
  },

  // 10. Lấy thông tin tài khoản hiện tại (Me)
  async getMe(): Promise<AuthResponse> {
    const res = await authFetch(`${API_BASE}/me`);
    return res.json();
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
    const token = getAccessToken();
    const formData = new FormData();
    formData.append('avatar', file);

    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${API_BASE}/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },
};
