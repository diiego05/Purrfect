import { useState, useRef, useEffect, type FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCartWishlist } from '../context/CartWishlistContext';
import {
  fetchCategories,
  defaultCategories,
  recordCourseInteraction,
} from '../services/courseApi';
import type { Category } from '../types/course';
import { formatVND } from '../utils/format';
import {
  IconlyBuy,
  IconlyHeart,
  IconlyShield,
  IconlyTick,
  IconlyClose,
  IconlyUserGroup,
  IconlyPlay,
  IconlyAward,
  IconlyFolder,
  IconlyLogout,
  IconlyDocument,
} from './Onboarding/IconlyIcons';

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
  const cartDropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout, navigate } = useAuth();
  const {
    cartCount,
    wishlistCount,
    cartNotification,
    hideCartNotification,
    isCartBouncing,
  } = useCartWishlist();

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

  const handleMenuMouseEnter = () => {
    if (exploreTimerRef.current) clearTimeout(exploreTimerRef.current);
    setExploreOpen(true);
  };

  const handleMenuMouseLeave = () => {
    exploreTimerRef.current = setTimeout(() => {
      setExploreOpen(false);
    }, 350);
  };

  const handleCategorySelect = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    e.preventDefault();
    setExploreOpen(false);
    setTempClosed(true);
    setTimeout(() => setTempClosed(false), 350);

    recordCourseInteraction({
      actionType: 'SEARCH',
      searchKeyword: slug,
    });

    if (slug === 'for-you' || slug === 'all') {
      navigate('/category/all');
    } else {
      navigate(`/category/${slug}`);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        exploreBtnRef.current &&
        !exploreBtnRef.current.contains(target) &&
        !(target as HTMLElement).closest?.('.explore-mega-menu')
      ) {
        setExploreOpen(false);
      }
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
        cartDropdownRef.current &&
        !cartDropdownRef.current.contains(target)
      ) {
        hideCartNotification();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (exploreTimerRef.current) clearTimeout(exploreTimerRef.current);
    };
  }, [hideCartNotification]);

  return (
    <header className={`site-header ${tempClosed ? 'temp-closed' : ''}`}>
      <div className="header-container">
        {/* Left Section: Logo + Khám phá + Search Bar */}
        <div className="header-left">
          {/* Logo */}
          <a
            href="/"
            className="header-logo"
            aria-label="Purrfect Home"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <img src="/logo.svg" alt="PURR" className="header-logo-img" />
          </a>

          {/* Nút Khám phá */}
          <div
            className="header-explore-wrapper"
            ref={exploreBtnRef}
            onMouseEnter={handleExploreMouseEnter}
            onMouseLeave={handleExploreMouseLeave}
          >
            <button
              id="header-explore-btn"
              type="button"
              className={`header-explore-btn ${exploreOpen && !tempClosed ? 'active' : ''}`}
              onClick={() => {
                setTempClosed(false);
                setExploreOpen((prev) => !prev);
              }}
              aria-expanded={exploreOpen && !tempClosed}
              aria-haspopup="true"
            >
              <span>{language === 'vi' ? 'Khám phá' : 'Explore'}</span>
              <svg
                className={`explore-chevron ${exploreOpen && !tempClosed ? 'open' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Mega Menu Đa Cột Chuẩn Coursera / Udemy */}
            <div
              className={`explore-mega-menu ${exploreOpen && !tempClosed ? 'is-open' : ''}`}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
              role="region"
              aria-label="Danh mục ngành học"
            >
              <div className="mega-menu-header">
                <span className="mega-menu-title">
                  {language === 'vi'
                    ? 'Tất cả lĩnh vực đào tạo'
                    : 'All Learning Paths'}
                </span>
              </div>

              <div className="mega-menu-grid">
                {categories.map((cat) => (
                  <a
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="mega-menu-item"
                    onClick={(e) => handleCategorySelect(e, cat.slug)}
                  >
                    <span className="mega-item-name">{cat.name}</span>
                  </a>
                ))}
              </div>

              <div className="mega-menu-footer">
                <a
                  href="/search"
                  className="mega-footer-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setExploreOpen(false);
                    navigate('/search');
                  }}
                >
                  <span>
                    {language === 'vi'
                      ? 'Khám phá tất cả khóa học'
                      : 'Explore all courses'}
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Chứng chỉ (kế bên Khám phá) */}
          <a
            href="/certificates"
            className="header-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/certificates');
            }}
          >
            {language === 'vi' ? 'Chứng chỉ' : 'Certificates'}
          </a>

          {/* Diễn đàn */}
          <a
            href="/forum"
            className="header-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/forum');
            }}
          >
            {language === 'vi' ? 'Diễn đàn' : 'Forum'}
          </a>

          {/* Playlist */}
          <a
            href="/playlists"
            className="header-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/playlists');
            }}
          >
            {language === 'vi' ? 'Playlist' : 'Playlists'}
          </a>

          {/* Search Bar */}
          <form
            className="header-search-wrapper"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchValue.trim();
              if (q) {
                recordCourseInteraction({
                  actionType: 'SEARCH',
                  searchKeyword: q,
                });
                navigate(`/search?q=${encodeURIComponent(q)}`);
              } else {
                navigate('/search');
              }
            }}
          >
            <input
              type="text"
              className="search-input"
              placeholder={
                language === 'vi'
                  ? 'Bạn muốn học gì?'
                  : 'What do you want to learn?'
              }
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchValue('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="search-btn-round"
              aria-label="Search"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        {/* Right Section: Notifications, Wishlist, Cart, Avatar */}
        <div className="header-right">
          {/* Notifications */}
          <div className="header-popover-anchor" ref={notificationRef}>
            <button
              type="button"
              className="header-icon-btn"
              aria-label="Thông báo"
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
              <span className="notification-badge" />
            </button>

            {notificationOpen && (
              <div className="header-dropdown notification-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-title">
                    {language === 'vi' ? 'Thông báo' : 'Notifications'}
                  </span>
                  <span className="dropdown-tag">Mới</span>
                </div>
                <div className="dropdown-body">
                  <div className="notif-item unread">
                    <div className="notif-indicator" />
                    <div className="notif-info">
                      <p className="notif-title">
                        {language === 'vi'
                          ? 'Chào mừng bạn đến với Purrfect!'
                          : 'Welcome to Purrfect!'}
                      </p>
                      <p className="notif-desc">
                        {language === 'vi'
                          ? 'Bắt đầu hành trình học tập và nhận chứng chỉ ngay hôm nay.'
                          : 'Start learning courses and earn recognized certificates today.'}
                      </p>
                      <span className="notif-time">5m ago</span>
                    </div>
                  </div>
                  <div className="notif-item">
                    <div className="notif-info">
                      <p className="notif-title">
                        {language === 'vi'
                          ? 'Khóa học mới: Fullstack Web'
                          : 'New Course: Fullstack Web'}
                      </p>
                      <span className="notif-time">1h ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist Button - Cạnh bên Avatar */}
          <button
            type="button"
            className="header-icon-btn"
            title={language === 'vi' ? 'Khóa học yêu thích' : 'Wishlist'}
            aria-label="Khóa học yêu thích"
            onClick={() => navigate('/wishlist')}
          >
            <IconlyHeart size={20} color="#4b5563" />
            {wishlistCount > 0 && (
              <span className="header-count-badge badge-wishlist">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Button - Cạnh bên Avatar */}
          <div className="header-cart-anchor" ref={cartDropdownRef}>
            <button
              type="button"
              className={`header-icon-btn header-cart-icon-btn ${isCartBouncing ? 'cart-bounce-active' : ''}`}
              title={language === 'vi' ? 'Giỏ hàng' : 'Shopping Cart'}
              aria-label="Giỏ hàng"
              data-cart-icon="true"
              onClick={() => {
                hideCartNotification();
                navigate('/cart');
              }}
            >
              <IconlyBuy size={20} color="#4b5563" />
              {cartCount > 0 && (
                <span className="header-count-badge">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Thông báo thả xuống từ giỏ hàng (Cart Notification Popover) */}
            {cartNotification && cartNotification.visible && (
              <div
                className="cart-notify-dropdown"
                role="status"
                aria-live="polite"
              >
                <div className="cart-notify-arrow" />
                <div className="cart-notify-header">
                  <div className="cart-notify-tag">
                    <span className="cart-notify-check">
                      <IconlyTick size={12} color="#ffffff" />
                    </span>
                    <span className="cart-notify-tag-text">
                      {cartNotification.message ||
                        (language === 'vi'
                          ? 'Có 1 sản phẩm mới thêm vào giỏ'
                          : '1 item added to cart')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cart-notify-close-btn"
                    onClick={hideCartNotification}
                    aria-label="Đóng"
                  >
                    <IconlyClose size={13} color="#64748b" />
                  </button>
                </div>

                {cartNotification.course && (
                  <div className="cart-notify-item">
                    <img
                      src={
                        cartNotification.course.thumbnailUrl ||
                        '/assets/advanced_digital_skills.jpg'
                      }
                      alt={cartNotification.course.title}
                      className="cart-notify-img"
                    />
                    <div className="cart-notify-details">
                      <p className="cart-notify-name">
                        {cartNotification.course.title}
                      </p>
                      <p className="cart-notify-price">
                        {formatVND(
                          cartNotification.course.discountPrice &&
                            cartNotification.course.discountPrice > 0 &&
                            cartNotification.course.discountPrice <
                              cartNotification.course.price
                            ? cartNotification.course.discountPrice
                            : cartNotification.course.price,
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="cart-notify-footer">
                  <button
                    type="button"
                    className="cart-notify-view-btn"
                    onClick={() => {
                      hideCartNotification();
                      navigate('/cart');
                    }}
                  >
                    {language === 'vi'
                      ? `Xem giỏ hàng (${cartCount})`
                      : `View Cart (${cartCount})`}
                  </button>
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
                    <div
                      className="dropdown-user-header"
                      style={{ cursor: 'pointer' }}
                      title={
                        language === 'vi' ? 'Xem hồ sơ cá nhân' : 'View Profile'
                      }
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <p className="dropdown-user-name">
                        {user.fullName || user.email}
                      </p>
                      <p className="dropdown-user-email">{user.email}</p>
                      <span className="dropdown-role-badge">{user.role}</span>
                    </div>
                    <div className="dropdown-separator" />
                    <a
                      href="/profile"
                      className="dropdown-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setAvatarMenuOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <IconlyUserGroup size={16} color="#0056d2" />
                      <span>
                        {language === 'vi' ? 'Hồ sơ cá nhân' : 'My Profile'}
                      </span>
                    </a>
                    {user.role === 'ADMIN' && (
                      <button
                        type="button"
                        className="dropdown-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#0056d2',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: '10px 16px',
                        }}
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate('/admin/categories');
                        }}
                      >
                        <IconlyShield size={16} color="#0056d2" />
                        <span>
                          {language === 'vi'
                            ? 'Quản trị hệ thống (Admin)'
                            : 'Admin Dashboard'}
                        </span>
                      </button>
                    )}
                    {(user.role === 'INSTRUCTOR' || user.role === 'ADMIN') && (
                      <button
                        type="button"
                        className="dropdown-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#059669',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: '10px 16px',
                        }}
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          navigate('/instructor/courses');
                        }}
                      >
                        <IconlyDocument size={16} color="#059669" />
                        <span>
                          {language === 'vi' ? 'Giảng viên' : 'Instructor'}
                        </span>
                      </button>
                    )}
                    <a
                      href="/my-courses"
                      className="dropdown-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setAvatarMenuOpen(false);
                        navigate('/my-courses');
                      }}
                    >
                      <IconlyPlay size={16} color="#0056d2" />
                      <span>
                        {language === 'vi' ? 'Khóa học của tôi' : 'My Courses'}
                      </span>
                    </a>
                    <a
                      href="/my-certificates"
                      className="dropdown-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setAvatarMenuOpen(false);
                        navigate('/my-certificates');
                      }}
                    >
                      <IconlyAward size={16} color="#0056d2" />
                      <span>
                        {language === 'vi'
                          ? 'Chứng chỉ của tôi'
                          : 'My Certificates'}
                      </span>
                    </a>
                    <a
                      href="/playlists?tab=my"
                      className="dropdown-link"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setAvatarMenuOpen(false);
                        navigate('/playlists?tab=my');
                      }}
                    >
                      <IconlyFolder size={16} color="#0056d2" />
                      <span>
                        {language === 'vi'
                          ? 'Playlist của tôi'
                          : 'My Playlists'}
                      </span>
                    </a>
                    <div className="dropdown-separator" />
                    <div
                      className="dropdown-lang-wrapper"
                      title="Chọn ngôn ngữ / Select language"
                    >
                      <div className="dropdown-lang-label">
                        <svg
                          className="lang-globe-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <span>
                          {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                        </span>
                      </div>
                      <div className="header-lang-picker dropdown-lang-picker">
                        <button
                          type="button"
                          className={`lang-option-btn ${language === 'vi' ? 'active' : ''}`}
                          onClick={() => handleLanguageChange('vi')}
                          aria-label="Tiếng Việt"
                        >
                          Vi
                        </button>
                        <span className="lang-divider">|</span>
                        <button
                          type="button"
                          className={`lang-option-btn ${language === 'en' ? 'active' : ''}`}
                          onClick={() => handleLanguageChange('en')}
                          aria-label="English"
                        >
                          En
                        </button>
                      </div>
                    </div>
                    <div className="dropdown-separator" />
                    <button
                      type="button"
                      className="dropdown-btn-logout"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onClick={() => {
                        logout();
                        setAvatarMenuOpen(false);
                      }}
                    >
                      <IconlyLogout size={16} color="#ef4444" />
                      <span>{language === 'vi' ? 'Đăng xuất' : 'Log Out'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="dropdown-user-header">
                      <p className="dropdown-user-name">
                        {language === 'vi' ? 'Tài khoản' : 'Account'}
                      </p>
                      <p className="dropdown-user-email">
                        {language === 'vi'
                          ? 'Đăng nhập để xem khóa học & chứng chỉ'
                          : 'Sign in to access courses & certificates'}
                      </p>
                    </div>
                    <div className="dropdown-separator" />
                    <div
                      className="dropdown-lang-wrapper"
                      title="Chọn ngôn ngữ / Select language"
                    >
                      <div className="dropdown-lang-label">
                        <svg
                          className="lang-globe-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <span>
                          {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
                        </span>
                      </div>
                      <div className="header-lang-picker dropdown-lang-picker">
                        <button
                          type="button"
                          className={`lang-option-btn ${language === 'vi' ? 'active' : ''}`}
                          onClick={() => handleLanguageChange('vi')}
                          aria-label="Tiếng Việt"
                        >
                          Vi
                        </button>
                        <span className="lang-divider">|</span>
                        <button
                          type="button"
                          className={`lang-option-btn ${language === 'en' ? 'active' : ''}`}
                          onClick={() => handleLanguageChange('en')}
                          aria-label="English"
                        >
                          En
                        </button>
                      </div>
                    </div>
                    <div className="dropdown-separator" />
                    <button
                      type="button"
                      className="dropdown-btn-primary"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate('/login');
                      }}
                    >
                      {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
                    </button>
                    <button
                      type="button"
                      className="dropdown-btn-secondary"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate('/register');
                      }}
                    >
                      {language === 'vi' ? 'Đăng ký' : 'Get Started'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <form
            className="mobile-search-wrapper"
            onSubmit={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              const el =
                document.getElementById('for-you') ||
                document.querySelector('.course-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <input
              type="text"
              className="search-input"
              placeholder={
                language === 'vi'
                  ? 'Bạn muốn học gì?'
                  : 'What do you want to learn?'
              }
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button
              type="submit"
              className="search-btn-round"
              style={{ width: '28px', height: '28px', minWidth: '28px' }}
              aria-label="Search"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          <a
            href="/certificates"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              navigate('/certificates');
            }}
          >
            {language === 'vi' ? 'Chứng chỉ' : 'Certificates'}
          </a>

          <a
            href="/forum"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              navigate('/forum');
            }}
          >
            {language === 'vi' ? 'Diễn đàn' : 'Forum'}
          </a>

          <a
            href="/playlists"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              navigate('/playlists');
            }}
          >
            {language === 'vi' ? 'Playlist khóa học' : 'Course Playlists'}
          </a>

          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#111827',
              marginTop: '12px',
              paddingLeft: '4px',
            }}
          >
            {language === 'vi' ? 'Danh mục khóa học' : 'Course Categories'}
          </div>

          <div className="mobile-cat-accordion" style={{ padding: '4px 0' }}>
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="mobile-cat-item"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigate(`/category/${cat.slug}`);
                }}
              >
                {cat.name}
              </a>
            ))}
            <a
              href="/certificates"
              className="mobile-cat-item"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                navigate('/certificates');
              }}
            >
              {language === 'vi' ? 'Chứng chỉ' : 'Certificates'}
            </a>
          </div>
          <div className="mobile-drawer-footer">
            <div className="mobile-lang-row">
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                Ngôn ngữ:
              </span>
              <button
                type="button"
                className={`lang-option-btn ${language === 'vi' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('vi')}
              >
                Vi
              </button>
              <span className="lang-divider">|</span>
              <button
                type="button"
                className={`lang-option-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                En
              </button>
            </div>
            {isAuthenticated && user ? (
              <button
                type="button"
                className="dropdown-btn-logout"
                style={{ width: '100%', marginTop: '12px' }}
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                Đăng xuất ({user.fullName || user.email})
              </button>
            ) : (
              <button
                type="button"
                className="dropdown-btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
              >
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
