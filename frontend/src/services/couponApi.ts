import { authFetch } from './authApi';
import type {
  Coupon,
  CouponFormData,
  CouponValidateResult,
} from '../types/coupon';
import { parseApiJson, parseJsonSafe } from '../utils/api';

const BASE = '/api/coupons';

export const couponApi = {
  /** Get all coupons (admin) with search & filter */
  getAll: async (params?: {
    search?: string;
    discountType?: string;
    status?: string;
  }): Promise<Coupon[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.discountType && params.discountType !== 'ALL')
      query.append('discountType', params.discountType);
    if (params?.status && params.status !== 'ALL')
      query.append('status', params.status);

    const url = `${BASE}${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await authFetch(url);
    const data = await parseApiJson<{ coupons: Coupon[]; message?: string }>(
      res,
      'Lỗi khi lấy danh sách mã giảm giá.',
    );
    return data.coupons;
  },

  /** Get coupon by ID */
  getById: async (id: string): Promise<Coupon> => {
    const res = await authFetch(`${BASE}/${id}`);
    const data = await parseApiJson<{ coupon: Coupon; message?: string }>(
      res,
      'Lỗi khi lấy thông tin mã giảm giá.',
    );
    return data.coupon;
  },

  /** Create coupon */
  create: async (payload: CouponFormData): Promise<Coupon> => {
    const res = await authFetch(BASE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await parseApiJson<{ coupon: Coupon; message?: string }>(
      res,
      'Lỗi khi tạo mã giảm giá.',
    );
    return data.coupon;
  },

  /** Update coupon */
  update: async (
    id: string,
    payload: Partial<CouponFormData>,
  ): Promise<Coupon> => {
    const res = await authFetch(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const data = await parseApiJson<{ coupon: Coupon; message?: string }>(
      res,
      'Lỗi khi cập nhật mã giảm giá.',
    );
    return data.coupon;
  },

  /** Delete coupon */
  delete: async (id: string): Promise<void> => {
    const res = await authFetch(`${BASE}/${id}`, { method: 'DELETE' });
    await parseApiJson<{ message?: string }>(res, 'Lỗi khi xóa mã giảm giá.');
  },

  /** Toggle active / inactive status */
  toggle: async (id: string): Promise<Coupon> => {
    const res = await authFetch(`${BASE}/${id}/toggle`, { method: 'PATCH' });
    const data = await parseApiJson<{ coupon: Coupon; message?: string }>(
      res,
      'Lỗi khi thay đổi trạng thái mã giảm giá.',
    );
    return data.coupon;
  },

  /** Validate coupon against an order amount */
  validate: async (
    code: string,
    orderAmount: number,
  ): Promise<CouponValidateResult> => {
    const res = await fetch(`${BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderAmount }),
    });
    const data = await parseJsonSafe<CouponValidateResult>(
      res,
      'Mã giảm giá không hợp lệ.',
    );
    if (!res.ok) {
      throw new Error(data.message || 'Mã giảm giá không hợp lệ.');
    }
    return data;
  },
};
