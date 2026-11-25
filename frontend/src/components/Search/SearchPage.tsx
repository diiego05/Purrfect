import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchCourses,
  fetchCategories,
  defaultCategories,
} from '../../services/courseApi';
import { CourseCard } from '../Courses/CourseCard';
import { IconlySearch, IconlyClose } from '../Onboarding/IconlyIcons';
import type { Course, Category } from '../../types/course';
import './SearchPage.css';

// Helper to extract initial search query from URL
const parseUrlQuery = (path: string): string => {
  try {
    const searchStr = path.includes('?')
      ? path.slice(path.indexOf('?'))
      : window.location.search;
    const params = new URLSearchParams(searchStr);
    return params.get('q') || params.get('search') || '';
  } catch {
    return '';
  }
};

export const SearchPage: React.FC = () => {
  const { navigate, currentPath } = useAuth();

  const [searchTerm, setSearchTerm] = useState<string>(() =>
    parseUrlQuery(currentPath),
  );
  const [debouncedQuery, setDebouncedQuery] = useState<string>(() =>
    parseUrlQuery(currentPath),
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedPrice, setSelectedPrice] = useState<'all' | 'free' | 'paid'>(
    'all',
  );
  const [sortBy, setSortBy] = useState<
    'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
  >('newest');

  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Lazy loading states
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const isInitialMount = useRef(true);

  // Reset lazy load khi filter thay đổi
  useEffect(() => {
    setVisibleCount(6);
  }, [debouncedQuery, selectedCategory, selectedLevel, selectedPrice, sortBy]);

  // Observer cuộn để lazy load thêm khóa học
  useEffect(() => {
    if (visibleCount >= courses.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 6, courses.length));
            setLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '120px' },
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [visibleCount, courses.length, loadingMore]);

  // Sync state if URL query param changes from external navigation (e.g. Header search)
  useEffect(() => {
    const urlQ = parseUrlQuery(currentPath);
    if (!isInitialMount.current) {
      setSearchTerm(urlQ);
      setDebouncedQuery(urlQ);
    }
    isInitialMount.current = false;
  }, [currentPath]);

  // Debounce search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load categories
  useEffect(() => {
    let isMounted = true;
    fetchCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setCategories(cats);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch courses with filters
  useEffect(() => {
    let isMounted = true;

    const loadFilteredCourses = async () => {
      if (isMounted) setLoading(true);

      try {
        const res = await fetchCourses({
          search: debouncedQuery || undefined,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          sort: sortBy,
        });

        if (isMounted) {
          let list = res.courses || [];

          // Local filter for level if specified
          if (selectedLevel !== 'all') {
            list = list.filter((c) => {
              const cLevel = (c.level || '').toLowerCase();
              return cLevel.includes(selectedLevel.toLowerCase());
            });
          }

          // Local filter for price type
          if (selectedPrice === 'free') {
            list = list.filter((c) => !c.price || c.price <= 0);
          } else if (selectedPrice === 'paid') {
            list = list.filter((c) => c.price && c.price > 0);
          }

          setCourses(list);
        }
      } catch (err) {
        console.error('[SearchPage] Lỗi tìm kiếm:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFilteredCourses();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedCategory, selectedLevel, selectedPrice, sortBy]);

  // Handle clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedPrice('all');
    setSortBy('newest');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(debouncedQuery) ||
      selectedCategory !== 'all' ||
      selectedLevel !== 'all' ||
      selectedPrice !== 'all' ||
      sortBy !== 'newest'
    );
  }, [debouncedQuery, selectedCategory, selectedLevel, selectedPrice, sortBy]);

  return (
    <div className="search-page-root">
      {/* 1. Header Hero Banner */}
      <section className="search-header-hero">
        <div className="search-header-container">
          <nav className="search-breadcrumb" aria-label="Breadcrumb">
            <span
              className="search-bread-link"
              onClick={() => navigate('/')}
              role="button"
              tabIndex={0}
            >
              Trang chủ
            </span>
            <span className="search-bread-sep">/</span>
            <span className="search-bread-current">Tìm kiếm khóa học</span>
          </nav>

          <h1 className="search-hero-title">Khám phá tất cả khóa học</h1>
          <p className="search-hero-subtitle">
            Hàng trăm khóa học chuẩn doanh nghiệp, công nghệ mới nhất và lộ
            trình đào tạo thực chiến tại Purrfect
          </p>
        </div>
      </section>

      {/* 2. Main Body: 2-Column Layout with Left Filter Sidebar */}
      <main className="search-main-container">
        <div className="search-layout-wrapper">
          {/* Cột trái: Bộ lọc tìm kiếm & Ô từ khóa */}
          <aside className="search-sidebar-filter" aria-label="Bộ lọc tìm kiếm">
            <div className="search-sidebar-header">
              <h3 className="search-sidebar-title">Bộ lọc tìm kiếm</h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="search-reset-filter-btn"
                  onClick={handleResetFilters}
                  title="Xóa tất cả bộ lọc"
                >
                  <IconlyClose size={13} color="currentColor" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>

            {/* Ô tìm kiếm từ khóa */}
            <div className="search-filter-section">
              <label className="sidebar-filter-heading">Từ khóa tìm kiếm</label>
              <div className="search-sidebar-input-box">
                <span className="search-sidebar-input-icon" aria-hidden="true">
                  <IconlySearch size={16} color="#64748b" />
                </span>
                <input
                  type="text"
                  className="search-sidebar-input"
                  placeholder="Nhập tên khóa, kỹ năng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus={!searchTerm}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchTerm('')}
                    title="Xóa tìm kiếm"
                  >
                    <IconlyClose size={14} color="#94a3b8" />
                  </button>
                )}
              </div>
            </div>

            {/* Bộ lọc Ngành học */}
            <div className="search-filter-section">
              <label
                htmlFor="filter-category"
                className="sidebar-filter-heading"
              >
                Ngành học
              </label>
              <select
                id="filter-category"
                className="filter-select sidebar-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Tất cả ngành học</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bộ lọc Trình độ */}
            <div className="search-filter-section">
              <label htmlFor="filter-level" className="sidebar-filter-heading">
                Trình độ
              </label>
              <select
                id="filter-level"
                className="filter-select sidebar-select"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="all">Tất cả trình độ</option>
                <option value="beginner">Cơ bản (Beginner)</option>
                <option value="intermediate">Trung cấp (Intermediate)</option>
                <option value="advanced">Nâng cao (Advanced)</option>
              </select>
            </div>

            {/* Bộ lọc Học phí */}
            <div className="search-filter-section">
              <label htmlFor="filter-price" className="sidebar-filter-heading">
                Học phí
              </label>
              <select
                id="filter-price"
                className="filter-select sidebar-select"
                value={selectedPrice}
                onChange={(e) =>
                  setSelectedPrice(e.target.value as 'all' | 'free' | 'paid')
                }
              >
                <option value="all">Tất cả mức giá</option>
                <option value="paid">Có phí</option>
                <option value="free">Miễn phí</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="search-filter-section">
              <label htmlFor="filter-sort" className="sidebar-filter-heading">
                Sắp xếp theo
              </label>
              <select
                id="filter-sort"
                className="filter-select sidebar-select"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'newest'
                      | 'popular'
                      | 'rating'
                      | 'price-low'
                      | 'price-high',
                  )
                }
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Phổ biến nhất</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="price-low">Giá: Thấp đến Cao</option>
                <option value="price-high">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </aside>

          {/* Cột phải: Danh sách kết quả khóa học */}
          <div className="search-content-main">
            {/* Thông tin số lượng kết quả */}
            <div className="search-results-meta-line">
              <span className="search-results-count">
                Tìm thấy <strong>{courses.length}</strong> khóa học
                {courses.length > visibleCount && (
                  <span
                    style={{
                      color: '#64748b',
                      fontSize: '13px',
                      marginLeft: '6px',
                    }}
                  >
                    (Đang hiển thị {Math.min(visibleCount, courses.length)}{' '}
                    khóa)
                  </span>
                )}
                {debouncedQuery && (
                  <>
                    {' '}
                    cho từ khóa &quot;<strong>{debouncedQuery}</strong>&quot;
                  </>
                )}
              </span>
            </div>

            {/* 3. Lưới khóa học hoặc trạng thái Loading / Empty */}
            {loading ? (
              <div className="search-courses-grid loading-state">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="search-card-skeleton">
                    <div className="skeleton-img shimmer" />
                    <div className="skeleton-body">
                      <div className="skeleton-line shimmer short" />
                      <div className="skeleton-line shimmer long" />
                      <div className="skeleton-line shimmer medium" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="search-courses-grid">
                  {courses.slice(0, visibleCount).map((course) => (
                    <CourseCard
                      key={course._id || course.slug}
                      course={course}
                      onClick={(c) => navigate(`/courses/${c.slug}`)}
                    />
                  ))}

                  {/* Shimmer skeleton khi đang lazy load thêm */}
                  {loadingMore &&
                    [1, 2, 3].map((i) => (
                      <div
                        key={`lazy-skel-${i}`}
                        className="search-card-skeleton"
                      >
                        <div className="skeleton-img shimmer" />
                        <div className="skeleton-body">
                          <div className="skeleton-line shimmer short" />
                          <div className="skeleton-line shimmer long" />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Trigger cuộn lazy load & nút xem thêm */}
                {visibleCount < courses.length && (
                  <div
                    ref={loadMoreRef}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '28px 0 10px',
                      gap: '10px',
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        padding: '10px 24px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '24px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#0056d2',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s',
                      }}
                      onClick={() =>
                        setVisibleCount((prev) =>
                          Math.min(prev + 6, courses.length),
                        )
                      }
                      disabled={loadingMore}
                    >
                      {loadingMore
                        ? 'Đang tải thêm khóa học...'
                        : `Xem thêm khóa học (còn ${courses.length - visibleCount} khóa)`}
                    </button>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Tự động tải thêm khi cuộn trang
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="search-empty-state">
                <div className="search-empty-icon-wrap">
                  <IconlySearch size={36} color="#0056d2" />
                </div>
                <h3 className="search-empty-title">
                  Không tìm thấy khóa học nào phù hợp
                </h3>
                <p className="search-empty-desc">
                  {debouncedQuery
                    ? `Không có kết quả nào cho "${debouncedQuery}". Bạn thử kiểm tra lỗi chính tả hoặc tìm với từ khóa chung hơn nhé.`
                    : 'Hiện không có khóa học nào khớp với các bộ lọc bạn đã chọn.'}
                </p>
                <div className="search-empty-actions">
                  <button
                    type="button"
                    className="search-empty-btn primary"
                    onClick={handleResetFilters}
                  >
                    Xóa tất cả bộ lọc
                  </button>
                  <button
                    type="button"
                    className="search-empty-btn secondary"
                    onClick={() => navigate('/')}
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
