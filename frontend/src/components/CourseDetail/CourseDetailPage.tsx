import { useEffect, useState, type FC } from 'react';
import type { Course, SkillItem } from '../../types/course';
import {
  fetchCourseBySlug,
  recordCourseInteraction,
} from '../../services/courseApi';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import {
  IconlyShield,
  IconlyTimeCircle,
  IconlyFolder,
  IconlyDevice,
  IconlyChat,
  IconlyAward,
  IconlyTick,
  IconlyStar,
  IconlyUserGroup,
  IconlyPlay,
} from '../Onboarding/IconlyIcons';
import './CourseDetailPage.css';

interface CourseDetailPageProps {
  slug: string;
}

export const CourseDetailPage: FC<CourseDetailPageProps> = ({ slug }) => {
  const { navigate } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'syllabus' | 'instructor' | 'reviews'
  >('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    fetchCourseBySlug(slug).then((data) => {
      if (isMounted) {
        setCourse(data);
        setLoading(false);

        if (data?._id) {
          recordCourseInteraction({
            actionType: 'VIEW',
            courseId: data._id,
          });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleEnrollClick = () => {
    if (!course) return;
    if (course._id) {
      recordCourseInteraction({
        actionType: 'ENROLL',
        courseId: course._id,
      });
    }
    setIsEnrolled(true);
    alert(
      `Chúc mừng bạn đã đăng ký khóa học "${course.title}" thành công! Hệ thống đã ghi nhận vào lộ trình học tập của bạn.`,
    );
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="detail-banner-skeleton shimmer" />
        <div className="detail-container">
          <div className="detail-card-skeleton shimmer" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-not-found">
        <div className="not-found-box">
          <h2>Không tìm thấy khóa học</h2>
          <p>Khóa học với đường dẫn này không tồn tại hoặc đã được cập nhật.</p>
          <button className="btn-back-home" onClick={() => navigate('/')}>
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Chuẩn hóa Cấp độ hiển thị
  const formatLevel = (lvl?: string) => {
    const l = (lvl || 'Beginner').toLowerCase();
    if (l.includes('inter') || l.includes('trung')) {
      return { title: 'Cấp độ Trung cấp', desc: 'Kinh nghiệm được đề xuất' };
    }
    if (l.includes('adv') || l.includes('cao')) {
      return { title: 'Cấp độ Nâng cao', desc: 'Dành cho chuyên gia' };
    }
    return { title: 'Cấp độ Cơ bản', desc: 'Dành cho người mới bắt đầu' };
  };

  const levelInfo = formatLevel(course.level);

  // Chuẩn hóa thời lượng học
  const displayHours =
    course.durationText ||
    (course.durationHours ? `${course.durationHours} giờ` : '1.5 hours');

  // Chuẩn hóa số sao và số lượt đánh giá
  const ratingNum = course.averageRating
    ? Number(course.averageRating).toFixed(1)
    : '4.8';
  const ratingCount = course.totalStudents
    ? Math.max(12, Math.round(course.totalStudents * 0.35)).toLocaleString(
        'vi-VN',
      )
    : '14.314';

  const categoryName =
    typeof course.categoryId === 'object' && course.categoryId?.name
      ? course.categoryId.name
      : 'Kỹ năng chuyên sâu';

  // Giảng viên
  const instructorName =
    typeof course.instructorId === 'object' && course.instructorId?.name
      ? course.instructorId.name
      : 'Summer Scaggs';

  const instructorAvatar =
    typeof course.instructorId === 'object' && course.instructorId?.avatar
      ? course.instructorId.avatar
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80';

  // Lấy danh sách kỹ năng
  const skillsList: string[] = Array.isArray(course.skillIds)
    ? (course.skillIds as (SkillItem | string)[]).map((s) =>
        typeof s === 'object' && s.name ? s.name : String(s),
      )
    : [];

  return (
    <div className="course-detail-page">
      {/* 1. HERO BANNER THEO MẪU */}
      <section className="course-hero-banner">
        <div className="banner-inner-container">
          {/* Breadcrumb */}
          <nav className="course-breadcrumb" aria-label="Breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate('/')}>
              Trang chủ
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{categoryName}</span>
          </nav>

          <div className="banner-content-grid">
            <div className="banner-text-col">
              <h1 className="course-hero-title">{course.title}</h1>

              {/* Thông tin giảng viên */}
              <div className="course-instructor-line">
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="instructor-avatar-circle"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
                  }}
                />
                <span className="instructor-label">
                  Giảng viên:{' '}
                  <strong className="instructor-name-link">
                    {instructorName}
                  </strong>
                </span>
              </div>

              {/* Nút Đăng ký & Số học viên */}
              <div className="banner-cta-group">
                <button
                  className={`btn-banner-enroll ${isEnrolled ? 'enrolled' : ''}`}
                  onClick={handleEnrollClick}
                >
                  {isEnrolled ? '✓ Đã đăng ký thành công' : 'Đăng ký miễn phí'}
                </button>
                <div className="banner-students-enrolled">
                  <strong>
                    {course.totalStudents
                      ? course.totalStudents.toLocaleString('vi-VN')
                      : '1.408.583'}
                  </strong>{' '}
                  đã đăng ký
                </div>
              </div>
            </div>

            {/* Họa tiết vòng tròn vector trang trí bên phải */}
            <div className="banner-decor-col" aria-hidden="true">
              <div className="abstract-circle-ring ring-outer" />
              <div className="abstract-circle-ring ring-middle" />
              <div className="abstract-circle-ring ring-inner" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. THANH THÔNG SỐ NỔI (FLOATING INFO BAR) */}
      <div className="floating-info-bar-wrapper">
        <div className="floating-info-bar">
          {/* Cột 1: Phân loại / Dự án thực hành */}
          <div className="info-bar-col">
            <h3 className="col-headline">Các dự án có hướng dẫn</h3>
            <p className="col-subtext">
              Học, thực hành và áp dụng các kỹ năng sẵn sàng cho công việc với
              sự hướng dẫn của chuyên gia
            </p>
          </div>

          {/* Cột 2: Số sao & Đánh giá (Thông số chỉ định) */}
          <div className="info-bar-col">
            <div className="col-rating-line">
              <span className="rating-score">{ratingNum}</span>
              <span className="rating-star">★</span>
              <span className="rating-count">({ratingCount} đánh giá)</span>
            </div>
            <p className="col-subtext">
              Đánh giá trung thực từ cộng đồng người học
            </p>
          </div>

          {/* Cột 3: Cấp độ (Thông số chỉ định) */}
          <div className="info-bar-col">
            <h3 className="col-headline">{levelInfo.title}</h3>
            <p className="col-subtext">{levelInfo.desc} ⓘ</p>
          </div>

          {/* Cột 4: Giờ học (Thông số chỉ định) */}
          <div className="info-bar-col">
            <h3 className="col-headline">{displayHours}</h3>
            <p className="col-subtext">Học theo tốc độ của riêng bạn</p>
          </div>
        </div>
      </div>

      {/* 3. NỘI DUNG CHI TIẾT RIÊNG BIỆT CHO PURRFECT (KHÁC BIỆT 100%) */}
      <div className="course-main-content-layout">
        <div className="content-left-column">
          {/* Tabs điều hướng nội dung */}
          <div className="purr-content-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              className={`tab-btn ${activeTab === 'syllabus' ? 'active' : ''}`}
              onClick={() => setActiveTab('syllabus')}
            >
              Chương trình học
            </button>
            <button
              className={`tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructor')}
            >
              Giảng viên
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Đánh giá ({ratingNum} ★)
            </button>
          </div>

          {/* Tab 1: Tổng quan */}
          {activeTab === 'overview' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <h2 className="section-heading">Những gì bạn sẽ học được</h2>
                <div className="learning-outcomes-grid">
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Nắm vững các nguyên lý thực chiến và kỹ năng giải quyết
                      vấn đề từ căn bản đến chuyên sâu.
                    </span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Thao tác tự tin với các công cụ hàng đầu, tối ưu hóa quy
                      trình làm việc chuyên nghiệp.
                    </span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Xây dựng các dự án thực tế để hoàn thiện hồ sơ năng lực
                      (Portfolio) gây ấn tượng với nhà tuyển dụng.
                    </span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Tư duy phân tích dữ liệu và áp dụng linh hoạt trong môi
                      trường doanh nghiệp hiện đại.
                    </span>
                  </div>
                </div>
              </section>

              {skillsList.length > 0 && (
                <section className="detail-section-card">
                  <h2 className="section-heading">Kỹ năng bạn sẽ tích lũy</h2>
                  <div className="skills-badge-wrap">
                    {skillsList.map((skill, idx) => (
                      <span key={idx} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="detail-section-card">
                <h2 className="section-heading">Mô tả chi tiết khóa học</h2>
                <p className="course-long-desc">
                  {course.description ||
                    course.shortDescription ||
                    'Khóa học được thiết kế bởi các chuyên gia đầu ngành, mang lại trải nghiệm học tập thực tế và tương tác cao. Mỗi bài học đều có bài tập ứng dụng kèm lời giải chi tiết giúp bạn nhanh chóng làm chủ kỹ năng.'}
                </p>
              </section>
            </div>
          )}

          {/* Tab 2: Chương trình học */}
          {activeTab === 'syllabus' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <div className="syllabus-header">
                  <div>
                    <h2 className="section-heading">
                      Lộ trình 4 giai đoạn hoàn chỉnh
                    </h2>
                    <p className="syllabus-meta">
                      4 Module • 28 Bài giảng • Thời lượng {displayHours}
                    </p>
                  </div>
                </div>

                <div className="syllabus-accordion">
                  {[
                    {
                      title: 'Module 1: Nền tảng cốt lõi & Thiết lập công cụ',
                      lessons: 6,
                      duration: '2h 15m',
                    },
                    {
                      title: 'Module 2: Các kỹ thuật và thao tác thực chiến',
                      lessons: 8,
                      duration: '3h 40m',
                    },
                    {
                      title: 'Module 3: Dự án thực tế chuẩn doanh nghiệp',
                      lessons: 10,
                      duration: '4h 30m',
                    },
                    {
                      title:
                        'Module 4: Kiểm tra đánh giá & Cấp chứng chỉ tốt nghiệp',
                      lessons: 4,
                      duration: '1h 35m',
                    },
                  ].map((mod, idx) => (
                    <div key={idx} className="module-item">
                      <button
                        className="module-toggle-btn"
                        onClick={() =>
                          setExpandedModule(expandedModule === idx ? null : idx)
                        }
                      >
                        <div className="module-title-left">
                          <span className="module-index">0{idx + 1}</span>
                          <span className="module-name">{mod.title}</span>
                        </div>
                        <div className="module-meta-right">
                          <span>
                            {mod.lessons} bài học • {mod.duration}
                          </span>
                          <span className="module-arrow">
                            {expandedModule === idx ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>
                      {expandedModule === idx && (
                        <div className="module-content-drawer">
                          <ul className="lesson-list">
                            <li>
                              <span>
                                1. Giới thiệu tổng quan và mục tiêu đầu ra
                              </span>
                              <span className="lesson-tag">Video 15m</span>
                            </li>
                            <li>
                              <span>
                                2. Hướng dẫn cài đặt và cấu hình môi trường
                              </span>
                              <span className="lesson-tag">Video 20m</span>
                            </li>
                            <li>
                              <span>3. Bài tập thực hành có chấm điểm</span>
                              <span className="lesson-tag quiz">Thực hành</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: Giảng viên */}
          {activeTab === 'instructor' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card instructor-bio-card">
                <div className="instructor-card-top">
                  <img
                    src={instructorAvatar}
                    alt={instructorName}
                    className="instructor-large-avatar"
                  />
                  <div>
                    <h2 className="instructor-fullname">{instructorName}</h2>
                    <p className="instructor-role">
                      Chuyên gia đào tạo & Cố vấn cấp cao tại Purrfect Academy
                    </p>
                    <div className="instructor-stats-row">
                      <span className="stat-item">
                        <IconlyStar size={16} color="#f59e0b" />
                        <span>
                          <strong>{ratingNum}</strong> Điểm giảng viên
                        </span>
                      </span>
                      <span className="stat-item">
                        <IconlyUserGroup size={16} color="#0056d2" />
                        <span>
                          <strong>
                            {course.totalStudents.toLocaleString('vi-VN')}
                          </strong>{' '}
                          Học viên
                        </span>
                      </span>
                      <span className="stat-item">
                        <IconlyAward size={16} color="#0056d2" />
                        <span>
                          <strong>12</strong> Khóa học đã xuất bản
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <p className="instructor-bio-text">
                  Với hơn 10 năm kinh nghiệm trong ngành và từng đào tạo hàng
                  chục nghìn học viên trên toàn cầu, giảng viên mang đến phương
                  pháp giảng dạy trực quan, dễ hiểu và tập trung 100% vào ứng
                  dụng thực tiễn.
                </p>
              </section>
            </div>
          )}

          {/* Tab 4: Đánh giá */}
          {activeTab === 'reviews' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <h2 className="section-heading">
                  Phản hồi từ học viên đã hoàn thành
                </h2>
                <div className="reviews-summary-box">
                  <div className="review-big-score">
                    <span className="big-number">{ratingNum}</span>
                    <div className="stars-gold-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <IconlyStar key={s} size={20} color="#f59e0b" />
                      ))}
                    </div>
                    <span className="score-desc">
                      {ratingCount} đánh giá tích cực
                    </span>
                  </div>
                  <div className="review-bars-col">
                    {[
                      { star: '5 sao', percent: '88%' },
                      { star: '4 sao', percent: '9%' },
                      { star: '3 sao', percent: '2%' },
                      { star: '2 sao', percent: '1%' },
                      { star: '1 sao', percent: '0%' },
                    ].map((bar, i) => (
                      <div key={i} className="review-bar-line">
                        <span className="bar-label">{bar.star}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: bar.percent }}
                          />
                        </div>
                        <span className="bar-pct">{bar.percent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Cột Phải (Sidebar Sticky Widget) */}
        <aside className="content-right-sidebar">
          <div className="sticky-enrollment-card">
            <div className="sidebar-thumb-wrap">
              <img
                src={
                  course.thumbnailUrl || '/assets/advanced_digital_skills.jpg'
                }
                alt={course.title}
                className="sidebar-thumb-img"
              />
              <div className="sidebar-thumb-overlay">
                <span className="btn-play-preview">
                  <IconlyPlay size={14} color="#0f172a" />
                  <span>Xem trước khóa học</span>
                </span>
              </div>
            </div>

            <div className="sidebar-card-body">
              <div className="sidebar-price-row">
                <span className="current-price">{formatVND(course.price)}</span>
                {Boolean(course.discountPrice && course.discountPrice > 0) && (
                  <span className="original-price">
                    {formatVND(course.discountPrice)}
                  </span>
                )}
                {course.badge && (
                  <span className="discount-tag">{course.badge}</span>
                )}
              </div>

              <button
                className={`btn-sidebar-cta ${isEnrolled ? 'enrolled' : ''}`}
                onClick={handleEnrollClick}
              >
                {isEnrolled ? 'Tiếp tục vào bài học' : 'Bắt đầu học ngay'}
              </button>

              <div className="course-guarantee-note">
                <IconlyShield size={17} color="#0056d2" />
                <span>Hoàn tiền 100% trong 7 ngày</span>
              </div>

              <div className="perks-list">
                <h4 className="perks-title">Đặc quyền khóa học bao gồm:</h4>
                <ul>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyTimeCircle size={18} color="#0056d2" />
                    </span>
                    <span>{displayHours} video bài giảng theo lộ trình</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyFolder size={18} color="#0056d2" />
                    </span>
                    <span>Tài nguyên & source code dự án tải về</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyDevice size={18} color="#0056d2" />
                    </span>
                    <span>Học linh hoạt trên cả Điện thoại và Máy tính</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyChat size={18} color="#0056d2" />
                    </span>
                    <span>Diễn đàn thảo luận và trợ giảng giải đáp 24/7</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyAward size={18} color="#0056d2" />
                    </span>
                    <span>Chứng chỉ tốt nghiệp xác thực khi hoàn thành</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
