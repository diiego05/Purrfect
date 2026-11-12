import React, { useState, useEffect } from 'react';
import { userApi } from '../../../services/userApi';
import type {
  ManagedUser,
  UserStats,
  UserRole,
  UserStatus,
  CreateUserData,
} from '../../../types/user';
import {
  IconlyUserGroup,
  IconlySearch,
  IconlyPlus,
  IconlyDelete,
  IconlyShield,
  IconlyAward,
  IconlyTick,
  IconlyClose,
  IconlyTimeCircle,
} from '../../Onboarding/IconlyIcons';
import './UserManagement.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const DEFAULT_NEW_USER: CreateUserData = {
  email: '',
  fullName: '',
  phoneNumber: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalInstructors: 0,
    totalAdmins: 0,
    totalBlocked: 0,
  });
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] =
    useState<CreateUserData>(DEFAULT_NEW_USER);
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users
  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await userApi.getUsers({
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
          limit: 100,
        });
        if (isMounted) {
          setUsers(data.users);
          setStats(data.stats);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error(err);
          addToast(
            err instanceof Error
              ? err.message
              : 'Lỗi khi tải danh sách người dùng.',
            'error',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, roleFilter, statusFilter, refreshKey]);

  // Handle Toggle Status (Active / Blocked)
  const handleToggleStatus = async (user: ManagedUser) => {
    const newStatus: UserStatus =
      user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const updated = await userApi.updateStatus(user._id, newStatus);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? updated : u)));
      addToast(
        newStatus === 'BLOCKED'
          ? `Đã khóa tài khoản "${user.fullName || user.email}"`
          : `Đã mở khóa tài khoản "${user.fullName || user.email}"`,
        'success',
      );
      // Refresh stats
      userApi
        .getUsers({
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
        })
        .then((d) => setStats(d.stats))
        .catch(() => {});
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.',
        'error',
      );
    }
  };

  // Handle Change Role
  const handleChangeRole = async (user: ManagedUser, newRole: UserRole) => {
    if (user.role === newRole) return;
    try {
      const updated = await userApi.updateRole(user._id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? updated : u)));
      addToast(
        `Đã phân quyền "${user.fullName || user.email}" thành ${newRole}`,
        'success',
      );
      // Refresh stats
      userApi
        .getUsers({
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
        })
        .then((d) => setStats(d.stats))
        .catch(() => {});
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : 'Không thể cập nhật vai trò.',
        'error',
      );
    }
  };

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim()) {
      setCreateError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setCreateSubmitting(true);
    setCreateError('');
    try {
      await userApi.create(createForm);
      addToast(
        `Đã tạo tài khoản cho ${createForm.email} thành công!`,
        'success',
      );
      setShowCreateModal(false);
      setCreateForm(DEFAULT_NEW_USER);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setCreateError(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tạo tài khoản người dùng.',
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteSubmitting(true);
    try {
      await userApi.delete(deletingUser._id);
      addToast(
        `Đã xóa tài khoản "${deletingUser.fullName || deletingUser.email}"`,
        'success',
      );
      setDeletingUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : 'Không thể xóa người dùng.',
        'error',
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="user-mgmt-root">
      {/* Toast Notifications */}
      <div className="user-mgmt-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`user-toast user-toast--${t.type}`}>
            <span>
              {t.type === 'success' ? (
                <IconlyTick size={16} color="#10b981" />
              ) : (
                <IconlyClose size={16} color="#ef4444" />
              )}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="user-mgmt-header">
        <div>
          <h1 className="user-mgmt-title">
            <IconlyUserGroup size={28} color="#3b82f6" />
            <span>Quản lý người dùng & Tài khoản</span>
          </h1>
          <p className="user-mgmt-subtitle">
            Theo dõi tất cả tài khoản trong hệ thống, quản lý phân quyền và kiểm
            soát bảo mật người dùng.
          </p>
        </div>
        <div className="user-mgmt-header-actions">
          <button
            type="button"
            className="user-btn user-btn--primary"
            onClick={() => {
              setCreateForm(DEFAULT_NEW_USER);
              setCreateError('');
              setShowCreateModal(true);
            }}
          >
            <IconlyPlus size={16} color="#ffffff" />
            <span>Thêm tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="stat-card-icon icon-blue">
            <IconlyUserGroup size={24} color="#3b82f6" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Tổng người dùng</span>
            <span className="stat-card-val">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-card-icon icon-green">
            <IconlyAward size={24} color="#10b981" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Học viên (Student)</span>
            <span className="stat-card-val">{stats.totalStudents}</span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-card-icon icon-purple">
            <IconlyAward size={24} color="#8b5cf6" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Giảng viên (Instructor)</span>
            <span className="stat-card-val">{stats.totalInstructors}</span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-card-icon icon-amber">
            <IconlyShield size={24} color="#f59e0b" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Quản trị viên (Admin)</span>
            <span className="stat-card-val">{stats.totalAdmins}</span>
          </div>
        </div>

        <div className="user-stat-card">
          <div className="stat-card-icon icon-red">
            <IconlyClose size={24} color="#ef4444" />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Bị tạm khóa (Blocked)</span>
            <span className="stat-card-val text-red">{stats.totalBlocked}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="user-filter-toolbar">
        <div className="user-search-wrapper">
          <span className="user-search-icon">
            <IconlySearch size={16} color="#64748b" />
          </span>
          <input
            type="text"
            className="user-search-input"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="user-search-clear"
              onClick={() => setSearch('')}
              title="Xóa tìm kiếm"
            >
              <IconlyClose size={14} color="#94a3b8" />
            </button>
          )}
        </div>

        <div className="user-filter-selects">
          <div className="filter-select-box">
            <label>Vai trò:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="user-select"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Học viên (Student)</option>
              <option value="INSTRUCTOR">Giảng viên (Instructor)</option>
              <option value="ADMIN">Quản trị viên (Admin)</option>
            </select>
          </div>

          <div className="filter-select-box">
            <label>Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="user-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (Active)</option>
              <option value="BLOCKED">Bị tạm khóa (Blocked)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="user-table-card">
        {loading ? (
          <div className="user-table-loading">
            <div className="user-spinner" />
            <span>Đang tải danh sách người dùng...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="user-table-empty">
            <div className="user-empty-icon-wrap">
              <IconlySearch size={36} color="#94a3b8" />
            </div>
            <h3>Không tìm thấy người dùng phù hợp</h3>
            <p>
              {search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Không có tài khoản nào khớp với bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Hệ thống chưa có tài khoản nào.'}
            </p>
          </div>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Người dùng</th>
                  <th style={{ width: '18%' }}>Số điện thoại</th>
                  <th style={{ width: '16%' }}>Vai trò phân quyền</th>
                  <th style={{ width: '14%' }}>Trạng thái</th>
                  <th style={{ width: '12%' }}>Ngày tham gia</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isBlocked = u.status === 'BLOCKED';
                  const formattedDate = new Date(
                    u.createdAt,
                  ).toLocaleDateString('vi-VN');

                  return (
                    <tr key={u._id} className={isBlocked ? 'row-blocked' : ''}>
                      {/* Avatar & Name & Email */}
                      <td>
                        <div className="user-cell-profile">
                          <img
                            src={
                              u.avatarUrl ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(u.email)}`
                            }
                            alt={u.fullName || u.email}
                            className="user-avatar-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                            }}
                          />
                          <div className="user-info-text">
                            <span className="user-name-title">
                              {u.fullName || 'Chưa cập nhật tên'}
                            </span>
                            <span className="user-email-text">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td>
                        <span className="user-phone-cell">
                          {u.phoneNumber || (
                            <span className="text-muted">—</span>
                          )}
                        </span>
                      </td>

                      {/* Role selection dropdown */}
                      <td>
                        <select
                          className={`user-role-select role-${u.role.toLowerCase()}`}
                          value={u.role}
                          onChange={(e) =>
                            handleChangeRole(u, e.target.value as UserRole)
                          }
                          title="Thay đổi vai trò"
                        >
                          <option value="STUDENT">Student (Học viên)</option>
                          <option value="INSTRUCTOR">
                            Instructor (Giảng viên)
                          </option>
                          <option value="ADMIN">Admin (Quản trị viên)</option>
                        </select>
                      </td>

                      {/* Status badge */}
                      <td>
                        <span
                          className={`user-status-pill status-${u.status.toLowerCase()}`}
                        >
                          <span className="status-dot" />
                          <span>
                            {u.status === 'ACTIVE'
                              ? 'Đang hoạt động'
                              : 'Đã khóa'}
                          </span>
                        </span>
                      </td>

                      {/* Created date */}
                      <td>
                        <span className="user-date-cell">{formattedDate}</span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="user-action-buttons">
                          <button
                            type="button"
                            className={`user-action-btn ${isBlocked ? 'btn-unblock' : 'btn-block'}`}
                            onClick={() => handleToggleStatus(u)}
                            title={
                              isBlocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'
                            }
                          >
                            {isBlocked ? (
                              <IconlyTick size={15} color="#10b981" />
                            ) : (
                              <IconlyTimeCircle size={15} color="#f59e0b" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="user-action-btn btn-delete"
                            onClick={() => setDeletingUser(u)}
                            title="Xóa tài khoản khỏi hệ thống"
                          >
                            <IconlyDelete size={15} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Thêm người dùng mới ────────────────────────── */}
      {showCreateModal && (
        <div
          className="user-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="user-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconlyPlus size={20} color="#3b82f6" />
                <span>Thêm tài khoản người dùng mới</span>
              </h3>
              <button
                type="button"
                className="user-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <IconlyClose size={18} color="currentColor" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="user-modal-body">
                {createError && (
                  <div className="user-alert-error">
                    <IconlyClose size={15} color="#ef4444" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="form-grid-row">
                  <div className="form-group">
                    <label className="form-label">
                      Địa chỉ Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="user@example.com"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Họ và tên</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nguyễn Văn A"
                      value={createForm.fullName}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="form-grid-row">
                  <div className="form-group">
                    <label className="form-label">Mật khẩu ban đầu</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Mặc định: Purrfect@2026"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0912345678"
                      value={createForm.phoneNumber}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="form-grid-row">
                  <div className="form-group">
                    <label className="form-label">Vai trò phân quyền</label>
                    <select
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          role: e.target.value as UserRole,
                        }))
                      }
                    >
                      <option value="STUDENT">Student (Học viên)</option>
                      <option value="INSTRUCTOR">
                        Instructor (Giảng viên)
                      </option>
                      <option value="ADMIN">Admin (Quản trị viên)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Trạng thái tài khoản</label>
                    <select
                      className="form-select"
                      value={createForm.status}
                      onChange={(e) =>
                        setCreateForm((prev) => ({
                          ...prev,
                          status: e.target.value as UserStatus,
                        }))
                      }
                    >
                      <option value="ACTIVE">Hoạt động (Active)</option>
                      <option value="BLOCKED">Tạm khóa (Blocked)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="user-modal-footer">
                <button
                  type="button"
                  className="user-btn user-btn--outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="user-btn user-btn--primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Xác nhận xóa ──────────────────────────────── */}
      {deletingUser && (
        <div
          className="user-modal-overlay"
          onClick={() => setDeletingUser(null)}
        >
          <div
            className="user-modal-box user-modal-box--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="user-modal-header">
              <h3
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ef4444',
                }}
              >
                <IconlyDelete size={20} color="#ef4444" />
                <span>Xác nhận xóa tài khoản?</span>
              </h3>
            </div>
            <div className="user-modal-body">
              <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{' '}
                <strong style={{ color: '#f1f5f9' }}>
                  {deletingUser.fullName || deletingUser.email}
                </strong>{' '}
                ({deletingUser.email}) khỏi hệ thống? Hành động này không thể
                hoàn tác.
              </p>
            </div>
            <div className="user-modal-footer">
              <button
                type="button"
                className="user-btn user-btn--outline"
                onClick={() => setDeletingUser(null)}
                disabled={deleteSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="user-btn user-btn--danger"
                onClick={handleDeleteUser}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
