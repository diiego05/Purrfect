import { useState, type FC, type FormEvent } from 'react';
import type { Course } from '../../types/course';
import { formatVND } from '../../utils/format';
import { paymentApi } from '../../services/paymentApi';
import {
  IconlyStar,
  IconlyTimeCircle,
  IconlyAward,
  IconlyTick,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import './CheckoutModal.css';

interface CheckoutModalProps {
  course: Course;
  onClose: () => void;
  onSuccessFreeEnrollment?: () => void;
}

export const CheckoutModal: FC<CheckoutModalProps> = ({
  course,
  onClose,
  onSuccessFreeEnrollment,
}) => {
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

  // Giá tính toán ban đầu
  const originalPrice =
    course.discountPrice &&
    course.discountPrice > 0 &&
    course.discountPrice < course.price
      ? course.discountPrice
      : course.price;

  const currentFinalAmount = appliedCoupon
    ? appliedCoupon.finalAmount
    : originalPrice;

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
        code: couponCode.trim().toUpperCase(),
        discountAmount: res.discountAmount || 0,
        finalAmount: res.finalAmount,
      });
      setCouponFeedback({
        type: 'success',
        message: res.message || 'Áp dụng mã giảm giá thành công!',
      });
    } else {
      setAppliedCoupon(null);
      setCouponFeedback({
        type: 'error',
        message: res.message || 'Mã giảm giá không hợp lệ.',
      });
    }
  };

  const handleProceedPayment = async () => {
    if (!course._id) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await paymentApi.createPaymentUrl({
        courseId: course._id,
        couponCode: appliedCoupon?.code,
      });

      if (res.isFree && res.success) {
        // Đăng ký thành công khóa học miễn phí
        onSuccessFreeEnrollment?.();
        onClose();
        return;
      }

      if (res.success && res.paymentUrl) {
        // Chuyển hướng sang cổng thanh toán VNPAY
        window.location.href = res.paymentUrl;
      } else {
        setErrorMessage(
          res.message ||
            'Không thể tạo phiên thanh toán VNPAY. Vui lòng thử lại.',
        );
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Lỗi kết nối máy chủ thanh toán.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" onClick={onClose}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-modal-header">
          <h3 className="checkout-modal-title">Xác nhận thanh toán khóa học</h3>
          <button
            type="button"
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IconlyClose size={18} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        <div className="checkout-modal-body">
          {/* Course Preview */}
          <div className="checkout-course-preview">
            <img
              src={course.thumbnailUrl || '/assets/advanced_digital_skills.jpg'}
              alt={course.title}
              className="checkout-course-thumb"
            />
            <div className="checkout-course-info">
              <h4 className="checkout-course-title" title={course.title}>
                {course.title}
              </h4>
              <div className="checkout-course-meta">
                <span className="meta-item">
                  <IconlyStar size={13} color="#f59e0b" />
                  <span>{course.averageRating || '4.8'}</span>
                </span>
                <span className="meta-item">
                  <IconlyTimeCircle size={13} color="#64748b" />
                  <span>
                    {course.durationText || `${course.durationHours || 15}h`}
                  </span>
                </span>
                <span className="meta-item">
                  <IconlyAward size={13} color="#64748b" />
                  <span>{course.level || 'Cơ bản'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Code Input */}
          <form className="checkout-coupon-box" onSubmit={handleApplyCoupon}>
            <label className="checkout-coupon-label">
              Mã ưu đãi / Giảm giá
            </label>
            <div className="checkout-coupon-input-group">
              <input
                type="text"
                className="checkout-coupon-input"
                placeholder="NHẬP MÃ GIẢM GIÁ..."
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                className="btn-apply-coupon"
                disabled={!couponCode.trim() || isCheckingCoupon}
              >
                {isCheckingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </div>
            {couponFeedback && (
              <div className={`coupon-feedback ${couponFeedback.type}`}>
                {couponFeedback.type === 'success' ? (
                  <IconlyTick size={14} color="#10b981" />
                ) : (
                  <IconlyClose size={14} color="#ef4444" />
                )}
                <span>{couponFeedback.message}</span>
              </div>
            )}
          </form>

          {/* Pricing Summary */}
          <div className="checkout-pricing-summary">
            <div className="pricing-row">
              <span>Học phí niêm yết:</span>
              <span>{formatVND(originalPrice)}</span>
            </div>

            {appliedCoupon && appliedCoupon.discountAmount > 0 && (
              <div className="pricing-row discount-row">
                <span>Mã giảm giá:</span>
                <span>- {formatVND(appliedCoupon.discountAmount)}</span>
              </div>
            )}

            <div className="pricing-row total-row">
              <span>Số tiền thanh toán:</span>
              <span className="pricing-total-val">
                {formatVND(currentFinalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="checkout-gateway-section">
            <div className="checkout-gateway-card">
              <div className="vnpay-badge-icon">VNPAY</div>
              <div className="gateway-info">
                <div className="gateway-name">Cổng thanh toán VNPAY</div>
                <div className="gateway-desc">
                  Quét mã VNPAY-QR, Thẻ ATM nội địa (NCB, Vietcombank,...) & Thẻ
                  quốc tế
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div
              className="coupon-feedback error"
              style={{ fontSize: '0.9rem' }}
            >
              <IconlyClose size={14} color="#ef4444" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="checkout-modal-footer">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn-modal-submit-vnpay"
            onClick={handleProceedPayment}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Đang kết nối VNPAY...</>
            ) : (
              <>
                <span>Thanh toán {formatVND(currentFinalAmount)}</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
