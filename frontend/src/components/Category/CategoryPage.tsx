import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchCourses, fetchCategories } from '../../services/courseApi';
import { categoryApi } from '../../services/categoryApi';
import { CourseCard } from '../Courses/CourseCard';
import { NotFound } from '../NotFound/NotFound';
import {
  IconlySearch,
  IconlyFolder,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import type { Course, Category } from '../../types/course';
import './CategoryPage.css';

interface CategoryPageProps {
  slug: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const { navigate } = useAuth();

  const [category, setCategory] = useState<{
    name: string;
    slug: string;
    description?: string;
  } | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<
    'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
  >('newest');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load all categories for the horizontal tab switcher
  useEffect(() => {
    let isMounted = true;
    fetchCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setAllCategories(cats);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch category info and courses
  useEffect(() => {
    let isMounted = true;

    const loadCategoryAndCourses = async () => {
      if (isMounted) {
        setLoading(true);
        setNotFound(false);
      }

      try {
        let currentCat: {
          name: string;
          slug: string;
          description?: string;
        } | null = null;

        if (slug === 'all') {
          currentCat = {
            name: 'Tất cả khóa học',
            slug: 'all',
            description:
              'Khám phá toàn bộ các khóa học thực chiến từ cơ bản đến chuyên sâu tại nền tảng Purrfect',
          };
        } else {
          // 1. Lấy thông tin từ categoryApi
          try {
            const catRes = await categoryApi.getCategoryById(slug);
            if (catRes && catRes.success && catRes.data) {
              currentCat = {
                name: catRes.data.name,
                slug: catRes.data.slug,
                description: catRes.data.description,
              };
            }
          } catch {
            // bỏ qua lỗi nếu không gọi được API
          }

          // 2. Dự phòng: tìm trong danh sách categories
          if (!currentCat) {
            const foundInList = allCategories.find((c) => c.slug === slug);
            if (foundInList) {
              currentCat = {
                name: foundInList.name,
                slug: foundInList.slug,
                description: foundInList.description,
              };
            }
          }
        }

        // 3. Nếu vẫn không thấy và allCategories đã tải -> kiểm tra 404
        if (!currentCat) {
          // Thử tải lại danh mục một lần nữa nếu danh sách rỗng
          const cats = await fetchCategories();
          const match = cats.find((c) => c.slug === slug);
          if (match) {
            currentCat = {
              name: match.name,
              slug: match.slug,
              description: match.description,
            };
          } else {
            if (isMounted) {
              setNotFound(true);
              setLoading(false);
            }
            return;
          }
        }

        if (isMounted) {
          setCategory(currentCat);
        }

        // 4. Lấy danh sách khóa học tương ứng
        const coursesRes = await fetchCourses({
          category: slug === 'all' ? undefined : slug,
          search: debouncedSearch || undefined,
          sort: sortBy,
        });

        if (isMounted) {
          setCourses(coursesRes.courses || []);
        }
      } catch (err) {
        console.error('[CategoryPage] Lỗi tải dữ liệu danh mục:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCategoryAndCourses();

    return () => {
      isMounted = false;
    };
  }, [slug, debouncedSearch, sortBy, allCategories]);

  // Handle course click
  const handleCourseClick = (c: Course) => {
    navigate(`/courses/${c.slug}`);
  };

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (notFound) {
    return <NotFound />;
  }

  return (
    <div className="category-page-container">
      {/* 1. Header Banner của Danh mục */}
      <section className="category-header-banner">
        <div className="category-banner-inner">
          <nav className="category-breadcrumb" aria-label="Breadcrumb">
            <span
              className="cat-bread-link"
              onClick={() => navigate('/')}
              role="button"
              tabIndex={0}
            >
              Trang chủ
            </span>
            <span className="cat-bread-sep">/</span>
            <span
              className="cat-bread-link"
              onClick={() => navigate('/category/all')}
              role="button"
              tabIndex={0}
            >
              Danh mục
            </span>
            <span className="cat-bread-sep">/</span>
            <span className="cat-bread-current">
              {category?.name || 'Đang tải danh mục...'}
            </span>
          </nav>

          <div className="category-banner-hero-content">
            <h1 className="category-banner-title">
              {category?.name || 'Khám phá khóa học'}
            </h1>
            <p className="category-banner-desc">
              {category?.description ||
                'Nâng cao kỹ năng chuyên môn với lộ trình đào tạo chuẩn quốc tế, giảng viên giàu kinh nghiệm thực chiến.'}
            </p>
          </div>
        </div>
      </section>

      <div className="category-main-content-wrap">
        {/* 2. Toolbar tìm kiếm, ngành học & sắp xếp */}
        <div className="category-filter-toolbar">
          <div className="cat-search-box">
            <span className="cat-search-icon" aria-hidden="true">
              <IconlySearch size={18} color="#0056d2" />
            </span>
            <input
              type="text"
              className="cat-search-input"
              placeholder={`Tìm khóa học trong "${category?.name || 'danh mục'}"...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cat-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <IconlyClose size={13} color="#94a3b8" />
              </button>
            )}
          </div>

          <div className="cat-filter-controls">
            {/* Chọn ngành học */}
            <div className="cat-sort-box">
              <label htmlFor="cat-category-select" className="cat-sort-label">
                Ngành học:
              </label>
              <select
                id="cat-category-select"
                className="cat-sort-select"
                value={slug}
                onChange={(e) => navigate(`/category/${e.target.value}`)}
              >
                <option value="all">Tất cả ngành học</option>
                {allCategories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sắp xếp theo */}
            <div className="cat-sort-box">
              <label htmlFor="cat-sort-select" className="cat-sort-label">
                Sắp xếp theo:
              </label>
              <select
                id="cat-sort-select"
                className="cat-sort-select"
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
                <option value="price-low">Học phí: Thấp đến Cao</option>
                <option value="price-high">Học phí: Cao đến Thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Trạng thái Loading hoặc Danh sách khóa học */}
        {loading ? (
          <div className="category-courses-grid loading-state">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="cat-card-skeleton">
                <div className="skeleton-img shimmer" />
                <div className="skeleton-info">
                  <div className="skeleton-line shimmer short" />
                  <div className="skeleton-line shimmer long" />
                  <div className="skeleton-line shimmer medium" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="category-courses-grid">
            {courses.map((c) => (
              <CourseCard
                key={c._id || c.slug}
                course={c}
                onClick={handleCourseClick}
              />
            ))}
          </div>
        ) : (
          /* 5. Trạng thái trống (Empty State) */
          <div className="category-empty-state">
            <div className="cat-empty-icon-wrap">
              <IconlyFolder size={36} color="#0056d2" />
            </div>
            <h3 className="cat-empty-title">
              {searchQuery
                ? `Không tìm thấy khóa học khớp với "${searchQuery}"`
                : 'Chưa có khóa học trong danh mục này'}
            </h3>
            <p className="cat-empty-desc">
              {searchQuery
                ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để hiển thị lại tất cả khóa học.'
                : 'Đội ngũ Purrfect đang biên soạn các khóa học mới cho ngành học này. Bạn có thể khám phá thêm các danh mục hấp dẫn khác.'}
            </p>
            <div className="cat-empty-actions">
              {searchQuery ? (
                <button
                  type="button"
                  className="cat-empty-btn primary"
                  onClick={() => setSearchQuery('')}
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              ) : null}
              <button
                type="button"
                className="cat-empty-btn secondary"
                onClick={() => navigate('/category/all')}
              >
                Khám phá tất cả khóa học
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
