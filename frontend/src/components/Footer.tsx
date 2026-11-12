import type { FC } from 'react';
import { useAuth } from '../context/AuthContext';

export const Footer: FC = () => {
  const { navigate } = useAuth();

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
            About us
          </a>
          <a
            href="/blog"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/blog');
            }}
          >
            Blog
          </a>
          <a
            href="/services"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/services');
            }}
          >
            Services
          </a>
          <a
            href="/support"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/support');
            }}
          >
            Support
          </a>
          <a
            href="/privacy"
            className="footer-nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/privacy');
            }}
          >
            Privacy Policy
          </a>
        </nav>

        {/* Bottom Copyright Text */}
        <div className="footer-bottom-line">
          <p className="copyright-text">2026 © Purrfect | All Right reserved</p>
        </div>
      </div>
    </footer>
  );
};
