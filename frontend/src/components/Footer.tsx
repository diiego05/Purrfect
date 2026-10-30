import type { FC } from 'react';

export const Footer: FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-simple-container">
        {/* Horizontal Navigation Links */}
        <nav className="footer-nav-row" aria-label="Footer Navigation">
          <a href="#about" className="footer-nav-link">
            About us
          </a>
          <a href="#blog" className="footer-nav-link">
            Blog
          </a>
          <a href="#services" className="footer-nav-link">
            Services
          </a>
          <a href="#support" className="footer-nav-link">
            Support
          </a>
          <a href="#privacy" className="footer-nav-link">
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
