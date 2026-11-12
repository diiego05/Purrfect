import { useEffect, useState, type FC } from 'react';
import type { Course, HomeCoursesData } from '../../types/course';
import {
  fetchHomeCourses,
  recordCourseInteraction,
} from '../../services/courseApi';
import { useAuth } from '../../context/AuthContext';
import { CourseSection } from './CourseSection';
import './Courses.css';

export const HomeCourses: FC = () => {
  const { isAuthenticated, token, navigate } = useAuth();
  const [data, setData] = useState<HomeCoursesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        setLoading(true);
        const homeData = await fetchHomeCourses(token || undefined);
        if (isMounted) {
          setData(homeData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Lỗi tải danh sách khóa học',
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
  }, [token]);

  const handleCourseClick = (course: Course) => {
    if (course._id) {
      recordCourseInteraction({
        actionType: 'VIEW',
        courseId: course._id,
      });
    }
    navigate(`/courses/${course.slug}`);
  };

  return (
    <div className="home-courses-container">
      {/* Loading Skeletons */}
      {loading && (
        <div className="courses-loading-state">
          {[1, 2, 3].map((sectionIndex) => (
            <div key={sectionIndex} className="course-section-skeleton">
              <div className="skeleton-header">
                <div className="skeleton-title shimmer" />
                <div className="skeleton-link shimmer" />
              </div>
              <div className="course-grid">
                {[1, 2, 3, 4].map((cardIndex) => (
                  <div key={cardIndex} className="course-card-skeleton shimmer">
                    <div className="skeleton-img shimmer" />
                    <div className="skeleton-body">
                      <div className="skeleton-line shimmer short" />
                      <div className="skeleton-line shimmer long" />
                      <div className="skeleton-line shimmer medium" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="courses-error-state">
          <p>{error}</p>
          <button
            className="btn-retry"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      )}

      {/* 3 Main Sections */}
      {!loading && data && (
        <div className="home-courses-sections">
          {/* Mục 1: Dành riêng cho bạn */}
          <CourseSection
            sectionId="for-you"
            title="Dành riêng cho bạn"
            subtitle={
              isAuthenticated
                ? 'Được AI đề xuất dựa trên khảo sát định hướng & hành vi học tập của bạn'
                : 'Được chọn lọc và đề xuất dựa trên xu hướng phát triển kỹ năng hàng đầu'
            }
            courses={data.forYou}
            viewAllLink="#for-you"
            onCourseClick={handleCourseClick}
          />

          {/* Mục 2: Khóa học bán chạy nhất */}
          <CourseSection
            sectionId="best-sellers"
            title="Khóa học bán chạy nhất"
            subtitle="Các chương trình học được cộng đồng học viên tin cậy và đăng ký nhiều nhất"
            courses={data.bestSellers}
            viewAllLink="#best-sellers"
            onCourseClick={handleCourseClick}
          />

          {/* Mục 3: Khóa học mới ra mắt */}
          <CourseSection
            sectionId="new-releases"
            title="Khóa học mới ra mắt"
            subtitle="Cập nhật những công nghệ đột phá và kiến thức mới nhất hiện nay"
            courses={data.newReleases}
            viewAllLink="#new-releases"
            onCourseClick={handleCourseClick}
          />
        </div>
      )}
    </div>
  );
};
