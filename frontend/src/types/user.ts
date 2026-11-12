export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface ManagedUser {
  _id: string;
  id?: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  totalBlocked: number;
}

export interface GetUsersResponse {
  success: boolean;
  data: {
    users: ManagedUser[];
    total: number;
    page: number;
    totalPages: number;
    stats: UserStats;
  };
  message?: string;
}

export interface CreateUserData {
  email: string;
  fullName: string;
  password?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
}
