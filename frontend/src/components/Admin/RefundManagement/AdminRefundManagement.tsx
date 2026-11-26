import React, { useState, useEffect, useCallback } from 'react';
import { refundApi } from '../../../services/refundApi';
import type { RefundRequestItem } from '../../../services/refundApi';
import { withdrawalApi } from '../../../services/withdrawalApi';
import type { WithdrawalRequestItem } from '../../../services/withdrawalApi';
import {
  IconlyTick,
  IconlyClose,
  IconlyShield,
  IconlyDiscount,
  IconlySearch,
} from '../../Onboarding/IconlyIcons';
import './AdminRefundManagement.css';

export const AdminRefundManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'refunds' | 'withdrawals'>(
    'refunds',
  );

  // Danh sách hoàn tiền (Refunds)
  const [refunds, setRefunds] = useState<RefundRequestItem[]>([]);
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>('ALL');
  const [refundSearch, setRefundSearch] = useState<string>('');

  // Danh sách rút tiền (Withdrawals)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] =
    useState<string>('ALL');
  const [withdrawalSearch, setWithdrawalSearch] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);

  // Modal xử lý duyệt / từ chối
  const [selectedRefund, setSelectedRefund] =
    useState<RefundRequestItem | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequestItem | null>(null);
  const [processingAction, setProcessingAction] = useState<
    'APPROVE' | 'REJECT' | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);

  // Alert message
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadRefunds = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        const res = await refundApi.getAdminRefundRequests(
          refundStatusFilter,
          refundSearch,
        );
        if (res && res.requests) {
          setRefunds(res.requests);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách hoàn tiền:', err);
      } finally {
        setLoading(false);
      }
    },
    [refundStatusFilter, refundSearch],
  );

  const loadWithdrawals = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        const res = await withdrawalApi.getAdminWithdrawals(
          withdrawalStatusFilter,
          withdrawalSearch,
        );
        if (res && res.withdrawals) {
          setWithdrawals(res.withdrawals);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách rút tiền:', err);
      } finally {
        setLoading(false);
      }
    },
    [withdrawalStatusFilter, withdrawalSearch],
  );

  useEffect(() => {
    if (activeTab === 'refunds') {
      loadRefunds();
    } else {
      loadWithdrawals();
    }
  }, [activeTab, loadRefunds, loadWithdrawals]);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mở modal xử lý Refund
  const openRefundActionModal = (
    item: RefundRequestItem,
    action: 'APPROVE' | 'REJECT',
  ) => {
    setSelectedRefund(item);
    setProcessingAction(action);
    setRejectionReason('');
    setAdminNotes('');
  };

  // Mở modal xử lý Withdrawal
  const openWithdrawalActionModal = (
    item: WithdrawalRequestItem,
    action: 'APPROVE' | 'REJECT',
  ) => {
    setSelectedWithdrawal(item);
    setProcessingAction(action);
    setRejectionReason('');
    setAdminNotes('');
  };

  // Thực hiện duyệt / từ chối hoàn tiền
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund || !processingAction) return;

    if (processingAction === 'REJECT' && !rejectionReason.trim()) {
      setAlert({
        type: 'error',
        text: 'Vui lòng nhập lý do từ chối hoàn tiền.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await refundApi.processAdminRefund(
        selectedRefund._id,
        processingAction,
        rejectionReason,
        adminNotes,
      );

      setAlert({
        type: 'success',
        text: res.message || 'Xử lý yêu cầu hoàn tiền thành công.',
      });
      setSelectedRefund(null);
      setProcessingAction(null);
      await loadRefunds();
    } catch (err) {
      setAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi xử lý hoàn tiền.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thực hiện duyệt / từ chối rút tiền
  const handleProcessWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal || !processingAction) return;

    if (processingAction === 'REJECT' && !rejectionReason.trim()) {
      setAlert({
        type: 'error',
        text: 'Vui lòng nhập lý do từ chối yêu cầu rút tiền.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await withdrawalApi.processAdminWithdrawal(
        selectedWithdrawal._id,
        processingAction,
        rejectionReason,
        adminNotes,
      );

      setAlert({
        type: 'success',
        text: res.message || 'Xử lý yêu cầu rút tiền thành công.',
      });
      setSelectedWithdrawal(null);
      setProcessingAction(null);
      await loadWithdrawals();
    } catch (err) {
      setAlert({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi xử lý rút tiền.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="adm-badge adm-badge--pending">Chờ xét duyệt</span>
        );
      case 'APPROVED':
        return <span className="adm-badge adm-badge--approved">Đã duyệt</span>;
      case 'REJECTED':
        return (
          <span className="adm-badge adm-badge--rejected">Bị từ chối</span>
        );
      case 'CANCELLED':
        return <span className="adm-badge adm-badge--cancelled">Đã hủy</span>;
      default:
        return <span className="adm-badge">{status}</span>;
    }
  };

  return (
    <div className="adm-refunds-container">
      {/* Header & Tabs */}
      <div className="adm-header">
        <div>
          <h2 className="adm-title">Quản lý Hoàn tiền & Rút tiền</h2>
          <p className="adm-subtitle">
            Xét duyệt các yêu cầu hoàn tiền của học viên và yêu cầu rút tiền của
            giảng viên.
          </p>
        </div>

        <div className="adm-tabs">
          <button
            type="button"
            className={`adm-tab-btn ${activeTab === 'refunds' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('refunds');
              setAlert(null);
            }}
          >
            <span>Hoàn tiền học viên</span>
          </button>
          <button
            type="button"
            className={`adm-tab-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('withdrawals');
              setAlert(null);
            }}
          >
            <span>Rút tiền giảng viên</span>
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div
          className={`adm-alert ${
            alert.type === 'success' ? 'adm-alert--success' : 'adm-alert--error'
          }`}
        >
          <span>{alert.text}</span>
          <button
            type="button"
            className="adm-alert-close"
            onClick={() => setAlert(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: HOÀN TIỀN HỌC VIÊN */}
      {activeTab === 'refunds' ? (
        <div className="adm-content">
          {/* Toolbar & Filter */}
          <div className="adm-toolbar">
            <div className="adm-search-wrap">
              <IconlySearch size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Tìm theo học viên, email, khóa học, mã đơn..."
                value={refundSearch}
                onChange={(e) => setRefundSearch(e.target.value)}
                className="adm-search-input"
              />
            </div>

            <div className="adm-filter-wrap">
              <label>Trạng thái:</label>
              <select
                value={refundStatusFilter}
                onChange={(e) => setRefundStatusFilter(e.target.value)}
                className="adm-select"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xét duyệt (PENDING)</option>
                <option value="APPROVED">Đã hoàn tiền (APPROVED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="adm-loading">
              <div className="adm-spinner" />
              <p>Đang tải danh sách yêu cầu hoàn tiền...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="adm-empty">
              <IconlyShield size={40} color="#94a3b8" />
              <h4>Không có yêu cầu hoàn tiền nào</h4>
              <p>
                Chưa có yêu cầu hoàn tiền nào phù hợp với điều kiện tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Khóa học & Đơn hàng</th>
                    <th>Số tiền</th>
                    <th>Lý do hoàn tiền</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((rf) => (
                    <tr key={rf._id}>
                      <td>
                        <div className="adm-user-cell">
                          <strong>{rf.userId?.fullName || 'Học viên'}</strong>
                          <span>{rf.userId?.email}</span>
                          {rf.userId?.phoneNumber && (
                            <small>{rf.userId?.phoneNumber}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="adm-course-cell">
                          <strong>{rf.courseId?.title || '---'}</strong>
                          <span>Mã đơn: {rf.orderId?.orderCode || '---'}</span>
                          <small>Hình thức: {rf.orderId?.paymentMethod}</small>
                        </div>
                      </td>
                      <td>
                        <strong className="text-primary">
                          {formatVND(rf.amount)}
                        </strong>
                      </td>
                      <td>
                        <div className="adm-reason-cell">
                          <strong>{rf.reason}</strong>
                          {rf.notes && <p>{rf.notes}</p>}
                          {rf.rejectionReason && (
                            <span className="text-danger">
                              Từ chối: {rf.rejectionReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="adm-date">
                          {formatDate(rf.createdAt)}
                        </span>
                      </td>
                      <td>{getStatusBadge(rf.status)}</td>
                      <td>
                        <div className="adm-actions-cell">
                          {rf.status === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                className="adm-btn adm-btn--approve"
                                onClick={() =>
                                  openRefundActionModal(rf, 'APPROVE')
                                }
                              >
                                <IconlyTick size={14} color="#ffffff" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                className="adm-btn adm-btn--reject"
                                onClick={() =>
                                  openRefundActionModal(rf, 'REJECT')
                                }
                              >
                                <IconlyClose size={14} color="#ffffff" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          ) : (
                            <span className="adm-processed-text">
                              {rf.status === 'APPROVED'
                                ? '✓ Đã hoàn tất'
                                : 'Đã kết thúc'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: RÚT TIỀN GIẢNG VIÊN */
        <div className="adm-content">
          <div className="adm-toolbar">
            <div className="adm-search-wrap">
              <IconlySearch size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Tìm theo giảng viên, email, ngân hàng, STK..."
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
                className="adm-search-input"
              />
            </div>

            <div className="adm-filter-wrap">
              <label>Trạng thái:</label>
              <select
                value={withdrawalStatusFilter}
                onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
                className="adm-select"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xét duyệt (PENDING)</option>
                <option value="APPROVED">Đã duyệt (APPROVED)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="adm-loading">
              <div className="adm-spinner" />
              <p>Đang tải danh sách yêu cầu rút tiền...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="adm-empty">
              <IconlyDiscount size={40} color="#94a3b8" />
              <h4>Không có yêu cầu rút tiền nào</h4>
              <p>Chưa có yêu cầu rút tiền nào của giảng viên.</p>
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Giảng viên</th>
                    <th>Số tiền rút</th>
                    <th>Thông tin tài khoản ngân hàng</th>
                    <th>Ghi chú</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w._id}>
                      <td>
                        <div className="adm-user-cell">
                          <strong>
                            {w.instructorId?.fullName || 'Giảng viên'}
                          </strong>
                          <span>{w.instructorId?.email}</span>
                          {w.instructorId?.phoneNumber && (
                            <small>{w.instructorId?.phoneNumber}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong className="text-primary">
                          {formatVND(w.amount)}
                        </strong>
                      </td>
                      <td>
                        <div className="adm-bank-cell">
                          <strong>{w.bankName}</strong>
                          <span>STK: {w.bankAccount}</span>
                          <span>Chủ TK: {w.accountHolder}</span>
                        </div>
                      </td>
                      <td>
                        <span>{w.notes || '---'}</span>
                        {w.rejectionReason && (
                          <div className="text-danger">
                            Từ chối: {w.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="adm-date">
                          {formatDate(w.createdAt)}
                        </span>
                      </td>
                      <td>{getStatusBadge(w.status)}</td>
                      <td>
                        <div className="adm-actions-cell">
                          {w.status === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                className="adm-btn adm-btn--approve"
                                onClick={() =>
                                  openWithdrawalActionModal(w, 'APPROVE')
                                }
                              >
                                <IconlyTick size={14} color="#ffffff" />
                                <span>Duyệt</span>
                              </button>
                              <button
                                type="button"
                                className="adm-btn adm-btn--reject"
                                onClick={() =>
                                  openWithdrawalActionModal(w, 'REJECT')
                                }
                              >
                                <IconlyClose size={14} color="#ffffff" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          ) : (
                            <span className="adm-processed-text">
                              {w.status === 'APPROVED'
                                ? '✓ Đã duyệt chi'
                                : 'Đã xử lý'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DUYỆT / TỪ CHỐI HOÀN TIỀN */}
      {selectedRefund && processingAction && (
        <div
          className="adm-modal-backdrop"
          onClick={() => setSelectedRefund(null)}
        >
          <div
            className="adm-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3>
                {processingAction === 'APPROVE'
                  ? 'Phê duyệt hoàn tiền cho học viên'
                  : 'Từ chối yêu cầu hoàn tiền'}
              </h3>
              <button
                type="button"
                className="adm-modal-close"
                onClick={() => setSelectedRefund(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="adm-modal-body">
              <div className="adm-confirm-box">
                <p>
                  <strong>Học viên:</strong> {selectedRefund.userId?.fullName} (
                  {selectedRefund.userId?.email})
                </p>
                <p>
                  <strong>Khóa học:</strong> {selectedRefund.courseId?.title}
                </p>
                <p>
                  <strong>Số tiền:</strong>{' '}
                  <span className="text-primary font-bold">
                    {formatVND(selectedRefund.amount)}
                  </span>
                </p>
                <p>
                  <strong>Lý do:</strong> {selectedRefund.reason}
                </p>
              </div>

              {processingAction === 'APPROVE' ? (
                <div className="adm-modal-tip">
                  ✓ Khi duyệt hoàn tiền, số tiền hoàn{' '}
                  <strong>{formatVND(selectedRefund.amount)}</strong> sẽ được tự
                  động quy đổi thành{' '}
                  <strong>
                    {Math.floor(selectedRefund.amount / 1000).toLocaleString(
                      'vi-VN',
                    )}{' '}
                    điểm PurrPoint
                  </strong>{' '}
                  (tỷ lệ cấu hình: 1.000 VNĐ = 1 point) và cộng trực tiếp vào ví
                  điểm của học viên.
                  <br />✓ Đơn hàng sẽ chuyển sang trạng thái REFUNDED, quyền
                  truy cập bài học sẽ được thu hồi vĩnh viễn và doanh thu sẽ
                  được trừ khỏi báo cáo của giảng viên.
                </div>
              ) : (
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Lý do từ chối <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="adm-textarea"
                    placeholder="Nhập lý do từ chối để học viên nắm rõ thông tin..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="adm-form-group">
                <label className="adm-form-label">
                  Ghi chú nội bộ Admin (tùy chọn)
                </label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Ghi chú nội bộ..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn-sec"
                  onClick={() => setSelectedRefund(null)}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`adm-btn-primary ${
                    processingAction === 'APPROVE' ? 'btn-green' : 'btn-red'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : processingAction === 'APPROVE'
                      ? 'Xác nhận Hoàn tiền'
                      : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DUYỆT / TỪ CHỐI RÚT TIỀN GIẢNG VIÊN */}
      {selectedWithdrawal && processingAction && (
        <div
          className="adm-modal-backdrop"
          onClick={() => setSelectedWithdrawal(null)}
        >
          <div
            className="adm-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3>
                {processingAction === 'APPROVE'
                  ? 'Phê duyệt rút tiền cho Giảng viên'
                  : 'Từ chối yêu cầu rút tiền'}
              </h3>
              <button
                type="button"
                className="adm-modal-close"
                onClick={() => setSelectedWithdrawal(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessWithdrawal} className="adm-modal-body">
              <div className="adm-confirm-withdrawal-card">
                <div className="adm-withdrawal-info-side">
                  <div className="adm-info-row">
                    <span className="adm-info-label">Giảng viên:</span>
                    <span className="adm-info-value">
                      <strong>
                        {selectedWithdrawal.instructorId?.fullName}
                      </strong>{' '}
                      ({selectedWithdrawal.instructorId?.email})
                    </span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Số tiền cần chi:</span>
                    <span
                      className="adm-info-value font-bold"
                      style={{ fontSize: '1.2rem', color: '#16a34a' }}
                    >
                      {formatVND(selectedWithdrawal.amount)}
                    </span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Ngân hàng:</span>
                    <span className="adm-info-value">
                      <strong>{selectedWithdrawal.bankName}</strong>
                    </span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Số tài khoản:</span>
                    <span
                      className="adm-info-value"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <strong
                        style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}
                      >
                        {selectedWithdrawal.bankAccount}
                      </strong>
                      <button
                        type="button"
                        className="btn-copy-acc"
                        title="Sao chép số tài khoản"
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(
                            selectedWithdrawal.bankAccount,
                          );
                          setCopiedAcc(true);
                          setTimeout(() => setCopiedAcc(false), 2000);
                        }}
                      >
                        {copiedAcc ? '✓ Đã chép' : 'Sao chép'}
                      </button>
                    </span>
                  </div>
                  <div className="adm-info-row">
                    <span className="adm-info-label">Chủ tài khoản:</span>
                    <span className="adm-info-value">
                      <strong>{selectedWithdrawal.accountHolder}</strong>
                    </span>
                  </div>
                  {selectedWithdrawal.notes && (
                    <div className="adm-info-row">
                      <span className="adm-info-label">Ghi chú từ GV:</span>
                      <span className="adm-info-value">
                        {selectedWithdrawal.notes}
                      </span>
                    </div>
                  )}
                </div>

                {selectedWithdrawal.qrCodeUrl && (
                  <div className="adm-withdrawal-qr-side">
                    <div className="adm-qr-container">
                      <img
                        src={selectedWithdrawal.qrCodeUrl}
                        alt="Mã QR giảng viên tải lên"
                        className="adm-qr-image"
                      />
                      <span className="adm-qr-caption">
                        Mã QR giảng viên tải lên
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {processingAction === 'APPROVE' ? (
                <div className="adm-modal-tip">
                  ✓ Khi duyệt rút tiền, hệ thống ghi nhận khoản tiền đã được chi
                  trả thành công cho giảng viên.
                </div>
              ) : (
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    Lý do từ chối <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="adm-textarea"
                    placeholder="Nhập lý do từ chối (ví dụ: sai số tài khoản, thông tin ngân hàng không khớp)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="adm-form-group">
                <label className="adm-form-label">Ghi chú nội bộ</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Mã giao dịch ngân hàng / ghi chú..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  className="adm-btn-sec"
                  onClick={() => setSelectedWithdrawal(null)}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`adm-btn-primary ${
                    processingAction === 'APPROVE' ? 'btn-green' : 'btn-red'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : processingAction === 'APPROVE'
                      ? 'Xác nhận'
                      : 'Xác nhận Từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefundManagement;
