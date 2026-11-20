import React, { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { fetchCourseBySlug } from '../../services/courseApi';
import { paymentApi } from '../../services/paymentApi';
import { formatVND } from '../../utils/format';
import { toast } from '../../context/ToastContext';
import {
  IconlyShield,
  IconlyAward,
  IconlyTimeCircle,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import type { Course } from '../../types/course';
import './CheckoutPage.css';

interface CheckoutPageProps {
  courseParam?: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ courseParam }) => {
  const { navigate, isAuthenticated } = useAuth();
  const {
    cartItems,
    totalAmount: cartTotalAmount,
    removeFromCart,
  } = useCartWishlist();

  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState<boolean>(
    Boolean(courseParam),
  );

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const selectedBank = '';

  // Load single course if param is provided
  useEffect(() => {
    let isMounted = true;
    if (courseParam) {
      fetchCourseBySlug(courseParam).then((data) => {
        if (isMounted) {
          setCourse(data);
          setLoadingCourse(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [courseParam]);

  // Compute pricing
  const singlePrice = course
    ? course.discountPrice &&
      course.discountPrice > 0 &&
      course.discountPrice < course.price
      ? course.discountPrice
      : course.price
    : 0;

  const originalPrice = course ? singlePrice : cartTotalAmount;

  const currentFinalAmount = appliedCoupon
    ? appliedCoupon.finalAmount
    : originalPrice;

  // Apply Coupon
  const handleApplyCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsCheckingCoupon(true);
    setCouponFeedback(null);

    const res = await paymentApi.validateCoupon(
      couponCode.trim(),
      originalPrice,
    );
    setIsCheckingCoupon(false);

    if (res.valid && res.finalAmount !== undefined) {
      setAppliedCoupon({
        code: res.coupon?.code || couponCode.trim().toUpperCase(),
        discountAmount: res.discountAmount || 0,
        finalAmount: res.finalAmount,
      });
      setCouponFeedback({
        type: 'success',
        message: `Áp dụng mã ${res.coupon?.code || couponCode} thành công! Giảm ${formatVND(res.discountAmount || 0)}.`,
      });
    } else {
      setCouponFeedback({
        type: 'error',
        message: res.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
      });
    }
  };

  // Submit payment: Chuyển hướng trực tiếp toàn trang sang Cổng VNPAY (không popup modal)
  const handleSubmitPayment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const targetCourseId =
      course?._id || course?.id || cartItems[0]?.courseId?._id;
    if (!targetCourseId) {
      setErrorMessage('Không tìm thấy thông tin khóa học để thanh toán.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Khóa học miễn phí (hoặc coupon 100%)
      if (currentFinalAmount <= 0) {
        const res = await paymentApi.directCheckout({
          courseId: targetCourseId,
          couponCode: appliedCoupon?.code,
          paymentMethod: 'FREE',
        });
        if (res.success) {
          if (course?._id) removeFromCart(course._id);
          toast.success(res.message || 'Đăng ký khóa học miễn phí thành công!');
          navigate(`/learning/${course?.slug || targetCourseId}`);
        } else {
          setErrorMessage(res.message || 'Không thể đăng ký khóa học.');
        }
        setIsSubmitting(false);
        return;
      }

      // 2. Tạo phiên thanh toán và chuyển hướng sang Cổng VNPAY
      const res = await paymentApi.createPaymentUrl({
        courseId: targetCourseId,
        couponCode: appliedCoupon?.code,
        paymentMethod: 'VNPAY',
        bankCode: selectedBank || undefined,
      });

      if (res.success && res.paymentUrl) {
        if (course?._id) removeFromCart(course._id);
        // Chuyển hướng trực tiếp sang VNPAY
        window.location.href = res.paymentUrl;
      } else {
        setErrorMessage(
          res.message || 'Không thể khởi tạo liên kết thanh toán VNPAY.',
        );
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi kết nối tới cổng VNPAY.',
      );
      setIsSubmitting(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="checkout-page-loading">
        <div className="checkout-loading-spinner" />
        <p>Đang chuẩn bị thông tin thanh toán...</p>
      </div>
    );
  }

  // If no course specified and cart is empty
  if (!course && cartItems.length === 0) {
    return (
      <div className="checkout-page-empty">
        <h2>Không có đơn hàng nào cần thanh toán</h2>
        <p>
          Vui lòng chọn khóa học hoặc thêm vào giỏ hàng trước khi thanh toán.
        </p>
        <button
          type="button"
          className="checkout-btn-back"
          onClick={() => navigate('/')}
        >
          Khám phá khóa học ngay
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-page-container">
        {/* Breadcrumb */}
        <nav className="checkout-breadcrumb" aria-label="Breadcrumb">
          <span
            className="checkout-breadcrumb-link"
            onClick={() => navigate('/')}
          >
            Trang chủ
          </span>
          <span className="checkout-breadcrumb-separator">/</span>
          <span
            className="checkout-breadcrumb-link"
            onClick={() => navigate('/cart')}
          >
            Giỏ hàng
          </span>
          <span className="checkout-breadcrumb-separator">/</span>
          <span className="checkout-breadcrumb-current">
            Thanh toán đơn hàng
          </span>
        </nav>

        <h1 className="checkout-page-heading">Thanh toán đơn hàng</h1>

        <div className="checkout-page-grid">
          {/* Cột trái: Thông tin khóa học & Phương thức thanh toán */}
          <div className="checkout-main-col">
            {/* Khóa học thanh toán */}
            <section className="checkout-section-card">
              <h2 className="section-card-title">Khóa học thanh toán</h2>
              {course ? (
                <div className="checkout-course-preview">
                  <img
                    src={
                      course.thumbnailUrl ||
                      '/assets/advanced_digital_skills.jpg'
                    }
                    alt={course.title}
                    className="checkout-course-thumb"
                  />
                  <div className="checkout-course-details">
                    <h3 className="checkout-course-title">{course.title}</h3>
                    <div className="checkout-course-meta">
                      {course.level && (
                        <span className="meta-badge">{course.level}</span>
                      )}
                      {course.durationText && (
                        <span className="meta-duration">
                          {course.durationText}
                        </span>
                      )}
                    </div>
                    <div className="checkout-course-price">
                      {formatVND(singlePrice)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="checkout-cart-items-preview">
                  <p className="checkout-items-count-text">
                    Đơn hàng gồm <strong>{cartItems.length} khóa học</strong>:
                  </p>
                  <ul className="checkout-cart-preview-list">
                    {cartItems.map((item) => (
                      <li key={item._id} className="preview-cart-row">
                        <span className="preview-title">
                          {item.courseId.title}
                        </span>
                        <span className="preview-price">
                          {formatVND(item.courseId.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Phương thức thanh toán */}
            <section className="checkout-section-card">
              <h2 className="section-card-title">Phương thức thanh toán</h2>

              <div className="checkout-payment-methods">
                <label className="checkout-method-option active">
                  <input
                    type="radio"
                    name="paymentMethodRadio"
                    checked={true}
                    readOnly
                  />
                  <div className="method-option-info">
                    <div className="method-option-header">
                      <strong>Cổng thanh toán VNPAY</strong>
                      <span className="badge-recommend">Chính thức</span>
                    </div>
                    <p className="method-option-desc">
                      Hỗ trợ quét mã VNPAY-QR, Thẻ nội địa (ATM), Internet
                      Banking và Thẻ quốc tế Visa/MasterCard.
                    </p>
                  </div>
                </label>
              </div>

              <div className="vnpay-sandbox-card-info">
                <div className="info-title">
                  💳 Thông tin thẻ thử nghiệm VNPAY Sandbox:
                </div>
                <div className="info-grid">
                  <div>
                    <span>Ngân hàng:</span> <strong>NCB</strong>
                  </div>
                  <div>
                    <span>Số thẻ:</span> <strong>9704198526191432198</strong>
                  </div>
                  <div>
                    <span>Tên chủ thẻ:</span> <strong>NGUYEN VAN A</strong>
                  </div>
                  <div>
                    <span>Ngày phát hành:</span> <strong>07/15</strong>
                  </div>
                  <div>
                    <span>Mã OTP:</span> <strong>123456</strong>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Cột phải: Tóm tắt chi phí & Nút thanh toán */}
          <aside className="checkout-summary-col">
            <div className="checkout-summary-box">
              <h2 className="summary-box-title">Chi tiết thanh toán</h2>

              {/* Nhập mã giảm giá */}
              <form
                className="checkout-coupon-form"
                onSubmit={handleApplyCoupon}
              >
                <label className="coupon-form-label">
                  Mã ưu đãi / Giảm giá
                </label>
                <div className="coupon-input-group">
                  <input
                    type="text"
                    className="coupon-text-input"
                    placeholder="NHẬP MÃ GIẢM GIÁ..."
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                  />
                  <button
                    type="submit"
                    className="coupon-apply-btn"
                    disabled={!couponCode.trim() || isCheckingCoupon}
                  >
                    {isCheckingCoupon ? '...' : 'Áp dụng'}
                  </button>
                </div>
                {couponFeedback && (
                  <div className={`coupon-msg ${couponFeedback.type}`}>
                    {couponFeedback.message}
                  </div>
                )}
              </form>

              <div className="summary-breakdown">
                <div className="breakdown-line">
                  <span>Học phí niêm yết:</span>
                  <span>{formatVND(originalPrice)}</span>
                </div>

                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <div className="breakdown-line discount-line">
                    <span>Mã giảm giá:</span>
                    <span>- {formatVND(appliedCoupon.discountAmount)}</span>
                  </div>
                )}

                <div className="breakdown-divider" />

                <div className="breakdown-total-line">
                  <span>Tổng thanh toán:</span>
                  <span className="total-highlight">
                    {formatVND(currentFinalAmount)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div
                  className="checkout-error-banner"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconlyClose size={14} color="#ef4444" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                className="checkout-confirm-btn"
                disabled={isSubmitting}
                onClick={handleSubmitPayment}
              >
                {isSubmitting ? 'Đang chuyển hướng VNPAY...' : 'Thanh toán'}
              </button>

              <div className="checkout-trust-perks">
                <div className="trust-perk-item">
                  <IconlyShield size={17} color="#059669" />
                  <span>Hoàn tiền 100% trong 7 ngày</span>
                </div>
                <div className="trust-perk-item">
                  <IconlyAward size={17} color="#2563eb" />
                  <span>Cấp chứng chỉ tốt nghiệp xác thực</span>
                </div>
                <div className="trust-perk-item">
                  <IconlyTimeCircle size={17} color="#d97706" />
                  <span>Truy cập trọn đời trên mọi thiết bị</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
