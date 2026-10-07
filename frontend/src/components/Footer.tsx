import { useState, type FC, type FormEvent } from 'react';


export const Footer: FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing with: ${email}`);
      setEmail('');
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-main-container">

        {/* Column 1: Logo & Subscribe */}
        <div className="footer-col footer-col-brand">
          <div className="footer-brand-header">
            <a href="/" className="footer-favicon-link" aria-label="Footer Logo">

              <img
                src="/favicon.svg"
                alt="Logo"
                className="footer-favicon-img"
              />
            </a>
            <div className="footer-tagline">Your Tagline here</div>
          </div>

          <div className="footer-subscribe-box">
            <h4 className="footer-subscribe-title">Subscribe Now</h4>
            <form onSubmit={handleSubscribe} className="footer-subscribe-form">
              <div className="subscribe-input-group">
                <svg
                  className="mail-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Email"
                  className="subscribe-input"
                  required
                />
              </div>
              <button type="submit" className="btn-subscribe">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Information */}
        <div className="footer-col">
          <h4 className="footer-col-title">Information</h4>
          <ul className="footer-links">
            <li><a href="#about">About Us</a></li>
            <li><a href="#more-search">More Search</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
            <li><a href="#events">Events</a></li>
          </ul>
        </div>

        {/* Column 3: Helpful Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">Helpful Links</h4>
          <ul className="footer-links">
            <li><a href="#services">Services</a></li>
            <li><a href="#supports">Supports</a></li>
            <li><a href="#terms">Terms & Condition</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Column 4: Our Services */}
        <div className="footer-col">
          <h4 className="footer-col-title">Our Services</h4>
          <ul className="footer-links">
            <li><a href="#brands">Brands list</a></li>
            <li><a href="#order">Order</a></li>
            <li><a href="#return-exchange">Return & Exchange</a></li>
            <li><a href="#fashion">Fashion list</a></li>
            <li><a href="#blog">Blog</a></li>
          </ul>
        </div>

        {/* Column 5: Contact Us */}
        <div className="footer-col footer-col-contact">
          <h4 className="footer-col-title">Contact Us</h4>
          <div className="contact-list">
            <div className="contact-item">
              <span className="contact-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <a href="tel:+919999999999" className="contact-text">+91 9999 999 999</a>
            </div>

            <div className="contact-item">
              <span className="contact-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <a href="mailto:youremailid.com" className="contact-text">youremailid.com</a>
            </div>
          </div>

          {/* Social Icons (Black Circles with White Icons) */}
          <div className="footer-social-row">
            <a href="#facebook" className="social-circle-btn" aria-label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>

            <a href="#google" className="social-circle-btn" aria-label="Google Plus">
              <span className="google-plus-text">g+</span>
            </a>

            <a href="#twitter" className="social-circle-btn" aria-label="Twitter">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>

            <a href="#instagram" className="social-circle-btn" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p className="copyright-text">
            2018 © company.Ltd. | All Right reserved
          </p>
          <div className="footer-legal-links">
            <a href="#faq">FAQ</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms & Condition</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
