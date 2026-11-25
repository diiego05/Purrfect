import React, { useState, useEffect, useCallback } from 'react';
import type { InstructorCourse } from '../../types/instructorCourse';
import type { Coupon } from '../../types/coupon';
import { couponApi } from '../../services/couponApi';
import { toast } from '../../context/ToastContext';
import { IconlyClose, IconlyPlus } from '../Onboarding/IconlyIcons';
import './CourseCouponsModal.css';

interface CourseCouponsModalProps {
  course: InstructorCourse;
  onClose: () => void;
}

export const CourseCouponsModal: React.FC<CourseCouponsModalProps> = ({
  course,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [maxCoupons, setMaxCoupons] = useState<number>(5);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const courseId = course._id;

  const loadCoupons = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await couponApi.getInstructorCourseCoupons(courseId);
      setCoupons(res.coupons || []);
      setMaxCoupons(res.maxCoupons || 5);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách mã giảm giá.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    toast.success(`Đã sao chép mã ${couponCode}!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    const trimmedCode = code.trim().toUpperCase();
    const regex = /^[A-Z0-9]{4,20}$/;
    if (!regex.test(trimmedCode)) {
      toast.warning(
        'Mã giảm giá chỉ gồm chữ cái in hoa và số, từ 4-20 ký tự (Ví dụ: PURR10, HOCNHANH).',
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await couponApi.createInstructorCourseCoupon(courseId, {
        code: trimmedCode,
        description: description.trim() || undefined,
        totalUsageLimit: 5, // Mỗi mã sử dụng tối đa 5 lần
      });

      toast.success(res.message || 'Tạo mã giảm giá 10% thành công!');
      setCode('');
      setDescription('');
      setShowAddForm(false);
      loadCoupons();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Lỗi khi tạo mã giảm giá.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId: string, couponCode: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa mã giảm giá "${couponCode}" không?`,
      )
    ) {
      return;
    }

    try {
      await couponApi.deleteInstructorCourseCoupon(couponId);
      toast.success('Xóa mã giảm giá thành công!');
      loadCoupons();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Lỗi khi xóa mã giảm giá.';
      toast.error(msg);
    }
  };

  return (
    <div className="course-coupons-backdrop" onClick={onClose}>
      <div
        className="course-coupons-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="course-coupons-header">
          <div className="course-coupons-title-group">
            <span className="coupons-badge-icon">🎟️</span>
            <div>
              <h3>Mã giảm giá khóa học</h3>
              <p className="coupons-course-name">{course.title}</p>
            </div>
          </div>
          <button
            className="btn-close-modal"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IconlyClose size={20} />
          </button>
        </div>

        {/* Quota info banner */}
        <div className="coupons-quota-banner">
          <div className="quota-pill">
            <span className="quota-label">Hạn mức mã:</span>
            <span className="quota-val">
              {coupons.length} / {maxCoupons} mã
            </span>
          </div>
          <div className="quota-rule">
            📌 Mỗi khóa học được tạo <strong>tối đa 5 mã giảm giá 10%</strong>.
            Mỗi mã chỉ được sử dụng <strong>tối đa 5 lần</strong>. Giảng viên tự
            đặt tên mã theo quy định nền tảng (4-20 ký tự, chữ hoa & số).
          </div>
        </div>

        {/* Action bar */}
        <div className="coupons-action-bar">
          <span className="coupons-count-text">
            Danh sách mã đã tạo ({coupons.length}/{maxCoupons})
          </span>
          {coupons.length < maxCoupons && !showAddForm && (
            <button
              className="btn-open-create-coupon"
              onClick={() => setShowAddForm(true)}
            >
              <IconlyPlus size={16} /> Tạo mã mới (-10%)
            </button>
          )}
        </div>

        {/* Add Coupon Form */}
        {showAddForm && (
          <form className="create-coupon-card" onSubmit={handleCreateCoupon}>
            <div className="create-coupon-header">
              <h4>Tạo mã giảm giá mới</h4>
              <button
                type="button"
                className="btn-cancel-create"
                onClick={() => setShowAddForm(false)}
              >
                Hủy
              </button>
            </div>

            <div className="create-coupon-grid">
              <div className="form-group">
                <label>
                  Mã giảm giá <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: PURR10, PYTHON10..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={20}
                  required
                />
                <span className="form-hint">
                  Chữ cái in hoa và số, 4 - 20 ký tự.
                </span>
              </div>

              <div className="form-group">
                <label>Mức giảm giá</label>
                <div className="fixed-discount-box">
                  <span className="discount-tag">Giảm 10%</span>
                  <span className="fixed-hint">(Cố định theo quy định)</span>
                </div>
              </div>

              <div className="form-group">
                <label>Số lượt sử dụng tối đa</label>
                <div className="fixed-discount-box">
                  <span
                    className="discount-tag"
                    style={{ background: '#2563eb' }}
                  >
                    5 lượt dùng
                  </span>
                  <span className="fixed-hint">(Cố định theo quy định)</span>
                </div>
              </div>

              <div className="form-group full-width">
                <label>Mô tả / Ghi chú (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Dành riêng cho học viên đăng ký sớm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="create-coupon-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Đóng
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !code.trim()}
              >
                {submitting ? 'Đang tạo...' : 'Xác nhận tạo mã'}
              </button>
            </div>
          </form>
        )}

        {/* Coupons List */}
        <div className="coupons-list-wrapper">
          {loading ? (
            <div className="coupons-loading">Đang tải mã giảm giá...</div>
          ) : coupons.length === 0 ? (
            <div className="coupons-empty">
              <div className="empty-icon">🎟️</div>
              <p>Chưa có mã giảm giá nào cho khóa học này.</p>
              {coupons.length < maxCoupons && (
                <button
                  className="btn-create-first"
                  onClick={() => setShowAddForm(true)}
                >
                  Tạo mã giảm giá đầu tiên (Giảm 10%)
                </button>
              )}
            </div>
          ) : (
            <div className="coupons-grid">
              {coupons.map((c) => {
                const isExpired = new Date(c.validTo) < new Date();
                const isMaxUsed = c.usedCount >= c.totalUsageLimit;
                return (
                  <div
                    key={c._id}
                    className={`coupon-item-card ${
                      isExpired || isMaxUsed || !c.isActive
                        ? 'inactive'
                        : 'active'
                    }`}
                  >
                    <div className="coupon-item-top">
                      <div className="coupon-code-pill">
                        <span className="code-text">{c.code}</span>
                        <button
                          type="button"
                          className="btn-copy-code"
                          title="Sao chép mã"
                          onClick={() => handleCopyCode(c.code)}
                        >
                          {copiedCode === c.code ? '✓ Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                      <span className="discount-badge">-10%</span>
                    </div>

                    {c.description && (
                      <p className="coupon-desc">{c.description}</p>
                    )}

                    <div className="coupon-stats">
                      <div className="stat-row">
                        <span>Lượt dùng:</span>
                        <strong>
                          {c.usedCount} / {c.totalUsageLimit}
                        </strong>
                      </div>
                      <div className="stat-row">
                        <span>Hạn dùng:</span>
                        <span>
                          {new Date(c.validTo).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>Trạng thái:</span>
                        <span
                          className={`status-chip ${
                            !c.isActive
                              ? 'disabled'
                              : isExpired
                                ? 'expired'
                                : isMaxUsed
                                  ? 'used'
                                  : 'live'
                          }`}
                        >
                          {!c.isActive
                            ? 'Tạm dừng'
                            : isExpired
                              ? 'Hết hạn'
                              : isMaxUsed
                                ? 'Hết lượt'
                                : 'Hoạt động'}
                        </span>
                      </div>
                    </div>

                    <div className="coupon-footer">
                      <button
                        className="btn-delete-coupon"
                        onClick={() => handleDeleteCoupon(c._id, c.code)}
                        title="Xóa mã"
                      >
                        🗑️ Xóa mã
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
