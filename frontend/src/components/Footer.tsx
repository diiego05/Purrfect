import type { FC } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Footer: FC = () => {
  const { navigate } = useAuth();
  const { language } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-simple-container">
        {/* Horizontal Navigation Links */}
        <nav className="footer-nav-row" aria-label="Footer Navigation">
          <a
            href="/about"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/about');
            }}
          >
            {language === 'vi' ? 'Về chúng tôi' : 'About Us'}
          </a>
          <a
            href="/blog"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/blog');
            }}
          >
            {language === 'vi' ? 'Bài viết & Tin tức' : 'Blog'}
          </a>
          <a
            href="/services"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/services');
            }}
          >
            {language === 'vi' ? 'Dịch vụ đào tạo' : 'Services'}
          </a>
          <a
            href="/support"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/support');
            }}
          >
            {language === 'vi' ? 'Hỗ trợ khách hàng' : 'Support'}
          </a>
          <a
            href="/privacy"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/privacy');
            }}
          >
            {language === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy'}
          </a>
        </nav>

        {/* Bottom Copyright Text */}
        <div className="footer-bottom-line">
          <p className="copyright-text">
            {language === 'vi'
              ? '2026 © Purrfect | Đã đăng ký bản quyền'
              : '2026 © Purrfect | All rights reserved'}
          </p>
        </div>
      </div>
    </footer>
  );
};
