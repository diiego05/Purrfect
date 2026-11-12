import { useState, useEffect } from 'react';
import { couponApi } from '../../../services/couponApi';
import type {
  Coupon,
  CouponFormData,
  DiscountType,
} from '../../../types/coupon';
import {
  IconlyDiscount,
  IconlyUserGroup,
  IconlySearch,
  IconlyEdit,
  IconlyDelete,
  IconlyPlus,
  IconlyGraph,
  IconlyBuy,
  IconlyTimeCircle,
  IconlyTick,
  IconlyClose,
  IconlyDocument,
  IconlySetting,
} from '../../Onboarding/IconlyIcons';
import './CouponManagement.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const getTodayFormatted = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getFutureDateFormatted = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const DEFAULT_FORM: CouponFormData = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: 10,
  maxDiscountAmount: 50000,
  minOrderAmount: 0,
  totalUsageLimit: 100,
  validFrom: getTodayFormatted(),
  validTo: getFutureDateFormatted(30),
  isActive: true,
};

let toastCounter = 0;

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | DiscountType>('ALL');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  >('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick Tester Widget State
  const [showTester, setShowTester] = useState(false);
  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState('500000');
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    valid?: boolean;
    message?: string;
    discountAmount?: number;
    finalAmount?: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await couponApi.getAll({
        search,
        discountType: typeFilter,
        status: statusFilter,
      });
      setCoupons(data);
    } catch (err) {
      addToast(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải danh sách mã giảm giá.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await couponApi.getAll({
          search,
          discountType: typeFilter,
          status: statusFilter,
        });
        if (!ignore) {
          setCoupons(data);
        }
      } catch (err) {
        if (!ignore) {
          addToast(
            err instanceof Error
              ? err.message
              : 'Lỗi khi tải danh sách mã giảm giá.',
            'error',
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCoupons();
  };

  // Helper calculation for stats
  const now = new Date();
  const activeCoupons = coupons.filter(
    (c) =>
      c.isActive &&
      new Date(c.validFrom) <= now &&
      new Date(c.validTo) >= now &&
      c.usedCount < c.totalUsageLimit,
  );
  const expiredCoupons = coupons.filter((c) => new Date(c.validTo) < now);
  const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Mã giảm giá không được để trống.';
    } else if (!/^[A-Z0-9_-]{3,30}$/.test(formData.code.trim())) {
      errors.code =
        'Mã chỉ được chứa chữ hoa, số, dấu gạch ngang (3-30 ký tự).';
    }

    const val = Number(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      errors.discountValue = 'Giá trị giảm phải lớn hơn 0.';
    } else if (formData.discountType === 'PERCENT' && val > 100) {
      errors.discountValue = 'Tỷ lệ giảm phần trăm không được vượt quá 100%.';
    }

    if (!formData.validFrom) {
      errors.validFrom = 'Vui lòng chọn ngày bắt đầu.';
    }
    if (!formData.validTo) {
      errors.validTo = 'Vui lòng chọn ngày kết thúc.';
    }

    if (formData.validFrom && formData.validTo) {
      const start = new Date(formData.validFrom);
      const end = new Date(formData.validTo);
      if (end <= start) {
        errors.validTo = 'Ngày hết hạn phải lớn hơn ngày bắt đầu hiệu lực.';
      }
    }

    if (Number(formData.minOrderAmount) < 0) {
      errors.minOrderAmount = 'Giá trị đơn tối thiểu không thể âm.';
    }

    if (Number(formData.totalUsageLimit) < 1) {
      errors.totalUsageLimit = 'Số lượt dùng tối đa phải từ 1 trở lên.';
    }

    if (
      formData.discountType === 'PERCENT' &&
      formData.maxDiscountAmount !== null &&
      formData.maxDiscountAmount !== undefined
    ) {
      if (Number(formData.maxDiscountAmount) < 0) {
        errors.maxDiscountAmount = 'Mức giảm tối đa không thể âm.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Create
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      ...DEFAULT_FORM,
      code: `PROMO${Math.floor(1000 + Math.random() * 9000)}`,
      validFrom: getTodayFormatted(),
      validTo: getFutureDateFormatted(30),
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open Edit
  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      minOrderAmount: coupon.minOrderAmount,
      totalUsageLimit: coupon.totalUsageLimit,
      validFrom: new Date(coupon.validFrom).toISOString().split('T')[0],
      validTo: new Date(coupon.validTo).toISOString().split('T')[0],
      isActive: coupon.isActive,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Generate random code helper
  const generateRandomCode = () => {
    const prefixes = [
      'SALE',
      'LEARN',
      'DISCOUNT',
      'SUPER',
      'VOUCHER',
      'PURRFECT',
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setFormData((f) => ({ ...f, code: `${prefix}${num}` }));
    setFormErrors((e) => ({ ...e, code: '' }));
  };

  // Save Modal
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingCoupon) {
        const updated = await couponApi.update(editingCoupon._id, formData);
        setCoupons((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c)),
        );
        addToast(`Cập nhật mã ${updated.code} thành công!`, 'success');
      } else {
        const created = await couponApi.create(formData);
        setCoupons((prev) => [created, ...prev]);
        addToast(`Tạo mã ${created.code} thành công!`, 'success');
      }
      setShowModal(false);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Lỗi khi lưu mã giảm giá.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggle = async (coupon: Coupon) => {
    try {
      const updated = await couponApi.toggle(coupon._id);
      setCoupons((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
      addToast(
        `Mã ${coupon.code} đã được ${updated.isActive ? 'kích hoạt' : 'tạm dừng'}.`,
        'success',
      );
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Lỗi khi đổi trạng thái.',
        'error',
      );
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await couponApi.delete(deletingId);
      setCoupons((prev) => prev.filter((c) => c._id !== deletingId));
      addToast('Xóa mã giảm giá thành công!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Lỗi khi xóa mã.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Quick Test Coupon
  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) return;

    setTesting(true);
    setTestResult(null);
    try {
      const amount = Number(testAmount) || 0;
      const res = await couponApi.validate(testCode.trim(), amount);
      setTestResult({
        tested: true,
        valid: res.valid,
        message: res.message,
        discountAmount: res.discountAmount,
        finalAmount: res.finalAmount,
      });
    } catch (err) {
      setTestResult({
        tested: true,
        valid: false,
        message: err instanceof Error ? err.message : 'Mã không hợp lệ.',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast(`Đã sao chép mã ${text}!`, 'success');
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' VND';
  };

  return (
    <div className="coupon-container">
      {/* Toast Notifications */}
      <div className="coupon-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`coupon-toast coupon-toast--${t.type}`}>
            <span>
              {t.type === 'success' ? (
                <IconlyTick size={15} color="#10b981" />
              ) : (
                <IconlyClose size={15} color="#ef4444" />
              )}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="coupon-header">
        <div>
          <h1
            className="coupon-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconlyDiscount size={26} color="#3b82f6" />
            <span>Quản lý mã giảm giá</span>
          </h1>
          <p className="coupon-subtitle">
            Khởi tạo các mã coupon khuyến mãi, thiết lập tỷ lệ giảm, thời hạn
            hiệu lực và hạn mức sử dụng.
          </p>
        </div>
        <div className="coupon-header-actions">
          <button
            type="button"
            className="coupon-btn coupon-btn--outline"
            onClick={() => setShowTester(!showTester)}
          >
            {showTester ? 'Đóng kiểm thử' : 'Thử nghiệm mã'}
          </button>
          <button
            type="button"
            className="coupon-btn coupon-btn--primary"
            onClick={handleOpenCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <IconlyPlus size={16} color="#ffffff" />
            <span>Tạo mã giảm giá mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="coupon-stats">
        <div className="coupon-stat-card">
          <span className="coupon-stat-icon">
            <IconlyDiscount size={22} color="#3b82f6" />
          </span>
          <div>
            <div className="coupon-stat-value">{coupons.length}</div>
            <div className="coupon-stat-label">Tổng số mã</div>
          </div>
        </div>
        <div className="coupon-stat-card">
          <span className="coupon-stat-icon">
            <IconlyDiscount size={22} color="#10b981" />
          </span>
          <div>
            <div className="coupon-stat-value">{activeCoupons.length}</div>
            <div className="coupon-stat-label">Đang có hiệu lực</div>
          </div>
        </div>
        <div className="coupon-stat-card">
          <span className="coupon-stat-icon">
            <IconlyTimeCircle size={22} color="#f59e0b" />
          </span>
          <div>
            <div className="coupon-stat-value">{expiredCoupons.length}</div>
            <div className="coupon-stat-label">Đã hết hạn</div>
          </div>
        </div>
        <div className="coupon-stat-card">
          <span className="coupon-stat-icon">
            <IconlyUserGroup size={22} color="#6366f1" />
          </span>
          <div>
            <div className="coupon-stat-value">{totalUsed}</div>
            <div className="coupon-stat-label">Tổng lượt đã dùng</div>
          </div>
        </div>
      </div>

      {/* Quick Tester Widget */}
      {showTester && (
        <div className="coupon-tester-card">
          <div className="coupon-tester-header">
            <h3>Công cụ kiểm thử mã giảm giá (Simulator)</h3>
            <span className="coupon-tester-hint">
              Thử nghiệm xác thực và tính toán số tiền giảm ngay lập tức
            </span>
          </div>
          <form className="coupon-tester-form" onSubmit={handleRunTest}>
            <div className="coupon-tester-inputs">
              <div className="coupon-form-group">
                <label className="coupon-label">Mã coupon</label>
                <input
                  type="text"
                  className="coupon-input"
                  placeholder="VD: SALE20"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="coupon-form-group">
                <label className="coupon-label">Giá trị đơn hàng (VND)</label>
                <input
                  type="number"
                  className="coupon-input"
                  placeholder="500000"
                  value={testAmount}
                  step={10000}
                  min={0}
                  onChange={(e) => setTestAmount(e.target.value)}
                  required
                />
              </div>
              <div className="coupon-tester-btn-wrap">
                <button
                  type="submit"
                  className="coupon-btn coupon-btn--primary"
                  disabled={testing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconlySearch size={15} color="#ffffff" />
                  <span>
                    {testing ? 'Đang kiểm tra...' : 'Kiểm tra áp dụng'}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {testResult && (
            <div
              className={`coupon-test-result ${
                testResult.valid
                  ? 'coupon-test-result--success'
                  : 'coupon-test-result--error'
              }`}
            >
              <div className="coupon-test-result-header">
                <strong>
                  {testResult.valid ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <IconlyTick size={15} color="#10b981" /> Mã hợp lệ!
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <IconlyClose size={15} color="#ef4444" /> Không thể áp
                      dụng:
                    </span>
                  )}
                </strong>{' '}
                {testResult.message}
              </div>
              {testResult.valid && (
                <div className="coupon-test-result-details">
                  <div>
                    Tiền gốc: <span>{formatVND(Number(testAmount))}</span>
                  </div>
                  <div>
                    Giảm giá:{' '}
                    <span className="text-discount">
                      -{formatVND(testResult.discountAmount || 0)}
                    </span>
                  </div>
                  <div>
                    Thành tiền:{' '}
                    <span className="text-final">
                      {formatVND(testResult.finalAmount || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="coupon-filter-bar">
        <form className="coupon-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="coupon-search-input"
            placeholder="Tìm theo mã code hoặc mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="coupon-btn coupon-btn--primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <IconlySearch size={15} color="#ffffff" />
            <span>Tìm</span>
          </button>
          {search && (
            <button
              type="button"
              className="coupon-btn coupon-btn--outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onClick={() => {
                setSearch('');
                couponApi
                  .getAll({ discountType: typeFilter, status: statusFilter })
                  .then(setCoupons);
              }}
            >
              <IconlyClose size={13} color="currentColor" />
              <span>Xóa</span>
            </button>
          )}
        </form>

        <div className="coupon-filters">
          <div className="coupon-filter-item">
            <label>Loại:</label>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'ALL' | DiscountType)
              }
              className="coupon-select"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
            </select>
          </div>

          <div className="coupon-filter-item">
            <label>Trạng thái:</label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED',
                )
              }
              className="coupon-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
              <option value="EXPIRED">Đã hết hạn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupon List / Table */}
      {loading ? (
        <div className="coupon-loading">
          <div className="coupon-spinner"></div>
          <span>Đang tải danh sách mã giảm giá...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="coupon-empty">
          <div
            className="coupon-empty-icon"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <IconlyDiscount size={48} color="#94a3b8" />
          </div>
          <h3>Không tìm thấy mã giảm giá nào</h3>
          <p>
            Hãy nhấn nút &quot;Tạo mã giảm giá mới&quot; để thiết lập mã khuyến
            mãi đầu tiên.
          </p>
        </div>
      ) : (
        <div className="coupon-table-wrapper">
          <table className="coupon-table">
            <thead>
              <tr>
                <th>Mã Coupon</th>
                <th>Mức giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Tiến độ sử dụng</th>
                <th>Thời gian hiệu lực</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const isExpired = new Date(coupon.validTo) < now;
                const isUpcoming = new Date(coupon.validFrom) > now;
                const isLimitReached =
                  coupon.usedCount >= coupon.totalUsageLimit;
                const percentUsed = Math.min(
                  100,
                  Math.round((coupon.usedCount / coupon.totalUsageLimit) * 100),
                );

                return (
                  <tr
                    key={coupon._id}
                    className={
                      !coupon.isActive || isExpired ? 'row--disabled' : ''
                    }
                  >
                    {/* Code & Description */}
                    <td>
                      <div className="coupon-code-cell">
                        <button
                          type="button"
                          className="coupon-code-badge"
                          title="Nhấp để sao chép"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          <strong>{coupon.code}</strong>
                          <span
                            className="copy-icon"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <IconlyDocument size={13} color="currentColor" />
                          </span>
                        </button>
                        {coupon.description && (
                          <div className="coupon-desc-text">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td>
                      <div className="coupon-discount-cell">
                        <span
                          className={`type-tag type-tag--${coupon.discountType.toLowerCase()}`}
                        >
                          {coupon.discountType === 'PERCENT'
                            ? `${coupon.discountValue}%`
                            : formatVND(coupon.discountValue)}
                        </span>
                        {coupon.discountType === 'PERCENT' &&
                        coupon.maxDiscountAmount ? (
                          <span className="coupon-sub-text">
                            Tối đa: {formatVND(coupon.maxDiscountAmount)}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Min Order */}
                    <td>
                      {coupon.minOrderAmount > 0 ? (
                        <span className="coupon-min-order">
                          {formatVND(coupon.minOrderAmount)}
                        </span>
                      ) : (
                        <span className="coupon-sub-text">Không giới hạn</span>
                      )}
                    </td>

                    {/* Usage Progress */}
                    <td>
                      <div className="coupon-usage-cell">
                        <div className="usage-text">
                          <strong>{coupon.usedCount}</strong> /{' '}
                          {coupon.totalUsageLimit} lượt
                        </div>
                        <div className="usage-progress-bar">
                          <div
                            className={`usage-progress-fill ${isLimitReached ? 'usage-progress-fill--full' : ''}`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Validity Window */}
                    <td>
                      <div className="coupon-date-cell">
                        <div>
                          Từ:{' '}
                          <span>
                            {new Date(coupon.validFrom).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        </div>
                        <div>
                          Đến:{' '}
                          <span>
                            {new Date(coupon.validTo).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        </div>
                        {isExpired ? (
                          <span className="badge-tag badge-tag--expired">
                            Hết hạn
                          </span>
                        ) : isUpcoming ? (
                          <span className="badge-tag badge-tag--upcoming">
                            Chưa bắt đầu
                          </span>
                        ) : (
                          <span className="badge-tag badge-tag--valid">
                            Còn hạn
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <div className="coupon-status-cell">
                        <label
                          className="coupon-toggle"
                          title={
                            coupon.isActive ? 'Đang kích hoạt' : 'Đang tạm dừng'
                          }
                        >
                          <input
                            type="checkbox"
                            checked={coupon.isActive}
                            onChange={() => handleToggle(coupon)}
                          />
                          <span className="coupon-toggle-slider"></span>
                        </label>
                        <span
                          className={`status-label ${coupon.isActive ? 'status-label--active' : 'status-label--inactive'}`}
                        >
                          {coupon.isActive ? 'Kích hoạt' : 'Tắt'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="coupon-actions-cell">
                        <button
                          type="button"
                          className="coupon-btn-sm coupon-btn--outline"
                          onClick={() => handleOpenEdit(coupon)}
                          title="Chỉnh sửa mã"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <IconlyEdit size={14} color="currentColor" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          className="coupon-btn-sm coupon-btn--test"
                          onClick={() => {
                            setTestCode(coupon.code);
                            setShowTester(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          title="Thử áp dụng mã này"
                        >
                          Thử
                        </button>
                        <button
                          type="button"
                          className="coupon-btn-sm coupon-btn--danger"
                          onClick={() => setDeletingId(coupon._id)}
                          title="Xóa mã"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconlyDelete size={14} color="currentColor" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Thêm / Chỉnh sửa Coupon ──────────────────────────── */}
      {showModal && (
        <div
          className="coupon-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="coupon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h3>
                {editingCoupon
                  ? 'Chỉnh sửa mã giảm giá'
                  : 'Tạo mã giảm giá mới'}
              </h3>
              <button
                type="button"
                className="coupon-modal-close"
                onClick={() => setShowModal(false)}
              >
                <IconlyClose size={16} color="currentColor" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="coupon-modal-body">
                {/* Code Field with Randomizer */}
                <div className="coupon-form-group">
                  <div className="coupon-label-row">
                    <label className="coupon-label">
                      Mã Coupon <span className="coupon-required">*</span>
                    </label>
                    {!editingCoupon && (
                      <button
                        type="button"
                        className="btn-link"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={generateRandomCode}
                      >
                        <IconlySetting size={13} color="#3b82f6" />
                        <span>Tạo mã ngẫu nhiên</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className={`coupon-input ${formErrors.code ? 'coupon-input--error' : ''}`}
                    placeholder="VD: SUMMER2026, DISCOUNT50"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      });
                      setFormErrors({ ...formErrors, code: '' });
                    }}
                    autoFocus
                  />
                  {formErrors.code && (
                    <span className="coupon-error-msg">{formErrors.code}</span>
                  )}
                  <span className="coupon-hint">
                    Mã viết hoa không dấu, duy nhất toàn hệ thống.
                  </span>
                </div>

                {/* Description */}
                <div className="coupon-form-group">
                  <label className="coupon-label">Mô tả / Tên chiến dịch</label>
                  <input
                    type="text"
                    className="coupon-input"
                    placeholder="VD: Khuyến mãi mừng hè 2026 cho học viên mới"
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Discount Type Selector */}
                <div className="coupon-form-group">
                  <label className="coupon-label">
                    Loại giảm giá <span className="coupon-required">*</span>
                  </label>
                  <div className="discount-type-selector">
                    <label
                      className={`type-option ${formData.discountType === 'PERCENT' ? 'type-option--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="discountType"
                        value="PERCENT"
                        checked={formData.discountType === 'PERCENT'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            discountType: 'PERCENT',
                            discountValue: 10,
                          })
                        }
                      />
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <IconlyGraph size={16} color="currentColor" />
                        <span>Theo phần trăm (%)</span>
                      </span>
                    </label>
                    <label
                      className={`type-option ${formData.discountType === 'FIXED_AMOUNT' ? 'type-option--selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="discountType"
                        value="FIXED_AMOUNT"
                        checked={formData.discountType === 'FIXED_AMOUNT'}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            discountType: 'FIXED_AMOUNT',
                            discountValue: 50000,
                            maxDiscountAmount: null,
                          })
                        }
                      />
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <IconlyBuy size={16} color="currentColor" />
                        <span>Số tiền cố định (VND)</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Value & Max Discount */}
                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-label">
                      {formData.discountType === 'PERCENT'
                        ? 'Phần trăm giảm (%)'
                        : 'Số tiền giảm (VND)'}
                      <span className="coupon-required">*</span>
                    </label>
                    <input
                      type="number"
                      className={`coupon-input ${formErrors.discountValue ? 'coupon-input--error' : ''}`}
                      min={formData.discountType === 'PERCENT' ? 1 : 1000}
                      max={
                        formData.discountType === 'PERCENT' ? 100 : undefined
                      }
                      step={formData.discountType === 'PERCENT' ? 1 : 1000}
                      value={formData.discountValue}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          discountValue: Number(e.target.value),
                        });
                        setFormErrors({ ...formErrors, discountValue: '' });
                      }}
                    />
                    {formErrors.discountValue && (
                      <span className="coupon-error-msg">
                        {formErrors.discountValue}
                      </span>
                    )}
                  </div>

                  {formData.discountType === 'PERCENT' && (
                    <div className="coupon-form-group">
                      <label className="coupon-label">
                        Mức giảm tối đa (VND)
                      </label>
                      <input
                        type="number"
                        className={`coupon-input ${formErrors.maxDiscountAmount ? 'coupon-input--error' : ''}`}
                        placeholder="Để trống nếu không giới hạn"
                        min={0}
                        step={1000}
                        value={formData.maxDiscountAmount ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                            ? Number(e.target.value)
                            : null;
                          setFormData({ ...formData, maxDiscountAmount: val });
                          setFormErrors({
                            ...formErrors,
                            maxDiscountAmount: '',
                          });
                        }}
                      />
                      {formErrors.maxDiscountAmount && (
                        <span className="coupon-error-msg">
                          {formErrors.maxDiscountAmount}
                        </span>
                      )}
                      <span className="coupon-hint">
                        Giới hạn số tiền giảm tối đa.
                      </span>
                    </div>
                  )}
                </div>

                {/* Min Order & Total Usage Limit */}
                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-label">
                      Đơn hàng tối thiểu (VND)
                    </label>
                    <input
                      type="number"
                      className={`coupon-input ${formErrors.minOrderAmount ? 'coupon-input--error' : ''}`}
                      min={0}
                      step={10000}
                      value={formData.minOrderAmount}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          minOrderAmount: Number(e.target.value),
                        });
                        setFormErrors({ ...formErrors, minOrderAmount: '' });
                      }}
                    />
                    {formErrors.minOrderAmount && (
                      <span className="coupon-error-msg">
                        {formErrors.minOrderAmount}
                      </span>
                    )}
                    <span className="coupon-hint">
                      0 = Không giới hạn đơn tối thiểu
                    </span>
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-label">
                      Tổng số lượt dùng tối đa{' '}
                      <span className="coupon-required">*</span>
                    </label>
                    <input
                      type="number"
                      className={`coupon-input ${formErrors.totalUsageLimit ? 'coupon-input--error' : ''}`}
                      min={1}
                      value={formData.totalUsageLimit}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          totalUsageLimit: Number(e.target.value),
                        });
                        setFormErrors({ ...formErrors, totalUsageLimit: '' });
                      }}
                    />
                    {formErrors.totalUsageLimit && (
                      <span className="coupon-error-msg">
                        {formErrors.totalUsageLimit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-label">
                      Ngày bắt đầu hiệu lực{' '}
                      <span className="coupon-required">*</span>
                    </label>
                    <input
                      type="date"
                      className={`coupon-input ${formErrors.validFrom ? 'coupon-input--error' : ''}`}
                      value={formData.validFrom}
                      onChange={(e) => {
                        setFormData({ ...formData, validFrom: e.target.value });
                        setFormErrors({ ...formErrors, validFrom: '' });
                      }}
                    />
                    {formErrors.validFrom && (
                      <span className="coupon-error-msg">
                        {formErrors.validFrom}
                      </span>
                    )}
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-label">
                      Ngày hết hạn <span className="coupon-required">*</span>
                    </label>
                    <input
                      type="date"
                      className={`coupon-input ${formErrors.validTo ? 'coupon-input--error' : ''}`}
                      value={formData.validTo}
                      onChange={(e) => {
                        setFormData({ ...formData, validTo: e.target.value });
                        setFormErrors({ ...formErrors, validTo: '' });
                      }}
                    />
                    {formErrors.validTo && (
                      <span className="coupon-error-msg">
                        {formErrors.validTo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Is Active Toggle */}
                <div className="coupon-form-group">
                  <label className="coupon-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <span>Kích hoạt mã giảm giá ngay sau khi lưu</span>
                  </label>
                </div>
              </div>

              <div className="coupon-modal-footer">
                <button
                  type="button"
                  className="coupon-btn coupon-btn--outline"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="coupon-btn coupon-btn--primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    'Đang lưu...'
                  ) : editingCoupon ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconlyTick size={15} color="#ffffff" />
                      <span>Cập nhật mã</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconlyPlus size={15} color="#ffffff" />
                      <span>Kích hoạt mã</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Xác nhận xóa ─────────────────────────────────────── */}
      {deletingId && (
        <div
          className="coupon-modal-overlay"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="coupon-modal coupon-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="coupon-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconlyDelete size={20} color="#ef4444" />
                <span>Xác nhận xóa mã giảm giá</span>
              </h3>
            </div>
            <div className="coupon-modal-body">
              <p>
                Bạn có chắc chắn muốn xóa mã giảm giá này khỏi hệ thống không?
                Hành động này sẽ không thể khôi phục.
              </p>
            </div>
            <div className="coupon-modal-footer">
              <button
                type="button"
                className="coupon-btn coupon-btn--outline"
                onClick={() => setDeletingId(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="coupon-btn coupon-btn--danger"
                onClick={handleDelete}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
