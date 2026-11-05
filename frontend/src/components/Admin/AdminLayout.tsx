import React from 'react';
import { useAuth } from '../../context/AuthContext';
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
            <div className="admin-brand-icon">L</div>
            <div className="admin-brand-title">Learnova</div>
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
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span>Quản lý danh mục</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => navigate('/admin/coupons')}
          >
            <div className="admin-nav-icon">
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
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <span>Mã giảm giá</span>
            <span className="admin-nav-tag">UC18</span>
          </button>

          <div className="admin-nav-section-label">Vận hành & Hệ thống</div>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'system-configs' ? 'active' : ''}`}
            onClick={() => navigate('/admin/system-configs')}
          >
            <div className="admin-nav-icon">
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span>Cấu hình hệ thống</span>
            <span className="admin-nav-tag">UC31</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => navigate('/admin/users')}
          >
            <div className="admin-nav-icon">
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span>Quản lý người dùng</span>
            <span className="admin-nav-tag">UC24</span>
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
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
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Về trang chủ</span>
            </button>
          </div>
        </header>

        <main className="admin-content-body">{children}</main>
      </div>
    </div>
  );
};

