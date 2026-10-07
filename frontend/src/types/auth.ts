export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  bio?: string;
}

export interface CheckEmailResponse {
  success: boolean;
  exists: boolean;
  email: string;
  message?: string;
  otpDevCode?: string;
  user?: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    hasPassword: boolean;
    isBlocked?: boolean;
  };
}


export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}


export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  otpDevCode?: string;
}
