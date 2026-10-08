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

const authFetch = async (
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

  // 3. Đăng ký tài khoản (Bắt buộc mã OTP, mặc định STUDENT)
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    otpCode: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 4. Gửi lại mã OTP đăng ký
  async resendRegisterOtp(email: string): Promise<ForgotPasswordResponse> {
    const res = await fetch(`${API_BASE}/resend-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // 4.1 Xác thực OTP đăng ký trước khi nhập thông tin & mật khẩu
  async verifyRegisterOtp(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/verify-register-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return res.json();
  },

  // 5. Tải ảnh đại diện lên Cloudinary

  async uploadAvatar(
    file: File,
  ): Promise<{ success: boolean; avatarUrl?: string; message?: string }> {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${API_BASE}/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return res.json();
  },

  // 6. Quên mật khẩu - gửi OTP
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // 5. Xác thực OTP
  async verifyOtp(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    return res.json();
  },

  // 6. Đặt lại mật khẩu
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    return res.json();
  },

  // 6.1 Đặt mật khẩu mới cho tài khoản Google (không cần OTP)
  async setGooglePassword(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/set-google-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  // 7. Lấy URL Google OAuth
  async getGoogleAuthUrl(): Promise<{
    success: boolean;
    configured: boolean;
    url: string | null;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE}/google/url`);
    return res.json();
  },

  // 8. Lấy thông tin user hiện tại (tự động refresh token nếu cần)
  async getMe(): Promise<AuthResponse> {
    const res = await authFetch(`${API_BASE}/me`);
    return res.json();
  },

  // 9. Đăng xuất
  async logout(): Promise<{ success: boolean; message: string }> {
    const refreshToken = getRefreshToken();
    const res = await authFetch(`${API_BASE}/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    clearTokens();
    return res.json();
  },
};
