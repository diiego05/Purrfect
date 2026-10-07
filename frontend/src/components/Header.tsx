import { useState, type FC } from 'react';
import { useAuth } from '../context/AuthContext';

export const Header: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, currentPath, navigate } = useAuth();

  const isLoginPage = currentPath === '/login';

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo */}
        <a
          href="/"
          className="header-logo"
          aria-label="Home"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <img src="/logo.svg" alt="PURR" className="header-logo-img" />
        </a>

        {/* Desktop Navigation */}
        <nav className="header-nav" aria-label="Main Navigation">
          <a
            href="#courses"
            className="nav-link"
            onClick={(e) => {
              if (isLoginPage) {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            Courses
          </a>
          <a
            href="#instructors"
            className="nav-link"
            onClick={(e) => {
              if (isLoginPage) {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            Instructors
          </a>
          <a
            href="#resources"
            className="nav-link"
            onClick={(e) => {
              if (isLoginPage) {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            Resources
          </a>
          <a
            href="#community"
            className="nav-link"
            onClick={(e) => {
              if (isLoginPage) {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            Community
          </a>
          <a
            href="#pricing"
            className="nav-link"
            onClick={(e) => {
              if (isLoginPage) {
                e.preventDefault();
                navigate('/');
              }
            }}
          >
            Pricing
          </a>
        </nav>

        {/* Right Actions */}
        <div className="header-actions">
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`
                  }
                  alt={user.fullName}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #e2e8f0',
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  {user.fullName || user.email}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: '#2563eb',
                  }}
                >
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#dc2626',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Đăng xuất
              </button>
            </div>
          ) : isLoginPage ? (
            /* Khi ở trang /login: Không còn Sign In và Get Started nữa theo yêu cầu */
            null
          ) : (
            <>
              <button
                type="button"
                className="btn-signin"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-get-started"
                onClick={() => navigate('/login')}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Get Started
              </button>
            </>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <a
            href="#courses"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isLoginPage) navigate('/');
            }}
          >
            Courses
          </a>
          <a
            href="#instructors"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isLoginPage) navigate('/');
            }}
          >
            Instructors
          </a>
          <a
            href="#resources"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isLoginPage) navigate('/');
            }}
          >
            Resources
          </a>
          <a
            href="#community"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isLoginPage) navigate('/');
            }}
          >
            Community
          </a>
          <a
            href="#pricing"
            onClick={() => {
              setMobileMenuOpen(false);
              if (isLoginPage) navigate('/');
            }}
          >
            Pricing
          </a>
          <div className="mobile-drawer-actions">
            {isAuthenticated && user ? (
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                Đăng xuất ({user.fullName || user.email})
              </button>
            ) : isLoginPage ? (
              null
            ) : (
              <>
                <button
                  type="button"
                  className="btn-signin"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn-get-started"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
