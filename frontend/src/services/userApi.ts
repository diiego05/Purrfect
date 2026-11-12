import { authFetch } from './authApi';
import type {
  ManagedUser,
  GetUsersResponse,
  CreateUserData,
  UserRole,
  UserStatus,
} from '../types/user';
import { parseApiJson } from '../utils/api';

const BASE = '/api/users';

export const userApi = {
  /** Lấy danh sách người dùng kèm bộ lọc */
  getUsers: async (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<GetUsersResponse['data']> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role && params.role !== 'ALL')
      query.append('role', params.role);
    if (params?.status && params.status !== 'ALL')
      query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const url = `${BASE}${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await authFetch(url);
    const data = await parseApiJson<GetUsersResponse & { message?: string }>(
      res,
      'Lỗi khi lấy danh sách người dùng.',
    );
    return data.data;
  },

  /** Cập nhật trạng thái người dùng (ACTIVE / BLOCKED) */
  updateStatus: async (
    id: string,
    status: UserStatus,
  ): Promise<ManagedUser> => {
    const res = await authFetch(`${BASE}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const data = await parseApiJson<{ data: ManagedUser; message?: string }>(
      res,
      'Lỗi khi cập nhật trạng thái người dùng.',
    );
    return data.data;
  },

  /** Cập nhật vai trò người dùng (STUDENT, INSTRUCTOR, ADMIN) */
  updateRole: async (id: string, role: UserRole): Promise<ManagedUser> => {
    const res = await authFetch(`${BASE}/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    const data = await parseApiJson<{ data: ManagedUser; message?: string }>(
      res,
      'Lỗi khi cập nhật vai trò người dùng.',
    );
    return data.data;
  },

  /** Tạo người dùng mới */
  create: async (payload: CreateUserData): Promise<ManagedUser> => {
    const res = await authFetch(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await parseApiJson<{ data: ManagedUser; message?: string }>(
      res,
      'Lỗi khi tạo tài khoản người dùng.',
    );
    return data.data;
  },

  /** Xóa người dùng */
  delete: async (id: string): Promise<void> => {
    const res = await authFetch(`${BASE}/${id}`, {
      method: 'DELETE',
    });
    await parseApiJson<{ message?: string }>(res, 'Lỗi khi xóa người dùng.');
  },
};
