import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  IconlyCategory,
  IconlyDiscount,
  IconlySetting,
  IconlyUserGroup,
  IconlyLogout,
  IconlyHome,
} from '../Onboarding/IconlyIcons';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: 'categories' | 'system-configs' | 'coupons' | 'users';
  pageTitle?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'categories',
  pageTitle = 'Quản lý danh mục',
}) => {
  const { user, logout, navigate } = useAuth();

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
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <img
              src={
                user?.avatarUrl ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'admin@learnova.com')}`
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
