import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './NotFound.css';

export const NotFound: React.FC = () => {
  const { navigate } = useAuth();

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        {/* Left Column: 404 Watermark & Headings */}
        <div className="notfound-text-section">
          {/* Subtle watermark 404 behind the text */}
          <div className="notfound-watermark" aria-hidden="true">
            404
          </div>

          <div className="notfound-message-box">
            <h1 className="notfound-title">OOOps!</h1>
            <h2 className="notfound-subtitle">Page Not Found</h2>

            <p className="notfound-desc">
              Sorry about that! Please visit our homepage
              <br className="notfound-br-desktop" />
              to get where you need to go.
            </p>

            <button
              type="button"
              className="notfound-btn"
              onClick={() => navigate('/')}
            >
              Back to homepage
            </button>
          </div>
        </div>

        {/* Right Column: Cosmic Astronaut Illustration */}
        <div className="notfound-visual-section">
          <div className="notfound-image-wrapper">
            <img
              src="/assets/Default 404 pages.svg"
              alt="404 Page Not Found"
              className="notfound-illustration"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
