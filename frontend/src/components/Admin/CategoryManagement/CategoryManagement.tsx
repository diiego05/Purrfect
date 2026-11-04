import React, { useState, useEffect, useMemo } from 'react';
import { categoryApi } from '../../../services/categoryApi';
import type {
  CategoryItem,
  CategoryTreeNode,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../../types/category';
import './CategoryManagement.css';

// Preset icon thường dùng cho các lĩnh vực giáo dục & e-learning
const ICON_PRESETS = [
  '💻', '🎨', '💼', '🤖', '🌐', '📈', '🧘', '📚', 
  '🚀', '🎯', '🔒', '📱', '⚡', '💡', '🏆', '🔬'
];

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

// Chuẩn hóa chuỗi loại bỏ dấu tiếng Việt để tìm kiếm không phân biệt có/không dấu
const removeAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

// Hàm kiểm tra danh mục có khớp từ khóa tìm kiếm hay không
const matchesCategory = (name: string, slug: string, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const qNorm = removeAccents(query);
  const nameNorm = removeAccents(name);
  const slugNorm = removeAccents(slug);
  return nameNorm.includes(qNorm) || slugNorm.includes(qNorm);
};

export const CategoryManagement: React.FC = () => {
  // Data states
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [treeCategories, setTreeCategories] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'root' | 'sub'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formIcon, setFormIcon] = useState<string>('💻');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Delete modal states
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Tự động tạo slug từ tiếng Việt
  const autoSlugify = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // Tải lại danh mục sau khi thêm/sửa/xóa hoặc bấm nút làm mới
  const reloadData = async () => {
    setLoading(true);
    try {
      const [flatRes, treeRes] = await Promise.all([
        categoryApi.getCategories(),
        categoryApi.getCategoryTree(),
      ]);

      if (flatRes.success && flatRes.data) {
        setCategories(flatRes.data);
      }
      if (treeRes.success && treeRes.data) {
        setTreeCategories(treeRes.data);
      }
    } catch (err) {
      addToast('error', 'Không thể kết nối đến máy chủ để tải danh mục');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchInitialData = async () => {
      try {
        const [flatRes, treeRes] = await Promise.all([
          categoryApi.getCategories(),
          categoryApi.getCategoryTree(),
        ]);

        if (!ignore) {
          if (flatRes.success && flatRes.data) {
            setCategories(flatRes.data);
          }
          if (treeRes.success && treeRes.data) {
            setTreeCategories(treeRes.data);
          }
        }
      } catch (err) {
        if (!ignore) {
          addToast('error', 'Không thể kết nối đến máy chủ để tải danh mục');
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = categories.length;
    const roots = categories.filter((c) => !c.parentId).length;
    const subs = total - roots;
    const totalCourses = categories.reduce((sum, c) => sum + (c.courseCount || 0), 0);
    return { total, roots, subs, totalCourses };
  }, [categories]);

  // Mở modal Thêm mới
  const handleOpenCreateModal = (presetParentId?: string) => {
    setModalMode('create');
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormParentId(presetParentId || '');
    setFormIcon('💻');
    setFormDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Mở modal Chỉnh sửa
  const handleOpenEditModal = (cat: CategoryItem) => {
    setModalMode('edit');
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormParentId(cat.parentId || '');
    setFormIcon(cat.icon || '💻');
    setFormDescription(cat.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Xử lý thay đổi tên -> gợi ý slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormName(val);
    if (modalMode === 'create') {
      setFormSlug(autoSlugify(val));
    }
  };

  // Submit form Thêm / Sửa
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên danh mục');
      return;
    }

    const cleanSlug = autoSlugify(formSlug || formName);
    if (!cleanSlug) {
      setFormError('Đường dẫn tĩnh (Slug) không hợp lệ');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === 'create') {
        const payload: CreateCategoryPayload = {
          name: formName.trim(),
          slug: cleanSlug,
          description: formDescription.trim(),
          parentId: formParentId || null,
          icon: formIcon,
        };

        const res = await categoryApi.createCategory(payload);
        if (res.success) {
          addToast('success', `Đã thêm thành công danh mục "${formName}"`);
          setIsModalOpen(false);
          await reloadData();
        } else {
          setFormError(res.message || 'Lỗi khi tạo danh mục mới');
        }
      } else if (editingCategory) {
        const payload: UpdateCategoryPayload = {
          name: formName.trim(),
          slug: cleanSlug,
          description: formDescription.trim(),
          parentId: formParentId || null,
          icon: formIcon,
        };

        const res = await categoryApi.updateCategory(editingCategory._id, payload);
        if (res.success) {
          addToast('success', `Đã cập nhật danh mục "${formName}"`);
          setIsModalOpen(false);
          await reloadData();
        } else {
          setFormError(res.message || 'Lỗi khi cập nhật danh mục');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối API';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Mở modal Xóa
  const handleOpenDeleteModal = (cat: CategoryItem) => {
    setDeleteTarget(cat);
    setDeleteErrorMessage(null);
  };

  // Xác nhận Xóa danh mục
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await categoryApi.deleteCategory(deleteTarget._id);
      if (res.success) {
        addToast('success', `Đã xóa danh mục "${deleteTarget.name}"`);
        setDeleteTarget(null);
        await reloadData();
      } else {
        // Hiển thị thông báo chặn xóa nếu danh mục có khóa học hoặc danh mục con
        setDeleteErrorMessage(res.message || 'Không thể xóa danh mục này.');
      }
    } catch (err: unknown) {
      setDeleteErrorMessage(
        err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu xóa đến máy chủ',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Lọc dữ liệu danh mục phẳng (Flat View)
  const filteredFlatCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSearch = matchesCategory(cat.name, cat.slug, searchQuery);
      const matchType =
        filterType === 'all' ||
        (filterType === 'root' && !cat.parentId) ||
        (filterType === 'sub' && !!cat.parentId);

      return matchSearch && matchType;
    });
  }, [categories, searchQuery, filterType]);

  // Lọc dữ liệu cây phân cấp (Tree View)
  const filteredTreeCategories = useMemo(() => {
    const q = searchQuery.trim();

    return treeCategories
      .map((rootNode) => {
        const rootMatchesSearch = matchesCategory(rootNode.name, rootNode.slug, q);

        const matchingChildren = (rootNode.children || []).filter((child) => {
          const childMatchesSearch = matchesCategory(child.name, child.slug, q);
          const childMatchesType = filterType === 'all' || filterType === 'sub';
          return childMatchesSearch && childMatchesType;
        });

        // 1. Nếu lọc chỉ danh mục con
        if (filterType === 'sub') {
          if (matchingChildren.length > 0) {
            return {
              ...rootNode,
              children: matchingChildren,
            };
          }
          return null;
        }

        // 2. Nếu lọc chỉ danh mục gốc
        if (filterType === 'root') {
          if (rootMatchesSearch) {
            return {
              ...rootNode,
              children: [],
            };
          }
          return null;
        }

        // 3. filterType === 'all'
        if (!q) {
          return rootNode;
        }

        // Có từ khóa tìm kiếm:
        if (rootMatchesSearch || matchingChildren.length > 0) {
          return {
            ...rootNode,
            children:
              rootMatchesSearch && matchingChildren.length === 0
                ? rootNode.children
                : matchingChildren,
          };
        }

        return null;
      })
      .filter((node): node is CategoryTreeNode => node !== null);
  }, [treeCategories, searchQuery, filterType]);

  // Tìm tên danh mục cha để hiển thị
  const getParentName = (parentId?: string | null): string => {
    if (!parentId) return 'Danh mục gốc';
    const parent = categories.find((c) => c._id === parentId);
    return parent ? parent.name : 'Không xác định';
  };

  return (
    <div className="cat-mgmt-container">
      {/* Toast Notification Container */}
      <div className="cat-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`cat-toast ${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Header & Main Actions */}
      <div className="cat-mgmt-header">
        <div className="cat-mgmt-title-group">
          <h1>Quản lý danh mục ngành học</h1>
          <p>
            Cấu hình phân cấp danh mục ngành học (Lập trình, Thiết kế, Kinh doanh...), đường dẫn tĩnh và biểu tượng hiển thị trên toàn nền tảng.
          </p>
        </div>

        <div className="cat-mgmt-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => reloadData()}
            title="Làm mới danh sách"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Tải lại</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => handleOpenCreateModal()}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Thêm danh mục mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="cat-stats-grid">
        <div className="cat-stat-card">
          <div className="cat-stat-icon-wrapper icon-blue">📁</div>
          <div className="cat-stat-content">
            <span className="cat-stat-label">Tổng số danh mục</span>
            <span className="cat-stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="cat-stat-card">
          <div className="cat-stat-icon-wrapper icon-emerald">🌳</div>
          <div className="cat-stat-content">
            <span className="cat-stat-label">Danh mục gốc (Root)</span>
            <span className="cat-stat-value">{stats.roots}</span>
          </div>
        </div>

        <div className="cat-stat-card">
          <div className="cat-stat-icon-wrapper icon-purple">🌿</div>
          <div className="cat-stat-content">
            <span className="cat-stat-label">Danh mục con (Sub)</span>
            <span className="cat-stat-value">{stats.subs}</span>
          </div>
        </div>

        <div className="cat-stat-card">
          <div className="cat-stat-icon-wrapper icon-amber">🎓</div>
          <div className="cat-stat-content">
            <span className="cat-stat-label">Khóa học liên kết</span>
            <span className="cat-stat-value">{stats.totalCourses}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="cat-filter-bar">
        <div className="cat-search-wrapper">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="cat-search-input"
            placeholder="Tìm kiếm danh mục theo tên hoặc slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cat-search-clear-btn"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0 0.35rem',
                fontSize: '0.9rem',
              }}
              title="Xóa từ khóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="cat-filter-controls">
          <select
            className="cat-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'root' | 'sub')}
          >
            <option value="all">Tất cả danh mục ({categories.length})</option>
            <option value="root">Chỉ danh mục gốc ({stats.roots})</option>
            <option value="sub">Chỉ danh mục con ({stats.subs})</option>
          </select>

          <div className="cat-view-toggles">
            <button
              type="button"
              className={`cat-view-toggle-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Dạng cây phân cấp"
            >
              <span>🌳 Cây phân cấp</span>
            </button>
            <button
              type="button"
              className={`cat-view-toggle-btn ${viewMode === 'flat' ? 'active' : ''}`}
              onClick={() => setViewMode('flat')}
              title="Dạng bảng phẳng"
            >
              <span>📋 Bảng phẳng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Table Card */}
      <div className="cat-table-card">
        {loading ? (
          <div className="cat-empty-state">
            <div className="cat-empty-icon">⏳</div>
            <p>Đang tải danh mục ngành học...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="cat-empty-state">
            <div className="cat-empty-icon">📂</div>
            <h3>Chưa có danh mục nào</h3>
            <p>Bắt đầu bằng việc nhấn nút "Thêm danh mục mới" ở trên.</p>
          </div>
        ) : (
          <table className="cat-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Danh mục ngành học</th>
                <th style={{ width: '22%' }}>Đường dẫn tĩnh (Slug)</th>
                <th style={{ width: '18%' }}>Cấp bậc / Danh mục cha</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Khóa học</th>
                <th style={{ width: '13%', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {viewMode === 'tree' ? (
                // Dạng Cây phân cấp
                filteredTreeCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        padding: '3.5rem 1rem',
                        color: '#94a3b8',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>🔍</div>
                      <div style={{ fontSize: '1rem', color: '#f1f5f9', fontWeight: 600 }}>
                        Không tìm thấy danh mục phù hợp
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                        Không có kết quả nào khớp với bộ lọc hoặc từ khóa "{searchQuery}"
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTreeCategories.map((rootNode) => (
                    <React.Fragment key={rootNode._id}>
                    {/* Hàng Danh mục Gốc */}
                    <tr>
                      <td>
                        <div className="cat-name-cell">
                          <span className="cat-icon-badge">{rootNode.icon || '📁'}</span>
                          <div>
                            <div className="cat-title-text">{rootNode.name}</div>
                            {rootNode.description && (
                              <div className="cat-desc-preview">{rootNode.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cat-slug-pill">/{rootNode.slug}</span>
                      </td>
                      <td>
                        <span className="cat-badge-root">Danh mục gốc</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`cat-course-count-pill ${
                            rootNode.courseCount > 0 ? 'count-has-courses' : 'count-zero'
                          }`}
                        >
                          {rootNode.courseCount} khóa
                        </span>
                      </td>
                      <td>
                        <div className="cat-table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-icon-action edit"
                            title="Thêm danh mục con cho danh mục này"
                            onClick={() => handleOpenCreateModal(rootNode._id)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action edit"
                            title="Chỉnh sửa danh mục"
                            onClick={() => handleOpenEditModal(rootNode)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="btn-icon-action delete"
                            title="Xóa danh mục"
                            onClick={() => handleOpenDeleteModal(rootNode)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Hàng Danh mục Con trực thuộc */}
                    {rootNode.children &&
                      rootNode.children.map((subNode) => (
                        <tr key={subNode._id} style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
                          <td>
                            <div className="cat-name-cell" style={{ paddingLeft: '2rem' }}>
                              <span className="tree-indent-guide" />
                              <span className="cat-icon-badge" style={{ width: '28px', height: '28px', fontSize: '0.95rem' }}>
                                {subNode.icon || '🌿'}
                              </span>
                              <div>
                                <div className="cat-title-text" style={{ fontSize: '0.86rem' }}>
                                  {subNode.name}
                                </div>
                                {subNode.description && (
                                  <div className="cat-desc-preview">{subNode.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="cat-slug-pill">/{subNode.slug}</span>
                          </td>
                          <td>
                            <span className="cat-badge-sub">↳ {rootNode.name}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`cat-course-count-pill ${
                                subNode.courseCount > 0 ? 'count-has-courses' : 'count-zero'
                              }`}
                            >
                              {subNode.courseCount} khóa
                            </span>
                          </td>
                          <td>
                            <div className="cat-table-actions" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn-icon-action edit"
                                title="Chỉnh sửa danh mục con"
                                onClick={() => handleOpenEditModal(subNode)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="btn-icon-action delete"
                                title="Xóa danh mục con"
                                onClick={() => handleOpenDeleteModal(subNode)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              )
            ) : (
              filteredFlatCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: 'center',
                        padding: '3.5rem 1rem',
                        color: '#94a3b8',
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>🔍</div>
                      <div style={{ fontSize: '1rem', color: '#f1f5f9', fontWeight: 600 }}>
                        Không tìm thấy danh mục phù hợp
                      </div>
                      <div style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                        Không có kết quả nào khớp với bộ lọc hoặc từ khóa "{searchQuery}"
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFlatCategories.map((cat) => (
                  <tr key={cat._id}>
                    <td>
                      <div className="cat-name-cell">
                        <span className="cat-icon-badge">{cat.icon || '📁'}</span>
                        <div>
                          <div className="cat-title-text">{cat.name}</div>
                          {cat.description && (
                            <div className="cat-desc-preview">{cat.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-slug-pill">/{cat.slug}</span>
                    </td>
                    <td>
                      {!cat.parentId ? (
                        <span className="cat-badge-root">Danh mục gốc</span>
                      ) : (
                        <span className="cat-badge-sub">↳ {getParentName(cat.parentId)}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`cat-course-count-pill ${
                          cat.courseCount > 0 ? 'count-has-courses' : 'count-zero'
                        }`}
                      >
                        {cat.courseCount} khóa
                      </span>
                    </td>
                    <td>
                      <div className="cat-table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-icon-action edit"
                          title="Chỉnh sửa danh mục"
                          onClick={() => handleOpenEditModal(cat)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          title="Xóa danh mục"
                          onClick={() => handleOpenDeleteModal(cat)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm mới / Chỉnh sửa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'create'
                  ? 'Thêm danh mục ngành học mới'
                  : `Chỉnh sửa danh mục: ${editingCategory?.name}`}
              </h3>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div className="delete-blocked-banner" style={{ margin: 0 }}>
                    ⚠️ {formError}
                  </div>
                )}

                {/* Tên danh mục */}
                <div className="form-group">
                  <label className="form-label">
                    Tên danh mục <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Lập trình & Phát triển, Trí tuệ nhân tạo..."
                    value={formName}
                    onChange={handleNameChange}
                    autoFocus
                    required
                  />
                </div>

                {/* Đường dẫn tĩnh (Slug) */}
                <div className="form-group">
                  <label className="form-label">
                    Đường dẫn tĩnh (Slug) <span className="required">*</span>
                  </label>
                  <div className="slug-input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="lap-trinh-phat-trien"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-auto-slug"
                      onClick={() => setFormSlug(autoSlugify(formName))}
                      title="Tự động sinh slug từ tên tiếng Việt"
                    >
                      Tự tạo slug
                    </button>
                  </div>
                  <span className="form-hint">
                    Slug là duy nhất toàn hệ thống, hiển thị trên thanh URL: /categories/{formSlug || 'slug-danh-muc'}
                  </span>
                </div>

                {/* Danh mục cha */}
                <div className="form-group">
                  <label className="form-label">Danh mục cha (Cấp bậc)</label>
                  <select
                    className="form-select"
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                  >
                    <option value="">-- Danh mục gốc (Không có cha) --</option>
                    {categories
                      // Không cho phép chọn chính mình làm cha
                      .filter((c) => !editingCategory || c._id !== editingCategory._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.slug})
                        </option>
                      ))}
                  </select>
                  <span className="form-hint">
                    Chọn danh mục cha để nhóm danh mục này thành phân ngành con lồng nhau.
                  </span>
                </div>

                {/* Biểu tượng (Icon) */}
                <div className="form-group">
                  <label className="form-label">Biểu tượng (Icon)</label>
                  <div className="slug-input-wrapper">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Emoji hoặc tên icon..."
                      value={formIcon}
                      onChange={(e) => setFormIcon(e.target.value)}
                      style={{ maxWidth: '100px', textAlign: 'center', fontSize: '1.25rem' }}
                    />
                    <div className="icon-preset-selector">
                      {ICON_PRESETS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`icon-preset-btn ${formIcon === icon ? 'selected' : ''}`}
                          onClick={() => setFormIcon(icon)}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mô tả */}
                <div className="form-group">
                  <label className="form-label">Mô tả tóm tắt</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Mô tả phạm vi kiến thức và kỹ năng của ngành học này..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Đang lưu...'
                    : modalMode === 'create'
                    ? 'Lưu danh mục'
                    : 'Cập nhật thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa & Kiểm tra ràng buộc */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-delete-body">
              <div className="delete-warning-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h4>Xác nhận xóa danh mục?</h4>
              <p>
                Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteTarget.name}"</strong>?
                Hành động này sẽ loại bỏ danh mục vĩnh viễn khỏi cơ sở dữ liệu.
              </p>

              {deleteErrorMessage && (
                <div className="delete-blocked-banner">
                  <strong>⚠️ Không thể xóa:</strong>
                  <div>{deleteErrorMessage}</div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang kiểm tra & xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

