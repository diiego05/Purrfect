import { authFetch } from './authApi';
import type { SystemConfig, Banner } from '../types/systemConfig';
import { parseApiJson } from '../utils/api';

const BASE = '/api';

// ─── System Configs ───────────────────────────────────────────────

export const systemConfigApi = {
  /** Get all configs (admin) */
  getAll: async (): Promise<SystemConfig[]> => {
    const res = await authFetch(`${BASE}/system-configs`);
    const data = await parseApiJson<{
      configs: SystemConfig[];
      message?: string;
    }>(res, 'Lỗi khi lấy danh sách cấu hình.');
    return data.configs;
  },

  /** Get public UI configs */
  getPublic: async (): Promise<Record<string, string>> => {
    const res = await fetch(`${BASE}/system-configs/public`);
    const data = await parseApiJson<{
      configs: Record<string, string>;
      message?: string;
    }>(res, 'Lỗi khi lấy cấu hình công khai.');
    return data.configs;
  },

  /** Batch update configs (admin) */
  update: async (
    updates: Array<{ keyName: string; valueText: string }>,
  ): Promise<void> => {
    const res = await authFetch(`${BASE}/system-configs`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
    await parseApiJson<{ message?: string }>(res, 'Lỗi khi lưu cấu hình.');
  },

  /** Reset configs to defaults (admin) */
  resetToDefaults: async (): Promise<void> => {
    const res = await authFetch(`${BASE}/system-configs/reset`, {
      method: 'POST',
    });
    await parseApiJson<{ message?: string }>(
      res,
      'Lỗi khi khôi phục cài đặt mặc định.',
    );
  },
};

// ─── Banners ──────────────────────────────────────────────────────

export const bannerApi = {
  /** Get all banners (admin) */
  getAll: async (): Promise<Banner[]> => {
    const res = await authFetch(`${BASE}/banners/all`);
    const data = await parseApiJson<{ banners: Banner[]; message?: string }>(
      res,
      'Lỗi khi lấy danh sách banner.',
    );
    return data.banners;
  },

  /** Get active banners (public) */
  getActive: async (): Promise<Banner[]> => {
    const res = await fetch(`${BASE}/banners`);
    const data = await parseApiJson<{ banners: Banner[]; message?: string }>(
      res,
      'Lỗi khi lấy danh sách banner.',
    );
    return data.banners;
  },

  /** Create banner (admin) */
  create: async (payload: {
    imageUrl: string;
    title?: string;
    linkUrl?: string;
    orderIndex?: number;
    isActive?: boolean;
  }): Promise<Banner> => {
    const res = await authFetch(`${BASE}/banners`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await parseApiJson<{ banner: Banner; message?: string }>(
      res,
      'Lỗi khi tạo banner.',
    );
    return data.banner;
  },

  /** Update banner (admin) */
  update: async (
    id: string,
    payload: Partial<{
      imageUrl: string;
      title: string;
      linkUrl: string;
      orderIndex: number;
      isActive: boolean;
    }>,
  ): Promise<Banner> => {
    const res = await authFetch(`${BASE}/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await parseApiJson<{ banner: Banner; message?: string }>(
      res,
      'Lỗi khi cập nhật banner.',
    );
    return data.banner;
  },

  /** Delete banner (admin) */
  delete: async (id: string): Promise<void> => {
    const res = await authFetch(`${BASE}/banners/${id}`, { method: 'DELETE' });
    await parseApiJson<{ message?: string }>(res, 'Lỗi khi xóa banner.');
  },

  /** Toggle banner active state (admin) */
  toggle: async (id: string): Promise<Banner> => {
    const res = await authFetch(`${BASE}/banners/${id}/toggle`, {
      method: 'PATCH',
    });
    const data = await parseApiJson<{ banner: Banner; message?: string }>(
      res,
      'Lỗi khi thay đổi trạng thái banner.',
    );
    return data.banner;
  },

  /** Reorder banners (admin) */
  reorder: async (
    orders: Array<{ id: string; orderIndex: number }>,
  ): Promise<void> => {
    const res = await authFetch(`${BASE}/banners/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ orders }),
    });
    await parseApiJson<{ message?: string }>(res, 'Lỗi khi sắp xếp banner.');
  },
};
