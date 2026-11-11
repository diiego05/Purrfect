import { authFetch } from './authApi';
import type { Course } from '../types/course';
import { parseJsonSafe } from '../utils/api';

export interface CartItemResponse {
  _id: string;
  userId: string;
  courseId: Course;
  createdAt: string;
}

export interface CartDataResponse {
  items: CartItemResponse[];
  totalCount: number;
  totalAmount: number;
}

export interface WishlistItemResponse {
  _id: string;
  userId: string;
  courseId: Course;
  createdAt: string;
}

export interface WishlistDataResponse {
  items: WishlistItemResponse[];
  totalCount: number;
}

export const cartWishlistApi = {
  // --- Cart APIs ---
  async getCart(): Promise<CartDataResponse> {
    const res = await authFetch('/api/cart');
    if (!res.ok) return { items: [], totalCount: 0, totalAmount: 0 };
    return parseJsonSafe<CartDataResponse>(
      res,
      'Không thể tải dữ liệu giỏ hàng',
    );
  },

  async addToCart(
    courseId: string,
  ): Promise<{ success: boolean; message: string; totalCount?: number }> {
    const res = await authFetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
    return parseJsonSafe(res, 'Không thể thêm vào giỏ hàng');
  },

  async removeFromCart(
    courseId: string,
  ): Promise<{ success: boolean; message: string; totalCount?: number }> {
    const res = await authFetch(`/api/cart/remove/${courseId}`, {
      method: 'DELETE',
    });
    return parseJsonSafe(res, 'Không thể xóa khỏi giỏ hàng');
  },

  async clearCart(): Promise<{ success: boolean; message: string }> {
    const res = await authFetch('/api/cart/clear', {
      method: 'DELETE',
    });
    return parseJsonSafe(res, 'Không thể làm trống giỏ hàng');
  },

  // --- Wishlist APIs ---
  async getWishlist(): Promise<WishlistDataResponse> {
    const res = await authFetch('/api/wishlist');
    if (!res.ok) return { items: [], totalCount: 0 };
    return parseJsonSafe<WishlistDataResponse>(
      res,
      'Không thể tải danh sách yêu thích',
    );
  },

  async toggleWishlist(courseId: string): Promise<{
    success: boolean;
    isWishlisted: boolean;
    message: string;
    totalCount?: number;
  }> {
    const res = await authFetch('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
    return parseJsonSafe(res, 'Không thể cập nhật danh sách yêu thích');
  },

  async checkWishlistStatus(
    courseId: string,
  ): Promise<{ isWishlisted: boolean }> {
    try {
      const res = await authFetch(`/api/wishlist/check/${courseId}`);
      if (!res.ok) return { isWishlisted: false };
      return await parseJsonSafe<{ isWishlisted: boolean }>(
        res,
        'Không thể kiểm tra trạng thái yêu thích',
      );
    } catch {
      return { isWishlisted: false };
    }
  },
};
