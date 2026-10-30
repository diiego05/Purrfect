import type { FC } from 'react';
import { useAuth } from '../context/AuthContext';

export const Hero: FC = () => {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || 'bạn';

  return (
    <section className="hero-section">
      {/* Decorative background ambient shapes */}
      <div className="hero-bg-blob blob-top-left" aria-hidden="true" />
      <div className="hero-bg-blob blob-bottom-right" aria-hidden="true" />

      <div className="hero-container">
        {/* Left Column: Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Chào mừng <span className="text-highlight">{displayName}</span> quay
            trở lại <span className="text-highlight">Purrfect</span>
          </h1>
        </div>

        {/* Right Column: Visual illustration */}
        <div className="hero-visual">
          <img
            src="/assets/Business decisions-bro.svg"
            alt="Business decisions illustration"
            className="hero-illustration-img"
          />
        </div>
      </div>
    </section>
  );
};
