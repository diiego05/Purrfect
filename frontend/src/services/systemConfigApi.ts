import { authFetch } from './authApi';
import type { SystemConfig, Banner } from '../types/systemConfig';

const BASE = '/api';

// ─── System Configs ───────────────────────────────────────────────

export const systemConfigApi = {
  /** Get all configs (admin) */
  getAll: async (): Promise<SystemConfig[]> => {
    const res = await authFetch(`${BASE}/system-configs`);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi lấy danh sách cấu hình.');
    }
    const data = (await res.json()) as { configs: SystemConfig[] };
    return data.configs;
  },

  /** Get public UI configs */
  getPublic: async (): Promise<Record<string, string>> => {
    const res = await fetch(`${BASE}/system-configs/public`);
    if (!res.ok) throw new Error('Lỗi khi lấy cấu hình công khai.');
    const data = (await res.json()) as { configs: Record<string, string> };
    return data.configs;
  },

  /** Batch update configs (admin) */
  update: async (updates: Array<{ keyName: string; valueText: string }>): Promise<void> => {
    const res = await authFetch(`${BASE}/system-configs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi lưu cấu hình.');
    }
  },

  /** Reset configs to defaults (admin) */
  resetToDefaults: async (): Promise<void> => {
    const res = await authFetch(`${BASE}/system-configs/reset`, {
      method: 'POST',
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi khôi phục cài đặt mặc định.');
    }
  },
};

// ─── Banners ──────────────────────────────────────────────────────

export const bannerApi = {
  /** Get all banners (admin) */
  getAll: async (): Promise<Banner[]> => {
    const res = await authFetch(`${BASE}/banners/all`);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi lấy danh sách banner.');
    }
    const data = (await res.json()) as { banners: Banner[] };
    return data.banners;
  },

  /** Get active banners (public) */
  getActive: async (): Promise<Banner[]> => {
    const res = await fetch(`${BASE}/banners`);
    if (!res.ok) throw new Error('Lỗi khi lấy danh sách banner.');
    const data = (await res.json()) as { banners: Banner[] };
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi tạo banner.');
    }
    const data = (await res.json()) as { banner: Banner };
    return data.banner;
  },

  /** Update banner (admin) */
  update: async (
    id: string,
    payload: Partial<{ imageUrl: string; title: string; linkUrl: string; orderIndex: number; isActive: boolean }>
  ): Promise<Banner> => {
    const res = await authFetch(`${BASE}/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi cập nhật banner.');
    }
    const data = (await res.json()) as { banner: Banner };
    return data.banner;
  },

  /** Delete banner (admin) */
  delete: async (id: string): Promise<void> => {
    const res = await authFetch(`${BASE}/banners/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi xóa banner.');
    }
  },

  /** Toggle banner active state (admin) */
  toggle: async (id: string): Promise<Banner> => {
    const res = await authFetch(`${BASE}/banners/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi thay đổi trạng thái banner.');
    }
    const data = (await res.json()) as { banner: Banner };
    return data.banner;
  },

  /** Reorder banners (admin) */
  reorder: async (orders: Array<{ id: string; orderIndex: number }>): Promise<void> => {
    const res = await authFetch(`${BASE}/banners/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      throw new Error(data.message || 'Lỗi khi sắp xếp banner.');
    }
  },
};

