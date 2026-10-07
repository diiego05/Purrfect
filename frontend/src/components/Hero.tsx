import type { FC } from 'react';

export const Hero: FC = () => {
  return (
    <section className="hero-section">
      {/* Decorative background ambient shapes */}
      <div className="hero-bg-blob blob-top-left" aria-hidden="true" />
      <div className="hero-bg-blob blob-bottom-right" aria-hidden="true" />

      <div className="hero-container">
        {/* Left Column: Content */}
        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <span>Transformative Learning Experience</span>
          </div>

          {/* Heading */}
          <h1 className="hero-title">
            Unlock Your Potential with <span className="text-highlight">Purrfect</span>
          </h1>

          {/* Description */}
          <p className="hero-description">
            Accelerate your career with expert-led online courses. Learn at your own pace and apply new skills to real-world projects today..
          </p>

          {/* CTA Buttons */}
          <div className="hero-actions">
            <a href="#courses" className="btn-browse-courses">
              <svg
                className="btn-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Browse Courses</span>
            </a>

            <a href="#trial" className="btn-trial-lesson">
              Free Trial Lesson
            </a>
          </div>

          {/* Guarantees / Badges */}
          <div className="hero-guarantees">
            <div className="guarantee-item">
              <svg
                className="check-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>14-day money back guarantee</span>
            </div>

            <div className="guarantee-item">
              <svg
                className="check-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Certificates included</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Card Showcase */}
        <div className="hero-visual">
          <div className="hero-card">
            {/* Architectural showcase image */}
            <div className="hero-image-wrapper">
              <img
                src="/hero-preview.jpg"
                alt="Interactive learning space"
                className="hero-image"
              />
            </div>

            {/* Bottom floating live session bar */}
            <div className="hero-live-bar">
              <div className="live-info">
                <div className="live-badge-icon" aria-hidden="true">
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
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div className="live-text">
                  <span className="live-title">Live Session Starting</span>
                  <span className="live-subtitle">Advanced React Patterns</span>
                </div>
              </div>

              <a href="#join" className="btn-join-now">
                Join Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
