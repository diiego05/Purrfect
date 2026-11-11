import React, { useEffect } from 'react';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import {
  IconlyHeart,
  IconlyBuy,
  IconlyDelete,
  IconlyStar,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import './WishlistDrawer.css';

export const WishlistDrawer: React.FC = () => {
  const {
    wishlistItems,
    wishlistCount,
    isWishlistOpen,
    closeWishlist,
    toggleWishlist,
    moveToCart,
    openCart,
  } = useCartWishlist();

  const { navigate } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWishlistOpen) {
        closeWishlist();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWishlistOpen, closeWishlist]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isWishlistOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isWishlistOpen]);

  if (!isWishlistOpen) return null;

  const handleGoToCourse = (slug: string) => {
    closeWishlist();
    navigate(`/courses/${slug}`);
  };

  return (
    <>
      <div className="wishlist-drawer-backdrop" onClick={closeWishlist} />
      <aside className="wishlist-drawer-panel" aria-label="Khóa học yêu thích">
        <header className="wishlist-drawer-header">
          <div className="wishlist-drawer-title-group">
            <span className="wishlist-drawer-icon">
              <IconlyHeart size={22} color="#e11d48" />
            </span>
            <h2 className="wishlist-drawer-title">Khóa học yêu thích</h2>
            <span className="wishlist-drawer-badge">{wishlistCount}</span>
          </div>
          <button
            type="button"
            className="wishlist-drawer-close-btn"
            onClick={closeWishlist}
            aria-label="Đóng danh sách yêu thích"
          >
            <IconlyClose size={18} color="#64748b" />
          </button>
        </header>

        <div className="wishlist-drawer-body">
          {wishlistItems.length === 0 ? (
            <div className="wishlist-drawer-empty">
              <div className="wishlist-empty-icon-circle">
                <IconlyHeart size={44} color="#f43f5e" />
              </div>
              <h3>Chưa có khóa học yêu thích nào</h3>
              <p>
                Nhấn biểu tượng trái tim ở khóa học bạn quan tâm để lưu lại và
                xem sau bất kỳ lúc nào!
              </p>
              <button
                type="button"
                className="wishlist-explore-btn"
                onClick={() => {
                  closeWishlist();
                  const el =
                    document.getElementById('for-you') ||
                    document.querySelector('.course-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Khám phá khóa học ngay
              </button>
            </div>
          ) : (
            <ul className="wishlist-item-list">
              {wishlistItems.map((item) => {
                const c = item.courseId;
                if (!c) return null;
                const courseId = c._id || c.id || '';
                const hasDiscount =
                  c.discountPrice &&
                  c.discountPrice > 0 &&
                  c.discountPrice < c.price;
                const effectivePrice = hasDiscount
                  ? (c.discountPrice as number)
                  : c.price;

                return (
                  <li key={item._id || courseId} className="wishlist-item-card">
                    <div
                      className="wishlist-item-thumb-wrapper"
                      onClick={() => handleGoToCourse(c.slug)}
                    >
                      <img
                        src={
                          c.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80'
                        }
                        alt={c.title}
                        className="wishlist-item-thumb"
                      />
                    </div>

                    <div className="wishlist-item-info">
                      <h4
                        className="wishlist-item-title"
                        onClick={() => handleGoToCourse(c.slug)}
                        title={c.title}
                      >
                        {c.title}
                      </h4>

                      <div className="wishlist-item-meta">
                        {c.level && (
                          <span className="wishlist-item-level">{c.level}</span>
                        )}
                        {c.averageRating ? (
                          <span className="wishlist-item-rating">
                            <IconlyStar size={12} color="#f59e0b" />
                            <span>{c.averageRating.toFixed(1)}</span>
                          </span>
                        ) : null}
                      </div>

                      <div className="wishlist-item-pricing">
                        <span className="wishlist-item-current-price">
                          {formatVND(effectivePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="wishlist-item-original-price">
                            {formatVND(c.price)}
                          </span>
                        )}
                      </div>

                      <div className="wishlist-item-actions">
                        <button
                          type="button"
                          className="wishlist-action-btn wishlist-action-add-cart"
                          onClick={async () => {
                            await moveToCart(c);
                            closeWishlist();
                            openCart();
                          }}
                        >
                          <IconlyBuy size={15} color="#2563eb" />
                          <span>Thêm vào giỏ</span>
                        </button>
                        <button
                          type="button"
                          className="wishlist-action-btn wishlist-action-delete"
                          onClick={() => toggleWishlist(c)}
                          title="Bỏ khỏi yêu thích"
                        >
                          <IconlyDelete size={14} color="#94a3b8" />
                          <span>Bỏ thích</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};
