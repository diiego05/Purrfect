import React from 'react';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
  const { language } = useLanguage();

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
            {language === 'vi' ? 'Trang chủ' : 'Home'}
          </span>
          <span className="cart-breadcrumb-separator">/</span>
          <span className="cart-breadcrumb-current">
            {language === 'vi' ? 'Giỏ hàng của bạn' : 'Your Shopping Cart'}
          </span>
        </nav>

        {/* Page Header */}
        <header className="cart-page-header">
          <div className="cart-page-title-group">
            <h1 className="cart-page-title">
              {language === 'vi' ? 'Giỏ hàng của bạn' : 'Your Shopping Cart'}
            </h1>
            <span className="cart-page-count-badge">
              {cartCount} {language === 'vi' ? 'khóa học' : 'courses'}
            </span>
          </div>

          {cartCount > 0 && (
            <button
              type="button"
              className="cart-page-clear-btn"
              onClick={clearCart}
              title={
                language === 'vi'
                  ? 'Xóa toàn bộ giỏ hàng'
                  : 'Clear all cart items'
              }
            >
              <IconlyDelete size={16} color="#ef4444" />
              <span>{language === 'vi' ? 'Xóa tất cả' : 'Clear All'}</span>
            </button>
          )}
        </header>

        {/* Main Content Area */}
        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="cart-page-empty-state">
            <div className="cart-page-empty-icon-circle">
              <IconlyBuy size={56} color="#0056d2" />
            </div>
            <h2>
              {language === 'vi'
                ? 'Giỏ hàng của bạn đang trống'
                : 'Your shopping cart is empty'}
            </h2>
            <p>
              {language === 'vi'
                ? 'Hãy khám phá hàng trăm khóa học hấp dẫn và bổ sung vào giỏ hàng để bắt đầu hành trình nâng cao kỹ năng của bạn ngay hôm nay!'
                : 'Explore hundreds of practical courses and add them to your cart to level up your career today!'}
            </p>
            <button
              type="button"
              className="cart-page-explore-btn"
              onClick={() => navigate('/')}
            >
              {language === 'vi'
                ? 'Khám phá khóa học ngay'
                : 'Browse Courses Now'}
            </button>
          </div>
        ) : (
          /* Cart List & Summary Layout */
          <div className="cart-page-grid-layout">
            {/* Cột trái: Danh sách khóa học */}
            <div className="cart-page-items-col">
              <ul className="cart-page-items-list">
                {cartItems.map((item) => {
                  const c = item.courseId;
                  if (!c) return null;
                  const hasDiscount =
                    c.discountPrice &&
                    c.discountPrice > 0 &&
                    c.discountPrice < c.price;
                  const effectivePrice = hasDiscount
                    ? (c.discountPrice as number)
                    : c.price;

                  const courseId = c._id || c.id || '';
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
                        className="cart-page-item-thumb"
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
                            {language === 'vi' ? 'Giảng viên:' : 'Instructor:'}{' '}
                            <span>{instructorName}</span>
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
                            <span>
                              {language === 'vi' ? 'Xóa khỏi giỏ' : 'Remove'}
                            </span>
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
                <h2 className="summary-card-title">
                  {language === 'vi' ? 'Tóm tắt đơn hàng' : 'Order Summary'}
                </h2>

                <div className="summary-price-line">
                  <span className="summary-label">
                    {language === 'vi'
                      ? 'Số lượng khóa học:'
                      : 'Courses count:'}
                  </span>
                  <span className="summary-value">{cartCount}</span>
                </div>

                <div className="summary-price-line">
                  <span className="summary-label">
                    {language === 'vi' ? 'Tổng học phí:' : 'Subtotal:'}
                  </span>
                  <span className="summary-value">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-line">
                  <span className="summary-total-label">
                    {language === 'vi' ? 'Tổng thanh toán:' : 'Total Amount:'}
                  </span>
                  <span className="summary-total-price">
                    {formatVND(totalAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  className="cart-page-checkout-btn"
                  onClick={handleCheckoutAll}
                >
                  {language === 'vi'
                    ? 'Tiến hành thanh toán'
                    : 'Proceed to Checkout'}
                </button>

                <p className="cart-checkout-subnote">
                  {language === 'vi'
                    ? 'Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách hoàn tiền của Purrfect.'
                    : 'By proceeding, you agree to Purrfect Terms of Service and Refund Policy.'}
                </p>

                {/* Trust Badges */}
                <div className="cart-trust-badges">
                  <div className="trust-badge-item">
                    <IconlyShield size={16} color="#16a34a" />
                    <span>
                      {language === 'vi'
                        ? 'Bảo mật thanh toán VNPAY SSL'
                        : 'VNPAY SSL Secure Payment'}
                    </span>
                  </div>
                  <div className="trust-badge-item">
                    <IconlyAward size={16} color="#0056d2" />
                    <span>
                      {language === 'vi'
                        ? 'Cấp chứng chỉ tốt nghiệp xác thực'
                        : 'Verified Certificate on Completion'}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
