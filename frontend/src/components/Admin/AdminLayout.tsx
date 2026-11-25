import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  IconlyCategory,
  IconlyDiscount,
  IconlySetting,
  IconlyUserGroup,
  IconlyLogout,
  IconlyHome,
  IconlyTick,
  IconlyShield,
  IconlyWork,
  IconlyGraph,
} from '../Onboarding/IconlyIcons';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?:
    | 'categories'
    | 'system-configs'
    | 'coupons'
    | 'users'
    | 'course-approvals'
    | 'refunds'
    | 'moderation'
    | 'instructor-applications'
    | 'statistics';
  pageTitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'categories',
  pageTitle = 'Quản lý danh mục',
}) => {
  const { user, isAuthenticated, isLoading, logout, navigate } = useAuth();

  if (isLoading) {
    return (
      <div className="admin-guard-container">
        <div className="admin-guard-spinner" />
        <p>Đang kiểm tra quyền truy cập Quản trị viên...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="admin-guard-container">
        <div className="admin-guard-card">
          <div className="admin-guard-icon unauth">
            <IconlyShield size={36} color="#0056d2" />
          </div>
          <h2>Yêu cầu đăng nhập Quản trị viên</h2>
          <p>
            Khu vực Quản trị (Admin) yêu cầu đăng nhập bằng tài khoản Quản trị
            viên hệ thống để truy cập.
          </p>
          <button
            type="button"
            className="btn-guard-primary"
            onClick={() => navigate('/login')}
          >
            Đăng nhập tài khoản Admin
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="admin-guard-container">
        <div className="admin-guard-card">
          <div className="admin-guard-icon forbidden">
            <IconlyShield size={36} color="#dc2626" />
          </div>
          <h2>Từ chối truy cập (403 Forbidden)</h2>
          <p>
            Bạn không có quyền truy cập vào Khu vực Quản trị viên. Trang này chỉ
            dành riêng cho tài khoản Quản trị viên (Admin) của hệ thống.
          </p>
          <div className="admin-guard-actions">
            <button
              type="button"
              className="btn-guard-primary"
              onClick={() => navigate('/')}
            >
              Về Trang chủ
            </button>
            {user.role === 'INSTRUCTOR' && (
              <button
                type="button"
                className="btn-guard-secondary"
                onClick={() => navigate('/instructor/courses')}
              >
                Vào Bảng điều khiển Giảng viên
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-root">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div
            className="admin-brand"
            onClick={() => navigate('/admin/categories')}
            role="button"
            tabIndex={0}
          >
            <img
              src="/logo.svg"
              alt="Purrfect"
              className="admin-brand-logo-img"
            />
            <span className="admin-brand-badge">Admin</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">Quản trị nội dung</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'course-approvals' ? 'active' : ''}`}
            onClick={() => navigate('/admin/courses')}
          >
            <div className="admin-nav-icon">
              <IconlyTick size={18} color="currentColor" />
            </div>
            <span>Phê duyệt khóa học</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => navigate('/admin/moderation')}
          >
            <div className="admin-nav-icon">
              <IconlyShield size={18} color="currentColor" />
            </div>
            <span>Kiểm duyệt nội dung</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => navigate('/admin/categories')}
          >
            <div className="admin-nav-icon">
              <IconlyCategory size={18} color="currentColor" />
            </div>
            <span>Quản lý danh mục</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => navigate('/admin/coupons')}
          >
            <div className="admin-nav-icon">
              <IconlyDiscount size={18} color="currentColor" />
            </div>
            <span>Mã giảm giá</span>
          </button>

          <div className="admin-nav-section-label">Vận hành & Hệ thống</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => navigate('/admin/statistics')}
          >
            <div className="admin-nav-icon">
              <IconlyGraph size={18} color="currentColor" />
            </div>
            <span>Thống kê</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'instructor-applications' ? 'active' : ''}`}
            onClick={() => navigate('/admin/instructor-applications')}
          >
            <div className="admin-nav-icon">
              <IconlyWork size={18} color="currentColor" />
            </div>
            <span>Duyệt đơn giảng viên</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'system-configs' ? 'active' : ''}`}
            onClick={() => navigate('/admin/system-configs')}
          >
            <div className="admin-nav-icon">
              <IconlySetting size={18} color="currentColor" />
            </div>
            <span>Cấu hình hệ thống</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => navigate('/admin/users')}
          >
            <div className="admin-nav-icon">
              <IconlyUserGroup size={18} color="currentColor" />
            </div>
            <span>Quản lý người dùng</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'refunds' ? 'active' : ''}`}
            onClick={() => navigate('/admin/refunds')}
          >
            <div className="admin-nav-icon">
              <IconlyDiscount size={18} color="currentColor" />
            </div>
            <span>Hoàn tiền & Rút tiền</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <img
              src={
                user?.avatarUrl ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'admin@purrfect.com')}`
              }
              alt="Admin Avatar"
              className="admin-user-avatar"
            />
            <div className="admin-user-meta">
              <span className="admin-user-name">
                {user?.fullName || user?.email || 'Quản trị viên'}
              </span>
              <span className="admin-user-role">ADMINISTRATOR</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn-logout"
            title="Đăng xuất"
            onClick={logout}
          >
            <IconlyLogout size={18} color="currentColor" />
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="admin-main-container">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-breadcrumbs">
              <span>Admin</span>
              <span>/</span>
              <span className="admin-breadcrumb-active">{pageTitle}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-btn-return-home"
              onClick={() => navigate('/')}
            >
              <IconlyHome size={16} color="currentColor" />
              <span>Về trang chủ</span>
            </button>
          </div>
        </header>

        <main className="admin-content-body">{children}</main>
      </div>
    </div>
  );
};
