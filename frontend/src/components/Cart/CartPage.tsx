import React from 'react';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import {
  IconlyBuy,
  IconlyDelete,
  IconlyShield,
  IconlyAward,
  IconlyTimeCircle,
  IconlyStar,
} from '../Onboarding/IconlyIcons';
import './CartPage.css';

export const CartPage: React.FC = () => {
  const { cartItems, cartCount, totalAmount, removeFromCart, clearCart } =
    useCartWishlist();

  const { navigate } = useAuth();

  const handleCheckoutAll = () => {
    if (cartItems.length > 0 && cartItems[0]?.courseId) {
      const c = cartItems[0].courseId;
      navigate(`/checkout/${c.slug || c._id}`);
    } else {
      navigate('/checkout');
    }
  };

  const handleGoToCourse = (slug: string) => {
    navigate(`/courses/${slug}`);
  };

  return (
    <div className="cart-page-wrapper">
      <div className="cart-page-container">
        {/* Breadcrumb */}
        <nav className="cart-breadcrumb" aria-label="Breadcrumb">
          <span className="cart-breadcrumb-link" onClick={() => navigate('/')}>
            Trang chủ
          </span>
          <span className="cart-breadcrumb-separator">/</span>
          <span className="cart-breadcrumb-current">Giỏ hàng của bạn</span>
        </nav>

        {/* Page Header */}
        <header className="cart-page-header">
          <div className="cart-page-title-group">
            <h1 className="cart-page-title">Giỏ hàng của bạn</h1>
            <span className="cart-page-count-badge">{cartCount} khóa học</span>
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              className="cart-page-clear-all-btn"
              onClick={clearCart}
            >
              <IconlyDelete size={16} color="#ef4444" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </header>

        {cartItems.length === 0 ? (
          <div className="cart-page-empty-state">
            <div className="cart-page-empty-icon-circle">
              <IconlyBuy size={56} color="#94a3b8" />
            </div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>
              Bạn chưa có khóa học nào trong giỏ hàng. Hãy khám phá hàng trăm
              khóa học chất lượng cao trên Purrfect để bắt đầu hành trình nâng
              cao kỹ năng!
            </p>
            <button
              type="button"
              className="cart-page-explore-btn"
              onClick={() => navigate('/')}
            >
              Khám phá khóa học ngay
            </button>
          </div>
        ) : (
          <div className="cart-page-layout-grid">
            {/* Cột trái: Danh sách khóa học */}
            <div className="cart-page-items-col">
              <ul className="cart-page-list">
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

                  const instructorName =
                    typeof c.instructorId === 'object' && c.instructorId?.name
                      ? c.instructorId.name
                      : 'Purrfect Academy';

                  return (
                    <li
                      key={item._id || courseId}
                      className="cart-page-item-card"
                    >
                      <div
                        className="cart-page-item-thumb-box"
                        onClick={() => handleGoToCourse(c.slug)}
                      >
                        <img
                          src={
                            c.thumbnailUrl ||
                            '/assets/advanced_digital_skills.jpg'
                          }
                          alt={c.title}
                          className="cart-page-item-img"
                        />
                      </div>

                      <div className="cart-page-item-content">
                        <div className="cart-page-item-main-info">
                          <h3
                            className="cart-page-item-title"
                            onClick={() => handleGoToCourse(c.slug)}
                          >
                            {c.title}
                          </h3>

                          <p className="cart-page-item-instructor">
                            Giảng viên: <span>{instructorName}</span>
                          </p>

                          <div className="cart-page-item-meta-tags">
                            {c.level && (
                              <span className="cart-meta-tag tag-level">
                                {c.level}
                              </span>
                            )}
                            {c.durationText && (
                              <span className="cart-meta-tag tag-duration">
                                <IconlyTimeCircle size={13} color="#64748b" />
                                {c.durationText}
                              </span>
                            )}
                            {c.averageRating ? (
                              <span className="cart-meta-tag tag-rating">
                                <IconlyStar size={13} color="#f59e0b" />
                                <span>{c.averageRating.toFixed(1)}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="cart-page-item-price-col">
                          <div className="cart-page-current-price">
                            {formatVND(effectivePrice)}
                          </div>
                          {hasDiscount && (
                            <div className="cart-page-original-price">
                              {formatVND(c.price)}
                            </div>
                          )}
                        </div>

                        <div className="cart-page-item-actions-row">
                          <button
                            type="button"
                            className="cart-page-action-btn action-remove"
                            onClick={() => removeFromCart(courseId)}
                          >
                            <IconlyDelete size={15} color="#ef4444" />
                            <span>Xóa khỏi giỏ</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Cột phải: Bảng thanh toán tổng quan */}
            <aside className="cart-page-summary-col">
              <div className="cart-page-summary-card">
                <h2 className="summary-card-title">Tóm tắt đơn hàng</h2>

                <div className="summary-price-line">
                  <span className="summary-label">Số lượng khóa học:</span>
                  <span className="summary-value">{cartCount}</span>
                </div>

                <div className="summary-price-line">
                  <span className="summary-label">Tổng học phí:</span>
                  <span className="summary-value">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-line">
                  <span className="summary-total-label">Tổng thanh toán:</span>
                  <span className="summary-total-price">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  className="cart-page-checkout-btn"
                  onClick={handleCheckoutAll}
                >
                  Tiến hành thanh toán
                </button>

                <p className="cart-checkout-subnote">
                  Thanh toán an toàn qua cổng VNPAY / Thẻ ATM & Thẻ quốc tế
                </p>

                <div className="cart-page-perks-box">
                  <h4 className="perks-box-title">Cam kết từ Purrfect:</h4>
                  <ul className="perks-box-list">
                    <li>
                      <IconlyShield size={16} color="#059669" />
                      <span>Bảo đảm hoàn tiền 100% trong 7 ngày</span>
                    </li>
                    <li>
                      <IconlyAward size={16} color="#2563eb" />
                      <span>Chứng chỉ tốt nghiệp xác thực sau hoàn thành</span>
                    </li>
                    <li>
                      <IconlyTimeCircle size={16} color="#d97706" />
                      <span>Truy cập bài giảng và tài nguyên trọn đời</span>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
