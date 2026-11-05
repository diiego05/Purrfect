import { useState, useRef, useEffect, type FC } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchCategories,
  defaultCategories,
  recordCourseInteraction,
} from '../services/courseApi';
import type { Category } from '../types/course';

export const Header: FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('preferred_lang') as 'vi' | 'en') || 'vi';
  });
  const [exploreOpen, setExploreOpen] = useState(false);
  const [tempClosed, setTempClosed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Platform categories
  const [categories, setCategories] = useState<Category[]>(defaultCategories);

  const exploreBtnRef = useRef<HTMLDivElement>(null);
  const exploreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout, currentPath, navigate } = useAuth();
  const isLoginPage = currentPath === '/login' || currentPath === '/register';

  // Load platform categories from backend
  useEffect(() => {
    let isMounted = true;
    fetchCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setCategories(cats);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('preferred_lang', lang);
  };

  const handleExploreMouseEnter = () => {
    if (exploreTimerRef.current) clearTimeout(exploreTimerRef.current);
    setTempClosed(false);
    setExploreOpen(true);
  };

  const handleExploreMouseLeave = () => {
    exploreTimerRef.current = setTimeout(() => {
      setExploreOpen(false);
    }, 350);
  };

  const handleCategoryClick = (categorySlug: string) => {
    setTempClosed(true);
    setExploreOpen(false);

    recordCourseInteraction({
      actionType: 'SEARCH',
      searchKeyword: categorySlug,
    });

    const targetSection = document.getElementById('for-you');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(target)) {
        setAvatarMenuOpen(false);
      }
      if (
        exploreBtnRef.current &&
        !exploreBtnRef.current.contains(target) &&
        !(e.target as HTMLElement).closest('.explore-dropdown')
      ) {
        setExploreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    recordCourseInteraction({
      actionType: 'SEARCH',
      searchKeyword: searchValue.trim(),
    });

    const targetSection = document.getElementById('for-you');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="header-container">
      <div className="header-wrapper">
        {/* Left Section: Logo & Explore Dropdown */}
        <div className="header-left">
          <button
            type="button"
            className="header-logo"
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <span className="logo-text">Learnova</span>
            <span className="logo-dot">.</span>
          </button>

          {/* Explore Dropdown */}
          <div
            className="explore-dropdown-container"
            ref={exploreBtnRef}
            onMouseEnter={handleExploreMouseEnter}
            onMouseLeave={handleExploreMouseLeave}
          >
            <button
              type="button"
              className="explore-btn"
              onClick={() => {
                if (exploreOpen) {
                  setTempClosed(true);
                  setExploreOpen(false);
                } else {
                  setTempClosed(false);
                  setExploreOpen(true);
                }
              }}
              aria-expanded={exploreOpen && !tempClosed}
            >
              <span>{language === 'vi' ? 'Khám phá' : 'Explore'}</span>
              <svg
                className={`explore-icon ${exploreOpen && !tempClosed ? 'rotate' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {exploreOpen && !tempClosed && (
              <div className="explore-dropdown">
                <div className="explore-dropdown-content">
                  <div className="explore-column">
                    <span className="explore-col-title">
                      {language === 'vi' ? 'Danh mục ngành học' : 'Categories'}
                    </span>
                    <ul className="explore-list">
                      {categories.map((cat) => (
                        <li key={cat.slug}>
                          <button
                            type="button"
                            className="explore-link"
                            onClick={() => handleCategoryClick(cat.slug)}
                          >
                            <span className="cat-name">{cat.name}</span>
                            {cat.courseCount !== undefined &&
                              cat.courseCount > 0 && (
                                <span className="cat-badge">
                                  {cat.courseCount}
                                </span>
                              )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="explore-column highlight-column">
                    <span className="explore-col-title">
                      {language === 'vi'
                        ? 'Chương trình tuyển chọn'
                        : 'Curated Tracks'}
                    </span>
                    <div className="curated-card">
                      <span className="curated-tag">AI Powered</span>
                      <h4>Lộ trình chuyển ngành Web Fullstack 2026</h4>
                      <p>
                        Từ con số 0 đến làm chủ React 19, Node.js & System
                        Design chuẩn doanh nghiệp.
                      </p>
                      <button
                        type="button"
                        className="btn-curated"
                        onClick={() => {
                          setTempClosed(true);
                          setExploreOpen(false);
                          const el = document.getElementById('for-you');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {language === 'vi' ? 'Xem lộ trình' : 'View Track'} →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div className="header-center">
          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <svg
                className="search-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="header-search-input"
                placeholder={
                  language === 'vi'
                    ? 'Bạn muốn học kỹ năng gì hôm nay? (VD: React, Figma, AI...)'
                    : 'What do you want to learn today?'
                }
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchValue('')}
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Section: Nav Items, Language, Notifications & Auth */}
        <div className="header-right">
          {/* Admin quick access button if admin */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <button
              type="button"
              className="header-nav-btn admin-badge-btn"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              onClick={() => navigate('/admin/categories')}
            >
              🛡️ Admin
            </button>
          )}

          {/* Become Instructor */}
          <button
            type="button"
            className="header-nav-btn"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/register');
              } else {
                alert(
                  language === 'vi'
                    ? 'Tính năng đăng ký Giảng viên sẽ ra mắt trong giai đoạn tiếp theo!'
                    : 'Instructor registration coming soon!',
                );
              }
            }}
          >
            {language === 'vi' ? 'Trở thành Giảng viên' : 'Teach on Learnova'}
          </button>

          {/* Language Switcher */}
          <div className="header-language-switcher">
            <button
              type="button"
              className={`lang-btn ${language === 'vi' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('vi')}
              title="Tiếng Việt"
            >
              VI
            </button>
            <span className="lang-divider">/</span>
            <button
              type="button"
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Notifications Popover */}
          <div className="header-popover-anchor" ref={notificationRef}>
            <button
              type="button"
              className="header-icon-btn"
              aria-label="Notifications"
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setAvatarMenuOpen(false);
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notification-badge-dot" />
            </button>

            {notificationOpen && (
              <div className="header-dropdown notification-dropdown">
                <div className="dropdown-header">
                  <h3>{language === 'vi' ? 'Thông báo' : 'Notifications'}</h3>
                  <span className="dropdown-action">
                    {language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark all as read'}
                  </span>
                </div>
                <div className="dropdown-body">
                  <div className="notification-item unread">
                    <span className="notif-icon">🚀</span>
                    <div className="notif-content">
                      <p className="notif-title">Chào mừng bạn đến với Learnova!</p>
                      <span className="notif-time">Vừa xong</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Avatar & User Dropdown */}
          <div className="header-popover-anchor" ref={avatarRef}>
            <button
              type="button"
              className="header-avatar-btn"
              aria-label="User Avatar"
              onClick={() => {
                setAvatarMenuOpen(!avatarMenuOpen);
                setNotificationOpen(false);
              }}
            >
              {isAuthenticated && user ? (
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`
                  }
                  alt={user.fullName || 'User Avatar'}
                  className="user-avatar-img"
                />
              ) : (
                <div className="guest-avatar-icon-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </button>

            {avatarMenuOpen && (
              <div className="header-dropdown avatar-dropdown">
                {isAuthenticated && user ? (
                  <>
                    <div className="dropdown-user-header">
                      <p className="dropdown-user-name">
                        {user.fullName || user.email}
                      </p>
                      <p className="dropdown-user-email">{user.email}</p>
                      <span className="dropdown-role-badge">{user.role}</span>
                    </div>
                    <div className="dropdown-separator" />
                    
                    {user.role === 'ADMIN' && (
                      <>
                        <button
                          type="button"
                          className="dropdown-link"
                          style={{
                            color: '#818cf8',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'none',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            padding: '0.65rem 1rem',
                          }}
                          onClick={() => {
                            setAvatarMenuOpen(false);
                            navigate('/admin/categories');
                          }}
                        >
                          🛡️ {language === 'vi' ? 'Quản trị hệ thống (Admin)' : 'Admin Dashboard'}
                        </button>
                        <div className="dropdown-separator" />
                      </>
                    )}

                    <a
                      href="#courses"
                      className="dropdown-link"
                      onClick={() => setAvatarMenuOpen(false)}
                    >
                      {language === 'vi' ? 'Khóa học của tôi' : 'My Courses'}
                    </a>
                    <a
                      href="#certificates"
                      className="dropdown-link"
                      onClick={() => setAvatarMenuOpen(false)}
                    >
                      {language === 'vi'
                        ? 'Chứng chỉ của tôi'
                        : 'My Certificates'}
                    </a>
                    <div className="dropdown-separator" />
                    <button
                      type="button"
                      className="dropdown-btn-logout"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        logout();
                      }}
                    >
                      {language === 'vi' ? 'Đăng xuất' : 'Sign out'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="dropdown-guest-header">
                      <p className="dropdown-guest-title">
                        {language === 'vi'
                          ? 'Bắt đầu học tập ngay'
                          : 'Get started'}
                      </p>
                      <p className="dropdown-guest-desc">
                        {language === 'vi'
                          ? 'Đăng nhập để theo dõi lộ trình và nhận chứng chỉ hoàn thành.'
                          : 'Log in to track progress and earn certificates.'}
                      </p>
                    </div>
                    <div className="dropdown-auth-actions">
                      <button
                        type="button"
                        className="btn-auth-action primary"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate('/login');
                        }}
                      >
                        {language === 'vi' ? 'Đăng nhập' : 'Sign in'}
                      </button>
                      <button
                        type="button"
                        className="btn-auth-action secondary"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate('/register');
                        }}
                      >
                        {language === 'vi' ? 'Đăng ký tài khoản' : 'Register'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Login/Register Buttons for Desktop Guests */}
          {!isAuthenticated && !isLoginPage && (
            <div className="header-auth-buttons">
              <button
                type="button"
                className="btn-header-login"
                onClick={() => navigate('/login')}
              >
                {language === 'vi' ? 'Đăng nhập' : 'Log In'}
              </button>
              <button
                type="button"
                className="btn-header-register"
                onClick={() => navigate('/register')}
              >
                {language === 'vi' ? 'Đăng ký' : 'Sign Up'}
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="header-mobile-toggle"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </div>
    </header>
  );
};
