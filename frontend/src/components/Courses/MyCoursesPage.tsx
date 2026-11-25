import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  fetchMyEnrolledCourses,
  type EnrolledCourseItem,
} from '../../services/courseApi';
import {
  IconlyPlay,
  IconlySearch,
  IconlyDocument,
  IconlyLock,
} from '../Onboarding/IconlyIcons';
import './MyCoursesPage.css';

export const MyCoursesPage: React.FC = () => {
  const { navigate, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [courses, setCourses] = useState<EnrolledCourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<
    'ALL' | 'IN_PROGRESS' | 'COMPLETED'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let isMounted = true;
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchMyEnrolledCourses();
        if (isMounted) {
          if (res.success && Array.isArray(res.courses)) {
            setCourses(res.courses);
          } else {
            setCourses([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : language === 'vi'
                ? 'Không thể tải danh sách khóa học.'
                : 'Failed to load courses.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate, language]);

  // Filtered courses based on tab & search query
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Tab filter
      if (activeTab === 'IN_PROGRESS' && c.isCompleted) return false;
      if (activeTab === 'COMPLETED' && !c.isCompleted) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = c.title.toLowerCase().includes(q);
        const instructorMatch = c.instructor?.fullName
          ?.toLowerCase()
          .includes(q);
        const categoryMatch = c.category?.name?.toLowerCase().includes(q);
        return titleMatch || instructorMatch || categoryMatch;
      }
      return true;
    });
  }, [courses, activeTab, searchQuery]);

  return (
    <div className="my-courses-page">
      <div className="my-courses-container">
        {/* Header */}
        <div className="my-courses-header">
          <h1 className="my-courses-title">
            {language === 'vi' ? 'Khóa học của tôi' : 'My Courses'}
          </h1>
          <p className="my-courses-subtitle">
            {language === 'vi'
              ? 'Theo dõi tiến độ học tập, tiếp tục bài giảng đang dở và hoàn thành lộ trình phát triển kỹ năng.'
              : 'Track your learning progress, resume active lectures, and master your career goals.'}
          </p>
        </div>

        {/* Toolbar: Tabs & Search */}
        <div className="my-courses-toolbar">
          <div className="my-courses-tabs">
            <button
              type="button"
              className={`mc-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              {language === 'vi' ? 'Tất cả' : 'All'}
            </button>
            <button
              type="button"
              className={`mc-tab-btn ${activeTab === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setActiveTab('IN_PROGRESS')}
            >
              {language === 'vi' ? 'Đang học' : 'In Progress'}
            </button>
            <button
              type="button"
              className={`mc-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              {language === 'vi' ? 'Đã hoàn thành' : 'Completed'}
            </button>
          </div>

          <div className="my-courses-search-wrap">
            <div className="my-courses-search-icon">
              <IconlySearch size={16} color="currentColor" />
            </div>
            <input
              type="text"
              className="my-courses-search-input"
              placeholder={
                language === 'vi'
                  ? 'Tìm kiếm theo tên khóa học, giảng viên...'
                  : 'Search by course title or instructor...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '16px 20px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '10px',
              marginBottom: '24px',
              border: '1px solid #fee2e2',
            }}
          >
            {error}
          </div>
        )}

        {/* Content: Loading Skeleton / Empty State / Cards Grid */}
        {loading ? (
          <div className="my-courses-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mc-skeleton-card shimmer" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="my-courses-empty">
            <div className="empty-icon-wrap">
              <IconlyDocument size={36} color="currentColor" />
            </div>
            <h3 className="empty-title">
              {searchQuery.trim()
                ? language === 'vi'
                  ? 'Không tìm thấy khóa học phù hợp'
                  : 'No matching courses found'
                : language === 'vi'
                  ? 'Bạn chưa tham gia khóa học nào'
                  : "You haven't enrolled in any courses yet"}
            </h3>
            <p className="empty-subtitle">
              {searchQuery.trim()
                ? language === 'vi'
                  ? 'Vui lòng thử tìm kiếm với từ khóa khác.'
                  : 'Try searching with different keywords.'
                : language === 'vi'
                  ? 'Khám phá ngay hàng trăm khóa học thực chiến từ các chuyên gia hàng đầu để bắt đầu lộ trình của bạn.'
                  : 'Explore hundreds of practical courses from top experts to start your learning journey.'}
            </p>
            {!searchQuery.trim() && (
              <button
                type="button"
                className="btn-mc-explore"
                onClick={() => navigate('/')}
              >
                <IconlyPlay size={16} color="#ffffff" />
                <span>
                  {language === 'vi'
                    ? 'Khám phá khóa học ngay'
                    : 'Explore Courses'}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="my-courses-grid">
            {filteredCourses.map((c) => {
              const isLocked = c.accessStatus === 'REFUND_PENDING';
              return (
                <div key={c._id} className="my-course-card">
                  {/* Thumbnail */}
                  <div
                    className="my-course-thumb-wrap"
                    onClick={() => {
                      if (!isLocked) {
                        navigate(`/learning/${c.slug}`);
                      } else {
                        navigate('/purchase-history');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={
                        c.thumbnailUrl || '/assets/advanced_digital_skills.jpg'
                      }
                      alt={c.title}
                      className="my-course-thumb-img"
                    />
                    {c.category?.name && (
                      <span className="my-course-category-pill">
                        {c.category.name}
                      </span>
                    )}

                    {c.isManualEnrollment && (
                      <span
                        className="my-course-category-pill"
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          fontWeight: 600,
                        }}
                      >
                        {language === 'vi' ? 'Ghi danh thủ công' : 'Manual'}
                      </span>
                    )}

                    {isLocked ? (
                      <span className="my-course-status-badge badge-locked">
                        {language === 'vi'
                          ? 'Tạm khóa (Chờ hoàn tiền)'
                          : 'Locked (Refund Pending)'}
                      </span>
                    ) : c.isCompleted ? (
                      <span className="my-course-status-badge badge-completed">
                        {language === 'vi' ? 'Đã hoàn thành' : 'Completed'}
                      </span>
                    ) : (
                      <span className="my-course-status-badge badge-in-progress">
                        {language === 'vi' ? 'Đang học' : 'In Progress'}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="my-course-body">
                    <h3
                      className="my-course-title"
                      onClick={() => {
                        if (!isLocked) {
                          navigate(`/learning/${c.slug}`);
                        } else {
                          navigate('/purchase-history');
                        }
                      }}
                    >
                      {c.title}
                    </h3>

                    {/* Instructor */}
                    <div className="my-course-instructor-meta">
                      <img
                        src={
                          c.instructor?.avatarUrl ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                            c.instructor?.email || c.title,
                          )}`
                        }
                        alt={c.instructor?.fullName || 'Giảng viên'}
                        className="my-course-inst-avatar"
                      />
                      <span className="my-course-inst-name">
                        {c.instructor?.fullName ||
                          (language === 'vi'
                            ? 'Chuyên gia Purrfect'
                            : 'Purrfect Instructor')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="my-course-progress-section">
                      <div className="progress-labels">
                        <span className="progress-percent-text">
                          {c.progressPercent}%{' '}
                          {language === 'vi' ? 'hoàn thành' : 'completed'}
                        </span>
                        <span className="progress-count-text">
                          {c.completedLectures} / {c.totalLectures}{' '}
                          {language === 'vi' ? 'bài giảng' : 'lectures'}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${
                            c.isCompleted ? 'fill-completed' : ''
                          }`}
                          style={{ width: `${c.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="my-course-footer">
                      {isLocked ? (
                        <button
                          type="button"
                          className="btn-mc-locked"
                          onClick={() => navigate('/purchase-history')}
                        >
                          <IconlyLock size={15} color="currentColor" />
                          <span>
                            {language === 'vi'
                              ? 'Xem trạng thái hoàn tiền'
                              : 'View Refund Status'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-mc-learn"
                          onClick={() => navigate(`/learning/${c.slug}`)}
                        >
                          <IconlyPlay size={15} color="#ffffff" />
                          <span>
                            {c.progressPercent > 0
                              ? language === 'vi'
                                ? 'Tiếp tục học'
                                : 'Resume Learning'
                              : language === 'vi'
                                ? 'Bắt đầu học'
                                : 'Start Learning'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-mc-detail"
                        onClick={() => navigate(`/courses/${c.slug}`)}
                      >
                        {language === 'vi' ? 'Chi tiết' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
