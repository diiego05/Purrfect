import React, { useState, useEffect, useCallback } from 'react';
import { refundApi } from '../../services/refundApi';
import type { RefundRequestItem } from '../../services/refundApi';
import {
  IconlyDiscount,
  IconlyTimeCircle,
  IconlyClose,
  IconlyRefresh,
  IconlyDocument,
} from '../Onboarding/IconlyIcons';
import { toast } from '../../context/ToastContext';
import './InstructorRefundLogsPage.css';

export const InstructorRefundLogsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [requests, setRequests] = useState<RefundRequestItem[]>([]);
  const [summary, setSummary] = useState<{
    totalRequests: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    refundedRevenue: number;
    pendingRefundRevenue: number;
  }>({
    totalRequests: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    refundedRevenue: 0,
    pendingRefundRevenue: 0,
  });

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await refundApi.getInstructorRefundRequests();
      if (res && res.data) {
        setRequests(res.data.requests || []);
        setSummary({
          totalRequests: res.data.totalRequests || 0,
          pendingCount: res.data.pendingCount || 0,
          approvedCount: res.data.approvedCount || 0,
          rejectedCount: res.data.rejectedCount || 0,
          refundedRevenue: res.data.refundedRevenue || 0,
          pendingRefundRevenue: res.data.pendingRefundRevenue || 0,
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải nhật ký hoàn tiền:', err);
      toast.error('Không thể tải nhật ký hoàn tiền học viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTick]);

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const pagedRequests = filteredRequests.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="rl-badge rl-badge-pending">Chờ Admin xử lý</span>
        );
      case 'APPROVED':
        return (
          <span className="rl-badge rl-badge-approved">
            Đã hoàn tiền (Trừ doanh thu)
          </span>
        );
      case 'REJECTED':
        return <span className="rl-badge rl-badge-rejected">Đã từ chối</span>;
      case 'CANCELLED':
        return (
          <span className="rl-badge rl-badge-cancelled">Học viên đã hủy</span>
        );
      default:
        return <span className="rl-badge">{status}</span>;
    }
  };

  return (
    <div className="instructor-refund-logs-container">
      {/* Top Header */}
      <div className="rl-top-bar">
        <div>
          <h1 className="rl-page-title">
            Nhật ký Hoàn trả khóa học & Biến động Doanh thu
          </h1>
          <p className="rl-page-desc">
            Thông báo chi tiết các yêu cầu hoàn tiền của học viên đối với các
            khóa học bạn giảng dạy và tác động giảm trừ doanh thu thực tế
          </p>
        </div>
        <button
          type="button"
          className="rl-btn-refresh"
          onClick={() => setRefreshTick((prev) => prev + 1)}
          disabled={loading}
        >
          <IconlyRefresh size={16} color="currentColor" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="rl-kpi-grid">
        <div className="rl-kpi-card total">
          <div className="rl-kpi-icon">
            <IconlyDocument size={22} color="#0056d2" />
          </div>
          <div className="rl-kpi-meta">
            <span className="rl-kpi-label">Tổng yêu cầu hoàn trả</span>
            <strong className="rl-kpi-value">{summary.totalRequests}</strong>
            <span className="rl-kpi-sub">Toàn bộ các khóa học</span>
          </div>
        </div>

        <div className="rl-kpi-card refunded">
          <div className="rl-kpi-icon">
            <IconlyDiscount size={22} color="#ef4444" />
          </div>
          <div className="rl-kpi-meta">
            <span className="rl-kpi-label">Doanh thu bị giảm trừ</span>
            <strong className="rl-kpi-value red">
              -{formatVND(summary.refundedRevenue)}
            </strong>
            <span className="rl-kpi-sub">
              {summary.approvedCount} đơn đã phê duyệt hoàn trả
            </span>
          </div>
        </div>

        <div className="rl-kpi-card pending">
          <div className="rl-kpi-icon">
            <IconlyTimeCircle size={22} color="#f59e0b" />
          </div>
          <div className="rl-kpi-meta">
            <span className="rl-kpi-label">Đang chờ xét duyệt</span>
            <strong className="rl-kpi-value amber">
              {summary.pendingCount}
            </strong>
            <span className="rl-kpi-sub">
              Ước tính: {formatVND(summary.pendingRefundRevenue)}
            </span>
          </div>
        </div>

        <div className="rl-kpi-card rejected">
          <div className="rl-kpi-icon">
            <IconlyClose size={22} color="#10b981" />
          </div>
          <div className="rl-kpi-meta">
            <span className="rl-kpi-label">Yêu cầu bị từ chối / Hủy</span>
            <strong className="rl-kpi-value green">
              {summary.rejectedCount}
            </strong>
            <span className="rl-kpi-sub">Doanh thu được giữ nguyên</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rl-table-card">
        <div className="rl-table-header">
          <div className="rl-filter-tabs">
            <button
              type="button"
              className={`rl-tab ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setFilterStatus('ALL');
                setPage(1);
              }}
            >
              Tất cả ({requests.length})
            </button>
            <button
              type="button"
              className={`rl-tab ${filterStatus === 'PENDING' ? 'active' : ''}`}
              onClick={() => {
                setFilterStatus('PENDING');
                setPage(1);
              }}
            >
              Chờ xử lý ({summary.pendingCount})
            </button>
            <button
              type="button"
              className={`rl-tab ${filterStatus === 'APPROVED' ? 'active' : ''}`}
              onClick={() => {
                setFilterStatus('APPROVED');
                setPage(1);
              }}
            >
              Đã hoàn tiền ({summary.approvedCount})
            </button>
            <button
              type="button"
              className={`rl-tab ${filterStatus === 'REJECTED' ? 'active' : ''}`}
              onClick={() => {
                setFilterStatus('REJECTED');
                setPage(1);
              }}
            >
              Từ chối ({summary.rejectedCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rl-loading">
            <div className="rl-spinner" />
            <span>Đang tải nhật ký hoàn tiền...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rl-empty">
            <IconlyDiscount size={40} color="#cbd5e1" />
            <p>Không có yêu cầu hoàn trả nào trong mục này.</p>
          </div>
        ) : (
          <div className="rl-table-wrapper">
            <table className="rl-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Thời gian yêu cầu</th>
                  <th>Học viên</th>
                  <th>Khóa học hoàn trả</th>
                  <th>Số tiền hoàn</th>
                  <th>Lý do từ học viên</th>
                  <th>Trạng thái & Xử lý</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.map((r, idx) => (
                  <tr key={r._id}>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#334155' }}>
                        {new Date(r.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="rl-user-cell">
                        <img
                          src={
                            r.userId?.avatarUrl ||
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(r.userId?.email || 'student')}`
                          }
                          alt="Student Avatar"
                          className="rl-user-avatar"
                        />
                        <div>
                          <div className="rl-user-name">
                            {r.userId?.fullName || 'Học viên'}
                          </div>
                          <div className="rl-user-email">
                            {r.userId?.email || '---'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rl-course-cell">
                        <img
                          src={
                            r.courseId?.thumbnailUrl ||
                            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'
                          }
                          alt="Course"
                          className="rl-course-thumb"
                        />
                        <span
                          className="rl-course-title"
                          title={r.courseId?.title}
                        >
                          {r.courseId?.title || 'Khóa học'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong
                        style={{
                          color:
                            r.status === 'APPROVED' ? '#ef4444' : '#0f172a',
                          fontSize: '13.5px',
                        }}
                      >
                        {formatVND(r.orderId?.amount || r.amount || 0)}
                      </strong>
                    </td>
                    <td>
                      <div className="rl-reason-box" title={r.reason}>
                        <strong>{r.reason}</strong>
                        {r.notes && (
                          <p className="rl-reason-notes">{r.notes}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {getStatusBadge(r.status)}
                        {r.rejectionReason && (
                          <span style={{ fontSize: '12px', color: '#b91c1c' }}>
                            Lý do từ chối: {r.rejectionReason}
                          </span>
                        )}
                        {r.adminNotes && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Ghi chú: {r.adminNotes}
                          </span>
                        )}
                        {r.processedAt && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Duyệt:{' '}
                            {new Date(r.processedAt).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phân trang */}
            {filteredRequests.length > pageSize && (
              <div className="rl-pagination-bar">
                <span>
                  Hiển thị {(page - 1) * pageSize + 1} -{' '}
                  {Math.min(page * pageSize, filteredRequests.length)} trong{' '}
                  <strong>{filteredRequests.length}</strong> nhật ký
                </span>
                <div className="rl-pagination-actions">
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
  );
};
