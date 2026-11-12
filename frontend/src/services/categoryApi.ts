import { authFetch } from './authApi';
import type {
  CategoryItem,
  CategoryTreeNode,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryApiResponse,
} from '../types/category';
import { parseJsonSafe } from '../utils/api';

const API_BASE = '/api/categories';

export const categoryApi = {
  /**
   * Lấy danh sách tất cả danh mục (Dạng phẳng)
   */
  async getCategories(): Promise<CategoryApiResponse<CategoryItem[]>> {
    const res = await fetch(`${API_BASE}`);
    return parseJsonSafe<CategoryApiResponse<CategoryItem[]>>(
      res,
      'Không thể tải danh sách danh mục',
    );
  },

  /**
   * Lấy cấu trúc cây danh mục đa cấp (Tree Hierarchy)
   */
  async getCategoryTree(): Promise<CategoryApiResponse<CategoryTreeNode[]>> {
    const res = await fetch(`${API_BASE}?tree=true`);
    return parseJsonSafe<CategoryApiResponse<CategoryTreeNode[]>>(
      res,
      'Không thể tải cấu trúc danh mục',
    );
  },

  /**
   * Lấy thông tin chi tiết danh mục theo ID hoặc Slug
   */
  async getCategoryById(
    identifier: string,
  ): Promise<CategoryApiResponse<CategoryItem>> {
    const res = await fetch(`${API_BASE}/${identifier}`);
    return parseJsonSafe<CategoryApiResponse<CategoryItem>>(
      res,
      'Không thể tải chi tiết danh mục',
    );
  },

  /**
   * [Admin] Tạo mới danh mục
   */
  async createCategory(
    payload: CreateCategoryPayload,
  ): Promise<CategoryApiResponse<CategoryItem>> {
    const res = await authFetch(`${API_BASE}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<CategoryApiResponse<CategoryItem>>(
      res,
      'Lỗi khi tạo danh mục mới',
    );
  },

  /**
   * [Admin] Cập nhật danh mục
   */
  async updateCategory(
    id: string,
    payload: UpdateCategoryPayload,
  ): Promise<CategoryApiResponse<CategoryItem>> {
    const res = await authFetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return parseJsonSafe<CategoryApiResponse<CategoryItem>>(
      res,
      'Lỗi khi cập nhật danh mục',
    );
  },

  /**
   * [Admin] Xóa danh mục (hệ thống sẽ chặn nếu có khóa học hoạt động)
   */
  async deleteCategory(id: string): Promise<
    CategoryApiResponse<{
      activeCourseCount?: number;
      subCategoryCount?: number;
    }>
  > {
    const res = await authFetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    return parseJsonSafe(res, 'Lỗi khi xóa danh mục');
  },
};
