import React from 'react';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import {
  IconlyHeart,
  IconlyDelete,
  IconlyTimeCircle,
  IconlyStar,
} from '../Onboarding/IconlyIcons';
import './WishlistPage.css';

export const WishlistPage: React.FC = () => {
  const { wishlistItems, wishlistCount, toggleWishlist } = useCartWishlist();

  const { navigate } = useAuth();

  const handleGoToCourse = (slug: string) => {
    navigate(`/courses/${slug}`);
  };

  return (
    <div className="wishlist-page-wrapper">
      <div className="wishlist-page-container">
        {/* Breadcrumb */}
        <nav className="wishlist-breadcrumb" aria-label="Breadcrumb">
          <span
            className="wishlist-breadcrumb-link"
            onClick={() => navigate('/')}
          >
            Trang chủ
          </span>
          <span className="wishlist-breadcrumb-separator">/</span>
          <span className="wishlist-breadcrumb-current">
            Khóa học yêu thích
          </span>
        </nav>

        {/* Page Header */}
        <header className="wishlist-page-header">
          <div className="wishlist-page-title-group">
            <h1 className="wishlist-page-title">Khóa học yêu thích</h1>
            <span className="wishlist-page-count-badge">
              {wishlistCount} khóa học
            </span>
          </div>
        </header>

        {wishlistItems.length === 0 ? (
          <div className="wishlist-page-empty-state">
            <div className="wishlist-page-empty-icon-circle">
              <IconlyHeart size={56} color="#e11d48" />
            </div>
            <h2>Chưa có khóa học yêu thích nào</h2>
            <p>
              Nhấn biểu tượng trái tim ở bất kỳ khóa học nào bạn quan tâm để lưu
              vào danh sách và tiện theo dõi học tập sau này!
            </p>
            <button
              type="button"
              className="wishlist-page-explore-btn"
              onClick={() => navigate('/')}
            >
              Khám phá khóa học ngay
            </button>
          </div>
        ) : (
          <div className="wishlist-page-grid">
            {wishlistItems.map((item) => {
              const c = item.courseId;
              if (!c) return null;
              const hasDiscount =
                c.discountPrice &&
                c.discountPrice > 0 &&
                c.discountPrice < c.price;
              const effectivePrice = hasDiscount
                ? (c.discountPrice as number)
                : c.price;

              const instructorName =
                typeof c.instructorId === 'object' && c.instructorId?.name
                  ? c.instructorId.name
                  : 'Purrfect Academy';

              return (
                <div key={item._id || c._id} className="wishlist-card">
                  <div
                    className="wishlist-card-thumb-wrap"
                    onClick={() => handleGoToCourse(c.slug)}
                  >
                    <img
                      src={
                        c.thumbnailUrl || '/assets/advanced_digital_skills.jpg'
                      }
                      alt={c.title}
                      className="wishlist-card-img"
                    />
                    <button
                      type="button"
                      className="wishlist-remove-fav-btn"
                      title="Bỏ khỏi danh sách yêu thích"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(c);
                      }}
                    >
                      <IconlyHeart size={18} color="#e11d48" />
                    </button>
                  </div>

                  <div className="wishlist-card-body">
                    <div className="wishlist-card-meta-line">
                      {c.level && (
                        <span className="wishlist-meta-level">{c.level}</span>
                      )}
                      {c.averageRating ? (
                        <span className="wishlist-meta-rating">
                          <IconlyStar size={12} color="#f59e0b" />
                          <span>{c.averageRating.toFixed(1)}</span>
                        </span>
                      ) : null}
                      {c.durationText && (
                        <span className="wishlist-meta-duration">
                          <IconlyTimeCircle size={12} color="#64748b" />
                          {c.durationText}
                        </span>
                      )}
                    </div>

                    <h3
                      className="wishlist-card-title"
                      onClick={() => handleGoToCourse(c.slug)}
                    >
                      {c.title}
                    </h3>

                    <p className="wishlist-card-instructor">{instructorName}</p>

                    <div className="wishlist-card-price-row">
                      <span className="wishlist-current-price">
                        {formatVND(effectivePrice)}
                      </span>
                      {hasDiscount && (
                        <span className="wishlist-original-price">
                          {formatVND(c.price)}
                        </span>
                      )}
                    </div>

                    <div className="wishlist-card-actions">
                      <button
                        type="button"
                        className="wishlist-buy-now-btn"
                        onClick={() => navigate(`/checkout/${c.slug || c._id}`)}
                      >
                        Học ngay
                      </button>

                      <button
                        type="button"
                        className="wishlist-delete-btn"
                        title="Xóa khỏi yêu thích"
                        onClick={() => toggleWishlist(c)}
                      >
                        <IconlyDelete size={16} color="#94a3b8" />
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
