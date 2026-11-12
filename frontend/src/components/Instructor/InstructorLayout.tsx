import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  IconlyPlay,
  IconlyGraph,
  IconlyLogout,
  IconlyHome,
  IconlyUserGroup,
} from '../Onboarding/IconlyIcons';
import './InstructorLayout.css';

interface InstructorLayoutProps {
  children: React.ReactNode;
  activeTab?: 'courses' | 'analytics' | 'students';
  pageTitle?: string;
  onQuickCreate?: () => void;
}

export const InstructorLayout: React.FC<InstructorLayoutProps> = ({
  children,
  activeTab = 'courses',
  pageTitle = 'Quản lý khóa học',
}) => {
  const { user, logout, navigate } = useAuth();

  return (
    <div className="instructor-layout-root">
      {/* Sidebar */}
      <aside className="instructor-sidebar">
        <div className="instructor-sidebar-header">
          <div
            className="instructor-brand"
            onClick={() => navigate('/instructor/courses')}
            role="button"
            tabIndex={0}
          >
            <img
              src="/logo.svg"
              alt="Purrfect"
              className="instructor-brand-logo-img"
            />
            <span className="instructor-brand-badge">Giảng viên</span>
          </div>
        </div>

        <nav className="instructor-sidebar-nav">
          <div className="instructor-nav-section-label">Quản lý giảng dạy</div>

          <button
            type="button"
            className={`instructor-nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => navigate('/instructor/courses')}
          >
            <div className="instructor-nav-icon">
              <IconlyPlay size={18} color="currentColor" />
            </div>
            <span>Khóa học của tôi</span>
          </button>

          <div className="instructor-nav-section-label">
            Hiệu suất & Học viên
          </div>

          <button
            type="button"
            className={`instructor-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => navigate('/instructor/courses')}
          >
            <div className="instructor-nav-icon">
              <IconlyGraph size={18} color="currentColor" />
            </div>
            <span>Tổng quan KPI</span>
          </button>

          <button
            type="button"
            className={`instructor-nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => navigate('/instructor/courses')}
          >
            <div className="instructor-nav-icon">
              <IconlyUserGroup size={18} color="currentColor" />
            </div>
            <span>Học viên ghi danh</span>
          </button>
        </nav>

        <div className="instructor-sidebar-footer">
          <div className="instructor-user-info">
            <img
              src={
                user?.avatarUrl ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user?.email || 'instructor@purrfect.com')}`
              }
              alt="Instructor Avatar"
              className="instructor-user-avatar"
            />
            <div className="instructor-user-meta">
              <span className="instructor-user-name">
                {user?.fullName || user?.email || 'Giảng viên'}
              </span>
              <span className="instructor-user-role">INSTRUCTOR</span>
            </div>
          </div>
          <button
            type="button"
            className="instructor-btn-logout"
            title="Đăng xuất"
            onClick={logout}
          >
            <IconlyLogout size={18} color="currentColor" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="instructor-main-container">
        <header className="instructor-topbar">
          <div className="instructor-topbar-left">
            <div className="instructor-breadcrumbs">
              <span>Giảng viên</span>
              <span>/</span>
              <span className="instructor-breadcrumb-active">{pageTitle}</span>
            </div>
          </div>

          <div className="instructor-topbar-right">
            <button
              type="button"
              className="instructor-btn-return-home"
              onClick={() => navigate('/')}
            >
              <IconlyHome size={16} color="currentColor" />
              <span>Về trang chủ</span>
            </button>
          </div>
        </header>

        <main className="instructor-content-body">{children}</main>
      </div>
    </div>
  );
};
