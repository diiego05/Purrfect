import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchInstructorCourses } from '../../services/courseApi';
import type { PublicInstructorProfileData } from '../../services/courseApi';
import type { Course } from '../../types/course';
import { CourseCard } from '../Courses/CourseCard';
import '../Courses/Courses.css';
import {
  IconlySearch,
  IconlyStar,
  IconlyUserGroup,
  IconlyAward,
  IconlyShield,
  IconlyDocument,
} from '../Onboarding/IconlyIcons';
import './PublicInstructorCoursesPage.css';

interface PublicInstructorCoursesPageProps {
  instructorId: string;
}

export const PublicInstructorCoursesPage: React.FC<
  PublicInstructorCoursesPageProps
> = ({ instructorId }) => {
  const { navigate } = useAuth();
  const [data, setData] = useState<PublicInstructorProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<
    'popular' | 'newest' | 'rating' | 'price-low' | 'price-high'
  >('popular');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await fetchInstructorCourses(instructorId);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin giảng viên:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [instructorId]);

  // Lọc và sắp xếp khóa học
  const filteredCourses = (() => {
    if (!data?.courses) return [];
    let list = [...data.courses];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.shortDescription?.toLowerCase().includes(q),
      );
    }

    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
        break;
      case 'newest':
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        break;
      case 'rating':
        list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'price-low':
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    return list;
  })();

  const totalPages = Math.ceil(filteredCourses.length / pageSize) || 1;
  const pagedCourses = filteredCourses.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const instructor = data?.instructor;
  const stats = data?.stats;
  const instructorName = instructor?.fullName || 'Giảng viên Purrfect';
  const instructorAvatar =
    instructor?.avatarUrl ||
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80';
  const instructorHeadline =
    instructor?.headline ||
    'Chuyên gia đào tạo & Cố vấn cấp cao tại Purrfect Academy';
  const instructorBio =
    instructor?.bio ||
    'Với nhiều năm kinh nghiệm thực chiến trong ngành và từng đào tạo hàng chục nghìn học viên, giảng viên mang đến phương pháp giảng dạy trực quan, thực chiến và dễ tiếp thu.';

  return (
    <div className="public-instructor-page">
      {/* 1. Breadcrumb bar */}
      <nav className="public-ins-breadcrumb-bar">
        <div className="public-ins-breadcrumb-container">
          <span className="link" onClick={() => navigate('/')}>
            Trang chủ
          </span>
          <span className="sep">/</span>
          <span className="link" onClick={() => navigate('/categories/all')}>
            Khám phá khóa học
          </span>
          <span className="sep">/</span>
          <span className="current">Giảng viên: {instructorName}</span>
        </div>
      </nav>

      {/* 2. Profile Hero Header */}
      <section className="public-ins-profile-hero">
        <div className="public-ins-hero-container">
          <div className="public-ins-hero-avatar-wrap">
            <img
              src={instructorAvatar}
              alt={instructorName}
              className="public-ins-hero-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
              }}
            />
          </div>

          <div className="public-ins-hero-info">
            <div className="public-ins-hero-badge">
              <IconlyShield size={14} color="#60a5fa" />
              <span>Giảng viên đối tác chính thức</span>
            </div>
            <h1 className="public-ins-hero-name">{instructorName}</h1>
            <p className="public-ins-hero-headline">{instructorHeadline}</p>
            <p className="public-ins-hero-bio">{instructorBio}</p>

            <div className="public-ins-hero-stats">
              <div className="public-ins-stat-pill">
                <IconlyAward size={18} color="#60a5fa" />
                <span>
                  <strong>
                    {stats?.totalCourses || data?.courses?.length || 0}
                  </strong>{' '}
                  Khóa học đã xuất bản
                </span>
              </div>
              <div className="public-ins-stat-pill">
                <IconlyUserGroup size={18} color="#60a5fa" />
                <span>
                  <strong>
                    {(stats?.totalStudents || 0).toLocaleString('vi-VN')}
                  </strong>{' '}
                  Học viên theo học
                </span>
              </div>
              <div className="public-ins-stat-pill">
                <IconlyStar size={18} color="#f59e0b" />
                <span>
                  <strong>{stats?.averageRating || 4.9}</strong> Đánh giá trung
                  bình
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Courses Section */}
      <main className="public-ins-courses-section">
        <div className="public-ins-courses-toolbar">
          <h2 className="public-ins-courses-heading">
            Tất cả khóa học của giảng viên
          </h2>

          <div className="public-ins-filter-controls">
            {/* Search */}
            <div className="public-ins-search-box">
              <IconlySearch size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Sort */}
            <select
              className="public-ins-sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(
                  e.target.value as
                    | 'popular'
                    | 'newest'
                    | 'rating'
                    | 'price-low'
                    | 'price-high',
                );
                setPage(1);
              }}
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="newest">Mới nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="price-low">Học phí: Thấp đến cao</option>
              <option value="price-high">Học phí: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="public-ins-loading-wrap">
            <div className="public-ins-spinner" />
            <p>Đang tải danh sách khóa học của giảng viên...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="public-ins-empty-wrap">
            <IconlyDocument size={48} color="#cbd5e1" />
            <h3>Chưa tìm thấy khóa học nào phù hợp</h3>
            <p>
              {searchQuery
                ? `Không có khóa học nào khớp với từ khóa "${searchQuery}".`
                : 'Giảng viên này hiện chưa có khóa học công khai trên hệ thống.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="public-ins-btn-back"
                onClick={() => setSearchQuery('')}
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="course-grid public-ins-courses-grid">
              {pagedCourses.map((course: Course) => (
                <CourseCard
                  key={course._id || course.id}
                  course={course}
                  onClick={(c) =>
                    navigate(`/courses/${c.slug || c._id || c.id}`)
                  }
                />
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="public-ins-pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                >
                  &laquo; Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => {
                    if (
                      totalPages > 7 &&
                      p !== 1 &&
                      p !== totalPages &&
                      Math.abs(p - page) > 2
                    ) {
                      if (p === 2 || p === totalPages - 1) {
                        return (
                          <span
                            key={p}
                            className="public-ins-pagination-ellipsis"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        type="button"
                        className={p === page ? 'active' : ''}
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 320, behavior: 'smooth' });
                        }}
                      >
                        {p}
                      </button>
                    );
                  },
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 320, behavior: 'smooth' });
                  }}
                >
                  Sau &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
