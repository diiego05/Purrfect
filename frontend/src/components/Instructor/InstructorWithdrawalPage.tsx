import React, { useState, useEffect, useCallback } from 'react';
import { withdrawalApi } from '../../services/withdrawalApi';
import type {
  InstructorBalanceData,
  WithdrawalRequestItem,
  OrderClearanceItem,
} from '../../services/withdrawalApi';
import {
  IconlyWallet,
  IconlyTick,
  IconlyTimeCircle,
  IconlyRefresh,
  IconlyDocument,
  IconlyShield,
} from '../Onboarding/IconlyIcons';
import { toast } from '../../context/ToastContext';
import './InstructorWithdrawalPage.css';

export const InstructorWithdrawalPage: React.FC = () => {
  const [balanceData, setBalanceData] = useState<InstructorBalanceData | null>(
    null,
  );
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState<boolean>(false);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // History Tabs & Orders pagination
  const [activeHistoryTab, setActiveHistoryTab] = useState<
    'WITHDRAWALS' | 'CLEARANCE'
  >('WITHDRAWALS');
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const ordersPageSize = 8;
  const clearanceList = balanceData?.orderClearanceDetails || [];
  const totalOrdersPages =
    Math.ceil((clearanceList.length || 0) / ordersPageSize) || 1;
  const pagedClearanceList = clearanceList.slice(
    (ordersPage - 1) * ordersPageSize,
    ordersPage * ordersPageSize,
  );

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await withdrawalApi.getInstructorBalance();
      if (res && res.data) {
        setBalanceData(res.data);
        setWithdrawals(res.data.withdrawals || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu rút tiền:', err);
      toast.error('Không thể tải dữ liệu số dư & rút tiền');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTick]);

  const handleWithdrawAll = () => {
    if (!balanceData) return;
    const available = balanceData.availableBalance || 0;
    if (available < (balanceData.minWithdrawal || 200000)) {
      toast.warning(
        `Số dư khả dụng (${formatVND(available)}) chưa đạt hạn mức rút tối thiểu (${formatVND(balanceData.minWithdrawal || 200000)}).`,
      );
      return;
    }
    setWithdrawAmount(String(available));
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    const min = balanceData?.minWithdrawal || 200000;
    const available = balanceData?.availableBalance || 0;

    if (!amountNum || amountNum <= 0) {
      toast.error('Vui lòng nhập số tiền rút hợp lệ.');
      return;
    }
    if (amountNum < min) {
      toast.error(`Số tiền rút tối thiểu là ${formatVND(min)}.`);
      return;
    }
    if (amountNum > available) {
      toast.error(
        `Số tiền rút không được vượt quá số dư khả dụng (${formatVND(available)}).`,
      );
      return;
    }
    if (!bankName.trim() || !bankAccount.trim() || !accountHolder.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin ngân hàng và số tài khoản.');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await withdrawalApi.createWithdrawalRequest({
        amount: amountNum,
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
        notes: withdrawNotes.trim(),
        qrCodeUrl: qrCodeUrl.trim(),
      });

      toast.success(
        res.message ||
          'Yêu cầu rút tiền đã được gửi thành công đến Quản trị viên!',
      );
      setWithdrawAmount('');
      setWithdrawNotes('');
      setQrCodeUrl('');
      setRefreshTick((prev) => prev + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu rút tiền.',
      );
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const totalPages = Math.ceil((withdrawals.length || 0) / pageSize) || 1;
  const pagedWithdrawals = withdrawals.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="wp-badge wp-badge-pending">Chờ Admin duyệt</span>
        );
      case 'APPROVED':
        return (
          <span className="wp-badge wp-badge-approved">Đã chuyển khoản</span>
        );
      case 'REJECTED':
        return <span className="wp-badge wp-badge-rejected">Đã từ chối</span>;
      default:
        return <span className="wp-badge">{status}</span>;
    }
  };

  const getClearanceBadge = (item: OrderClearanceItem) => {
    switch (item.status) {
      case 'PENDING_CLEARANCE':
        return (
          <span className="wp-badge wp-badge-pending-escrow">
            ⏳ Tạm giữ (Còn {item.daysRemaining} ngày)
          </span>
        );
      case 'CLEARED':
        return (
          <span className="wp-badge wp-badge-cleared">✅ Khả dụng rút</span>
        );
      case 'REFUND_PENDING':
        return (
          <span className="wp-badge wp-badge-refund-pending">
            ⚠️ Chờ duyệt hoàn tiền
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="wp-badge wp-badge-refunded">↩️ Đã hoàn tiền</span>
        );
      default:
        return (
          <span className="wp-badge">{item.statusLabel || item.status}</span>
        );
    }
  };

  return (
    <div className="instructor-withdrawal-container">
      {/* Top action bar */}
      <div className="wp-top-bar">
        <div>
          <h1 className="wp-page-title">Quản lý Doanh thu & Rút tiền</h1>
          <p className="wp-page-desc">
            Theo dõi tổng doanh thu giảng dạy, số dư thực tế khả dụng và thực
            hiện yêu cầu rút tiền về tài khoản ngân hàng
          </p>
        </div>
        <button
          type="button"
          className="wp-btn-refresh"
          onClick={() => setRefreshTick((prev) => prev + 1)}
          disabled={loading}
        >
          <IconlyRefresh size={16} color="currentColor" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="wp-kpi-grid">
        <div className="wp-kpi-card total-rev">
          <div className="wp-kpi-icon">
            <IconlyDocument size={22} color="#0056d2" />
          </div>
          <div className="wp-kpi-meta">
            <span className="wp-kpi-label">Tổng doanh thu tích lũy</span>
            <strong className="wp-kpi-value">
              {formatVND(balanceData?.totalRevenue || 0)}
            </strong>
            <span className="wp-kpi-sub">
              Từ {balanceData?.ordersCount || 0} đơn thanh toán
            </span>
          </div>
        </div>

        <div className="wp-kpi-card escrow">
          <div className="wp-kpi-icon">
            <IconlyTimeCircle size={22} color="#d97706" />
          </div>
          <div className="wp-kpi-meta">
            <span className="wp-kpi-label">Đang tạm giữ bảo lưu (Pending)</span>
            <strong className="wp-kpi-value amber">
              {formatVND(balanceData?.pendingClearanceAmount || 0)}
            </strong>
            <span className="wp-kpi-sub">
              {balanceData?.pendingOrdersCount || 0} đơn vừa bán (chờ 14
              ngày/học xong)
            </span>
          </div>
        </div>

        <div className="wp-kpi-card available">
          <div className="wp-kpi-icon">
            <IconlyWallet size={22} color="#16a34a" />
          </div>
          <div className="wp-kpi-meta">
            <span className="wp-kpi-label">Số dư khả dụng có thể rút</span>
            <strong className="wp-kpi-value green">
              {formatVND(balanceData?.availableBalance || 0)}
            </strong>
            <span className="wp-kpi-sub">
              Đã mở khóa từ {balanceData?.clearedOrdersCount || 0} đơn hàng
            </span>
          </div>
        </div>

        <div className="wp-kpi-card approved">
          <div className="wp-kpi-icon">
            <IconlyTick size={22} color="#6366f1" />
          </div>
          <div className="wp-kpi-meta">
            <span className="wp-kpi-label">Đã rút thành công</span>
            <strong className="wp-kpi-value purple">
              {formatVND(balanceData?.approvedWithdrawalAmount || 0)}
            </strong>
            <span className="wp-kpi-sub">
              Đã chuyển vào tài khoản ngân hàng
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Form rút tiền + Lịch sử rút tiền */}
      <div className="wp-content-layout">
        {/* Cột trái: Form tạo yêu cầu rút tiền */}
        <div className="wp-form-card">
          <div className="wp-card-header">
            <IconlyWallet size={20} color="#0056d2" />
            <h2>Tạo yêu cầu rút tiền mới</h2>
          </div>

          <form onSubmit={handleSubmitWithdrawal} className="wp-form">
            <div className="wp-form-group">
              <div className="wp-label-row">
                <label htmlFor="withdrawAmount">
                  Số tiền muốn rút (VNĐ) <span className="req">*</span>
                </label>
                <button
                  type="button"
                  className="wp-btn-link-all"
                  onClick={handleWithdrawAll}
                >
                  Rút toàn bộ
                </button>
              </div>
              <input
                id="withdrawAmount"
                type="number"
                placeholder={`Tối thiểu ${formatVND(balanceData?.minWithdrawal || 200000)}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={balanceData?.minWithdrawal || 200000}
                max={balanceData?.availableBalance || 0}
                required
              />
              <span className="wp-input-hint">
                Khả dụng:{' '}
                <strong>{formatVND(balanceData?.availableBalance || 0)}</strong>
              </span>
            </div>

            <div className="wp-form-group">
              <label htmlFor="bankName">
                Ngân hàng thụ hưởng <span className="req">*</span>
              </label>
              <input
                id="bankName"
                type="text"
                placeholder="Ví dụ: Vietcombank, MB Bank, ACB..."
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="wp-form-group">
              <label htmlFor="bankAccount">
                Số tài khoản ngân hàng <span className="req">*</span>
              </label>
              <input
                id="bankAccount"
                type="text"
                placeholder="Ví dụ: 1012345678"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                required
              />
            </div>

            <div className="wp-form-group">
              <label htmlFor="accountHolder">
                Tên chủ tài khoản (viết hoa không dấu){' '}
                <span className="req">*</span>
              </label>
              <input
                id="accountHolder"
                type="text"
                placeholder="Ví dụ: NGUYEN VAN A"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="wp-form-group">
              <label htmlFor="qrUpload">
                Mã QR chuyển khoản ngân hàng (tùy chọn)
              </label>
              <div className="wp-qr-upload-box">
                {qrCodeUrl ? (
                  <div className="wp-qr-preview-wrap">
                    <img
                      src={qrCodeUrl}
                      alt="Mã QR ngân hàng"
                      className="wp-qr-preview-img"
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#0f172a',
                        }}
                      >
                        Ảnh mã QR đã sẵn sàng
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Admin sẽ quét trực tiếp mã này để chuyển khoản
                      </div>
                    </div>
                    <button
                      type="button"
                      className="wp-qr-remove-btn"
                      onClick={() => setQrCodeUrl('')}
                    >
                      ✕ Xóa ảnh
                    </button>
                  </div>
                ) : (
                  <label className="wp-qr-dropzone">
                    <input
                      type="file"
                      id="qrUpload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(
                              'Kích thước ảnh QR không được vượt quá 5MB.',
                            );
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setQrCodeUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="wp-qr-dropzone-content">
                      <span className="wp-qr-upload-icon">📷</span>
                      <span className="wp-qr-upload-text">
                        Tải lên ảnh mã QR chuyển khoản (VietQR / Ngân hàng)
                      </span>
                      <span className="wp-qr-upload-sub">
                        Hỗ trợ PNG, JPG, JPEG (tối đa 5MB)
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="wp-form-group">
              <label htmlFor="withdrawNotes">Ghi chú (tùy chọn)</label>
              <textarea
                id="withdrawNotes"
                rows={2}
                placeholder="Nội dung chuyển khoản hoặc lời nhắn..."
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="wp-btn-submit"
              disabled={
                submittingWithdraw ||
                (balanceData?.availableBalance || 0) <
                  (balanceData?.minWithdrawal || 200000)
              }
            >
              {submittingWithdraw
                ? 'Đang gửi yêu cầu...'
                : 'Gửi yêu cầu rút tiền'}
            </button>
          </form>
        </div>

        {/* Cột phải: Bảng lịch sử các lần rút tiền HOẶC Trạng thái tiền từng đơn hàng */}
        <div className="wp-history-card">
          <div className="wp-tabs-header">
            <button
              type="button"
              className={`wp-tab-btn ${activeHistoryTab === 'WITHDRAWALS' ? 'active' : ''}`}
              onClick={() => setActiveHistoryTab('WITHDRAWALS')}
            >
              <IconlyDocument size={18} color="currentColor" />
              <span>Lịch sử yêu cầu rút tiền ({withdrawals.length})</span>
            </button>
            <button
              type="button"
              className={`wp-tab-btn ${activeHistoryTab === 'CLEARANCE' ? 'active' : ''}`}
              onClick={() => setActiveHistoryTab('CLEARANCE')}
            >
              <IconlyShield size={18} color="currentColor" />
              <span>
                Trạng thái tiền từng đơn hàng ({clearanceList.length})
              </span>
            </button>
          </div>

          {activeHistoryTab === 'CLEARANCE' ? (
            loading ? (
              <div className="wp-loading">
                <div className="wp-spinner" />
                <span>Đang tải danh sách đơn hàng...</span>
              </div>
            ) : clearanceList.length === 0 ? (
              <div className="wp-empty">
                <IconlyDocument size={36} color="#cbd5e1" />
                <p>Chưa có đơn hàng nào phát sinh từ các khóa học của bạn.</p>
              </div>
            ) : (
              <div className="wp-table-wrapper">
                <table className="wp-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Mã đơn</th>
                      <th>Khóa học</th>
                      <th>Doanh thu</th>
                      <th>Ngày mua</th>
                      <th>Trạng thái tiền</th>
                      <th>Điều kiện mở khóa / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedClearanceList.map((item, idx) => (
                      <tr key={item.orderId || idx}>
                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {(ordersPage - 1) * ordersPageSize + idx + 1}
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              color: '#0056d2',
                              fontSize: '12.5px',
                            }}
                          >
                            #{item.orderCode}
                          </span>
                        </td>
                        <td>
                          <strong
                            style={{ fontSize: '13px', color: '#0f172a' }}
                          >
                            {item.courseTitle}
                          </strong>
                        </td>
                        <td>
                          <strong
                            style={{
                              color: item.isCleared
                                ? '#16a34a'
                                : item.isPendingClearance
                                  ? '#d97706'
                                  : '#64748b',
                              fontSize: '13.5px',
                            }}
                          >
                            {formatVND(item.amount)}
                          </strong>
                        </td>
                        <td>
                          <span
                            style={{ fontSize: '12.5px', color: '#475569' }}
                          >
                            {new Date(item.createdAt).toLocaleDateString(
                              'vi-VN',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              },
                            )}
                          </span>
                        </td>
                        <td>{getClearanceBadge(item)}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#475569',
                              lineHeight: '1.4',
                            }}
                          >
                            {item.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Phân trang danh sách đơn hàng */}
                {clearanceList.length > ordersPageSize && (
                  <div className="wp-pagination-bar">
                    <span>
                      Hiển thị {(ordersPage - 1) * ordersPageSize + 1} -{' '}
                      {Math.min(
                        ordersPage * ordersPageSize,
                        clearanceList.length,
                      )}{' '}
                      trong <strong>{clearanceList.length}</strong> đơn hàng
                    </span>
                    <div className="wp-pagination-actions">
                      <button
                        type="button"
                        disabled={ordersPage <= 1}
                        onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      >
                        Trước
                      </button>
                      {Array.from(
                        { length: totalOrdersPages },
                        (_, i) => i + 1,
                      ).map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={p === ordersPage ? 'active' : ''}
                          onClick={() => setOrdersPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={ordersPage >= totalOrdersPages}
                        onClick={() =>
                          setOrdersPage((p) =>
                            Math.min(totalOrdersPages, p + 1),
                          )
                        }
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : loading ? (
            <div className="wp-loading">
              <div className="wp-spinner" />
              <span>Đang tải lịch sử...</span>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="wp-empty">
              <IconlyWallet size={36} color="#cbd5e1" />
              <p>Chưa có yêu cầu rút tiền nào được tạo.</p>
            </div>
          ) : (
            <div className="wp-table-wrapper">
              <table className="wp-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Thời gian</th>
                    <th>Số tiền (VNĐ)</th>
                    <th>Ngân hàng</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedWithdrawals.map((w, idx) => (
                    <tr key={w._id}>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#334155' }}>
                          {new Date(w.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                          {formatVND(w.amount)}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          <strong>{w.bankName}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {w.bankAccount} • {w.accountHolder}
                          </div>
                          {w.qrCodeUrl && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#16a34a',
                                fontWeight: 600,
                              }}
                            >
                              ✓ Đã đính kèm mã QR
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{getStatusBadge(w.status)}</td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#475569' }}>
                          {w.adminNotes || w.rejectionReason || '---'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Phân trang bảng rút tiền */}
              {withdrawals.length > pageSize && (
                <div className="wp-pagination-bar">
                  <span>
                    Hiển thị {(page - 1) * pageSize + 1} -{' '}
                    {Math.min(page * pageSize, withdrawals.length)} trong{' '}
                    <strong>{withdrawals.length}</strong> yêu cầu
                  </span>
                  <div className="wp-pagination-actions">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          className={p === page ? 'active' : ''}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
