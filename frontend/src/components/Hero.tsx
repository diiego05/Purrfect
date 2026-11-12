import type { FC } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IconlyDiscovery,
  IconlyPlay,
  IconlyTick,
} from './Onboarding/IconlyIcons';

export const Hero: FC = () => {
  const { user, isAuthenticated, navigate } = useAuth();
  const displayName = user?.fullName?.trim() || 'bạn';

  // Kiểm tra tài khoản đã đăng nhập nhưng chưa hoàn thành Onboarding (bỏ qua khảo sát)
  const hasSkippedOnboarding = Boolean(
    isAuthenticated && user && !user.onboardingCompleted,
  );

  const handleExploreCourses = () => {
    const el =
      document.getElementById('for-you') ||
      document.querySelector('.course-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

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

          {hasSkippedOnboarding ? (
            /* Khối thông báo & nút bấm thực hiện lại Onboarding cho tài khoản đã bỏ qua */
            <div className="hero-onboarding-prompt">
              <div className="hero-onboarding-badge">
                <IconlyDiscovery size={16} color="#0056d2" />
                <span>Chưa hoàn thành định hướng học tập</span>
              </div>
              <h2 className="hero-onboarding-heading">
                Thiết lập lộ trình học tập cá nhân hóa của bạn
              </h2>
              <p className="hero-onboarding-text">
                Bạn đã bỏ qua phần khảo sát mục tiêu. Hãy dành{' '}
                <strong>1 phút</strong> để Purrfect thấu hiểu định hướng nghề
                nghiệp và gợi ý danh sách khóa học phù hợp nhất dành riêng cho
                bạn!
              </p>
              <div className="hero-onboarding-cta-row">
                <button
                  type="button"
                  className="hero-onboarding-btn-primary"
                  onClick={() => navigate('/onboarding')}
                >
                  <IconlyDiscovery size={18} color="#ffffff" />
                  <span>Khảo sát định hướng ngay</span>
                  <svg
                    width="16"
                    height="16"
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
                </button>
                <button
                  type="button"
                  className="hero-onboarding-btn-secondary"
                  onClick={handleExploreCourses}
                >
                  Khám phá tất cả khóa học
                </button>
              </div>
              <div className="hero-onboarding-perks">
                <div className="perk-item">
                  <IconlyTick size={14} color="#16a34a" />
                  <span>Đề xuất khóa học chuẩn mục tiêu</span>
                </div>
                <div className="perk-item">
                  <IconlyTick size={14} color="#16a34a" />
                  <span>Cá nhân hóa kỹ năng & trình độ</span>
                </div>
                <div className="perk-item">
                  <IconlyTick size={14} color="#16a34a" />
                  <span>Chỉ mất 1 phút thực hiện</span>
                </div>
              </div>
            </div>
          ) : (
            /* Giao diện mặc định khi đã hoàn thành hoặc khách vãng lai */
            <div className="hero-default-content">
              <p className="hero-description">
                {isAuthenticated
                  ? 'Lộ trình học tập của bạn đã được cá nhân hóa. Khám phá các khóa học chất lượng cao từ các chuyên gia hàng đầu ngay bên dưới!'
                  : 'Nền tảng học trực tuyến chất lượng cao với hàng trăm khóa học thực chiến từ chuyên gia hàng đầu. Khám phá ngay để bứt phá sự nghiệp!'}
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn-browse-courses"
                  onClick={handleExploreCourses}
                >
                  <IconlyPlay size={18} color="#ffffff" />
                  <span>Khám phá khóa học</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                {isAuthenticated && (
                  <button
                    type="button"
                    className="btn-trial-lesson"
                    onClick={() => navigate('/onboarding')}
                    title="Khảo sát lại để cập nhật mục tiêu & kỹ năng mới"
                  >
                    <IconlyDiscovery size={16} color="#0056d2" />
                    <span>Cập nhật lại định hướng</span>
                  </button>
                )}
              </div>
            </div>
          )}
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
