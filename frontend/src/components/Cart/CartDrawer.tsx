import React, { useEffect } from 'react';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import {
  IconlyBuy,
  IconlyHeart,
  IconlyDelete,
  IconlyClose,
  IconlyTick,
} from '../Onboarding/IconlyIcons';
import type { Course } from '../../types/course';
import './CartDrawer.css';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    cartCount,
    totalAmount,
    isCartOpen,
    closeCart,
    removeFromCart,
    clearCart,
    moveToWishlist,
  } = useCartWishlist();

  const { navigate } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleGoToCourse = (slug: string) => {
    closeCart();
    navigate(`/courses/${slug}`);
  };

  const handleCheckoutSingle = (course: Course) => {
    closeCart();
    navigate(`/checkout/${course.slug || course._id}`);
  };

  const handleCheckoutAll = () => {
    closeCart();
    if (cartItems.length > 0 && cartItems[0]?.courseId) {
      const c = cartItems[0].courseId;
      navigate(`/checkout/${c.slug || c._id}`);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <>
      <div className="cart-drawer-backdrop" onClick={closeCart} />
      <aside className="cart-drawer-panel" aria-label="Giỏ hàng">
        <header className="cart-drawer-header">
          <div className="cart-drawer-title-group">
            <span className="cart-drawer-icon">
              <IconlyBuy size={22} color="#2563eb" />
            </span>
            <h2 className="cart-drawer-title">Giỏ hàng</h2>
            <span className="cart-drawer-badge">{cartCount}</span>
          </div>
          <button
            type="button"
            className="cart-drawer-close-btn"
            onClick={closeCart}
            aria-label="Đóng giỏ hàng"
          >
            <IconlyClose size={18} color="#64748b" />
          </button>
        </header>

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-drawer-empty">
              <div className="cart-empty-icon-circle">
                <IconlyBuy size={44} color="#94a3b8" />
              </div>
              <h3>Giỏ hàng của bạn đang trống</h3>
              <p>
                Khám phá hàng trăm khóa học lập trình, thiết kế, kinh doanh và
                AI chất lượng cao ngay hôm nay!
              </p>
              <button
                type="button"
                className="cart-explore-btn"
                onClick={() => {
                  closeCart();
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
            <ul className="cart-item-list">
              {cartItems.map((item) => {
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
                  <li key={item._id || courseId} className="cart-item-card">
                    <div
                      className="cart-item-thumb-wrapper"
                      onClick={() => handleGoToCourse(c.slug)}
                    >
                      <img
                        src={
                          c.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80'
                        }
                        alt={c.title}
                        className="cart-item-thumb"
                      />
                    </div>

                    <div className="cart-item-info">
                      <h4
                        className="cart-item-title"
                        onClick={() => handleGoToCourse(c.slug)}
                        title={c.title}
                      >
                        {c.title}
                      </h4>

                      <div className="cart-item-meta">
                        {c.level && (
                          <span className="cart-item-level">{c.level}</span>
                        )}
                        {c.durationText && (
                          <span className="cart-item-duration">
                            • {c.durationText}
                          </span>
                        )}
                      </div>

                      <div className="cart-item-pricing">
                        <span className="cart-item-current-price">
                          {formatVND(effectivePrice)}
                        </span>
                        {hasDiscount && (
                          <span className="cart-item-original-price">
                            {formatVND(c.price)}
                          </span>
                        )}
                      </div>

                      <div className="cart-item-actions">
                        <button
                          type="button"
                          className="cart-action-btn cart-action-buy-now"
                          onClick={() => handleCheckoutSingle(c)}
                        >
                          Mua ngay
                        </button>
                        <button
                          type="button"
                          className="cart-action-btn cart-action-wishlist"
                          onClick={() => moveToWishlist(c)}
                          title="Chuyển vào danh sách yêu thích"
                        >
                          <IconlyHeart size={14} color="#64748b" />
                          <span>Lưu sau</span>
                        </button>
                        <button
                          type="button"
                          className="cart-action-btn cart-action-delete"
                          onClick={() => removeFromCart(courseId)}
                          title="Xóa khỏi giỏ hàng"
                        >
                          <IconlyDelete size={14} color="#ef4444" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className="cart-drawer-footer">
            <div className="cart-drawer-summary">
              <div className="cart-summary-row">
                <span className="cart-summary-label">
                  Tổng cộng ({cartCount} khóa học):
                </span>
                <span className="cart-summary-total">
                  {formatVND(totalAmount)}
                </span>
              </div>
              <p
                className="cart-guarantee-note"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <IconlyTick size={13} color="#10b981" />
                <span>Truy cập trọn đời • Bảo hành hoàn tiền 30 ngày</span>
              </p>
            </div>

            <div className="cart-drawer-buttons">
              <button
                type="button"
                className="cart-checkout-btn"
                onClick={handleCheckoutAll}
              >
                Tiến hành thanh toán
              </button>
              <button
                type="button"
                className="cart-clear-btn"
                onClick={clearCart}
              >
                Xóa tất cả
              </button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
};
