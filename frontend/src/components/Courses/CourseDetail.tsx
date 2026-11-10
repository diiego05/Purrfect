import { useState, useEffect, type FC } from 'react';
import type { Course } from '../../types/course';
import {
  fetchCourseBySlug,
  recordCourseInteraction,
} from '../../services/courseApi';
import { useAuth } from '../../context/AuthContext';
import './CourseDetail.css';

interface CourseDetailProps {
  slug: string;
}

export const CourseDetail: FC<CourseDetailProps> = ({ slug }) => {
  const { navigate, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCourse = async () => {
      try {
        setLoading(true);
        const data = await fetchCourseBySlug(slug);
        if (!cancelled) {
          if (data) {
            setCourse(data);
            setError(null);
            // Ghi nhận tương tác xem khóa học phục vụ gợi ý AI
            if (data._id) {
              recordCourseInteraction({
                actionType: 'VIEW',
                courseId: data._id,
              });
            }
          } else {
            setError('Không tìm thấy thông tin khóa học yêu cầu.');
          }
        }
      } catch {
        if (!cancelled) {
          setError('Không thể tải thông tin khóa học. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setToastMessage(
      `Đăng ký thành công khóa học "${course?.title}". Chúc bạn có trải nghiệm học tập tuyệt vời!`,
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading) {
    return (
      <div className="course-detail-container">
        <div className="course-detail-loading">
          <div className="course-detail-spinner"></div>
          <p>Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="course-detail-container">
        <div className="course-detail-not-found">
          <div className="course-detail-nf-icon">📚</div>
          <h2>Không tìm thấy khóa học</h2>
          <p>{error || 'Khóa học này không tồn tại hoặc đã ngừng xuất bản.'}</p>
          <button
            type="button"
            className="btn-back-home"
            onClick={() => navigate('/')}
          >
            ← Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  const categoryName =
    typeof course.categoryId === 'object' && course.categoryId !== null
      ? (course.categoryId as { name?: string }).name || 'Kỹ năng số'
      : 'Khóa học trực tuyến';

  const priceVal = course.price;
  const discountVal = course.discountPrice;
  const hasDiscount = discountVal !== undefined && discountVal > 0 && discountVal < priceVal;

  return (
    <div className="course-detail-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="course-detail-toast" role="alert">
          <span>✅ {toastMessage}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <section className="course-detail-hero">
        <div className="course-detail-hero-content">
          <nav className="course-breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => navigate('/')}
            >
              Trang chủ
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{categoryName}</span>
          </nav>

          <div className="course-hero-badges">
            {course.badge && (
              <span className="hero-badge hero-badge--custom">
                {course.badge}
              </span>
            )}
            <span className="hero-badge hero-badge--level">{course.level}</span>
            <span className="hero-badge hero-badge--cat">{categoryName}</span>
          </div>

          <h1 className="course-hero-title">{course.title}</h1>

          <p className="course-hero-desc">
            {course.shortDescription ||
              'Chương trình học toàn diện với lộ trình chuẩn mực, bài giảng thực chiến và sự đồng hành 24/7 của Trợ lý AI Learnova.'}
          </p>

          <div className="course-hero-meta">
            <div className="hero-meta-item">
              <span className="meta-icon">⭐</span>
              <strong>{course.averageRating ? Number(course.averageRating).toFixed(1) : '4.8'}</strong>
              <span className="meta-sub">({course.totalStudents.toLocaleString()} học viên)</span>
            </div>
            <div className="hero-meta-item">
              <span className="meta-icon">⏱️</span>
              <span>{course.durationText || `${course.durationHours || 20}h bài giảng`}</span>
            </div>
            <div className="hero-meta-item">
              <span className="meta-icon">🌐</span>
              <span>Tiếng Việt</span>
            </div>
            <div className="hero-meta-item">
              <span className="meta-icon">🎓</span>
              <span>Chứng chỉ hoàn thành điện tử</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid */}
      <div className="course-detail-main-layout">
        {/* Left Column: Details, Curriculum, Policies */}
        <div className="course-detail-left-col">
          {/* What you'll learn */}
          <section className="course-card-box">
            <h2 className="box-title">🎯 Bạn sẽ học được những gì?</h2>
            <div className="learning-outcomes-grid">
              <div className="outcome-item">
                <span className="outcome-check">✓</span>
                <span>Nắm vững tư duy cốt lõi và các nguyên lý ứng dụng thực tế theo quy chuẩn ngành.</span>
              </div>
              <div className="outcome-item">
                <span className="outcome-check">✓</span>
                <span>Thực chiến qua các dự án mô phỏng thực tế với tài liệu và mã nguồn hoàn chỉnh.</span>
              </div>
              <div className="outcome-item">
                <span className="outcome-check">✓</span>
                <span>Được Trợ lý AI tư vấn và giải đáp mọi thắc mắc ngay trong suốt quá trình học.</span>
              </div>
              <div className="outcome-item">
                <span className="outcome-check">✓</span>
                <span>Nhận chứng chỉ điện tử có giá trị định danh khi hoàn thành 100% nội dung bài giảng.</span>
              </div>
            </div>
          </section>

          {/* Description & Overview */}
          <section className="course-card-box">
            <h2 className="box-title">📖 Mô tả khóa học</h2>
            <div className="course-full-description">
              <p>
                Khóa học <strong>{course.title}</strong> được biên soạn kỹ lưỡng bởi đội ngũ chuyên gia hàng đầu. Khóa học được tối ưu hóa cho học viên từ cơ bản đến nâng cao, kết hợp giữa lý thuyết nền tảng và bài tập thực hành ứng dụng.
              </p>
              <p>
                Người học sẽ được tiếp cận với hệ thống bài giảng video chất lượng cao, bài kiểm tra đánh giá năng lực tự động và đặc biệt là hệ thống Trợ lý ảo AI (RAG) hỗ trợ giải đáp 24/7.
              </p>
            </div>
          </section>

          {/* Platform Policies (BR21.1) */}
          <section className="course-card-box course-policy-box">
            <h2 className="box-title">🛡️ Cam kết & Chính sách từ Learnova</h2>
            <div className="policy-list">
              <div className="policy-item">
                <span className="policy-icon">💵</span>
                <div>
                  <strong>Chính sách hoàn tiền trong 7 ngày</strong>
                  <p>Học viên được yêu cầu hoàn tiền trong vòng 7 ngày kể từ khi đăng ký nếu chưa học quá 30% nội dung khóa học.</p>
                </div>
              </div>
              <div className="policy-item">
                <span className="policy-icon">📜</span>
                <div>
                  <strong>Chứng chỉ chứng nhận năng lực</strong>
                  <p>Cấp chứng chỉ điện tử chính thức từ Learnova sau khi bạn vượt qua tất cả bài kiểm tra trắc nghiệm.</p>
                </div>
              </div>
              <div className="policy-item">
                <span className="policy-icon">🏷️</span>
                <div>
                  <strong>Hỗ trợ áp dụng mã giảm giá</strong>
                  <p>Học viên có thể nhập mã giảm giá (coupon) tại bước thanh toán để nhận thêm ưu đãi đặc biệt.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Pricing & Action Card */}
        <aside className="course-detail-sidebar" aria-label="Đăng ký khóa học">
          <div className="course-pricing-card">
            <div className="pricing-card-thumb-wrapper">
              <img
                src={course.thumbnailUrl || '/assets/advanced_digital_skills.jpg'}
                alt={course.title}
                className="pricing-card-thumb"
              />
            </div>

            <div className="pricing-card-content">
              <div className="pricing-card-price-row">
                <span className="current-price">
                  {hasDiscount ? `${discountVal.toLocaleString('vi-VN')}đ` : `${priceVal.toLocaleString('vi-VN')}đ`}
                </span>
                {hasDiscount && (
                  <>
                    <span className="original-price">{priceVal.toLocaleString('vi-VN')}đ</span>
                    <span className="discount-tag">
                      -{Math.round(((priceVal - discountVal) / priceVal) * 100)}%
                    </span>
                  </>
                )}
              </div>

              <div className="pricing-card-actions">
                <button
                  type="button"
                  className="btn-enroll-primary"
                  onClick={handleEnrollClick}
                >
                  {isAuthenticated ? 'Đăng ký học ngay' : 'Đăng nhập để đăng ký'}
                </button>

                <button
                  type="button"
                  className="btn-back-home-secondary"
                  onClick={() => navigate('/')}
                >
                  ← Khám phá thêm khóa học
                </button>
              </div>

              <div className="course-features-summary">
                <div className="features-title">Khóa học này bao gồm:</div>
                <ul className="features-list">
                  <li>🎥 {course.durationText || `${course.durationHours || 20}h`} video chất lượng cao</li>
                  <li>📱 Xem được trên máy tính, điện thoại, tablet</li>
                  <li>♾️ Quyền truy cập học tập trọn đời</li>
                  <li>🤖 Trợ lý AI tư vấn và giải đáp thắc mắc 24/7</li>
                  <li>🏆 Chứng chỉ điện tử khi hoàn thành</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

