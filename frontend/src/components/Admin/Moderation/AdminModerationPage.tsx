import React, { useState, useEffect, useCallback } from 'react';
import { moderationApi } from '../../../services/moderationApi';
import type {
  ContentReportItem,
  ModerationSummary,
  ReportStatus,
} from '../../../types/moderation';
import { REPORT_REASON_LABELS } from '../../../types/moderation';
import {
  IconlyShield,
  IconlyDelete,
  IconlyTick,
  IconlyClose,
  IconlySearch,
  IconlyDanger,
  IconlyLock,
  IconlyShow,
} from '../../Onboarding/IconlyIcons';
import './AdminModerationPage.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

type FilterTab = 'all' | 'PENDING' | 'RESOLVED' | 'DISMISSED';

export const AdminModerationPage: React.FC = () => {
  const [reports, setReports] = useState<ContentReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ModerationSummary>({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0,
  });
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] =
    useState<ContentReportItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    reportId: string;
    action: 'DISMISS' | 'HIDE' | 'DELETE';
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const addToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const params: { status?: string } = {};
    if (activeTab !== 'all') {
      params.status = activeTab;
    }
    moderationApi
      .getReports(params)
      .then((result) => {
        if (!isMounted) return;
        if (result.success) {
          setReports(result.data.reports);
          setSummary(result.data.summary);
        } else {
          addToast(result.message || 'Lỗi tải dữ liệu', 'error');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        addToast('Lỗi kết nối máy chủ', 'error');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, addToast, refreshTrigger]);

  const reloadReports = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleModerate = useCallback(
    (
      reportId: string,
      action: 'DISMISS' | 'HIDE_OR_DELETE',
      moderationAction?: 'HIDE' | 'DELETE',
    ) => {
      setActionLoading(reportId);
      moderationApi
        .moderateReport(reportId, action, moderationAction)
        .then((result) => {
          if (result.success) {
            const msg =
              action === 'DISMISS'
                ? 'Đã bỏ qua báo cáo'
                : moderationAction === 'DELETE'
                  ? 'Đã xóa vĩnh viễn nội dung vi phạm'
                  : 'Đã ẩn nội dung vi phạm';

            if (result.data?.accountLocked) {
              addToast(
                `${msg}. Tài khoản vi phạm đã bị tạm khóa 7 ngày (vi phạm lần ${result.data.violationCount})`,
                'warning',
              );
            } else if (
              result.data?.violationCount &&
              result.data.violationCount > 0
            ) {
              addToast(
                `${msg}. Cảnh báo đã gửi (vi phạm lần ${result.data.violationCount})`,
                'success',
              );
            } else {
              addToast(msg, 'success');
            }
            setShowDetailModal(false);
            setSelectedReport(null);
            setConfirmAction(null);
            reloadReports();
          } else {
            addToast(result.message || 'Lỗi xử lý', 'error');
          }
          setActionLoading(null);
        })
        .catch(() => {
          addToast('Lỗi kết nối máy chủ', 'error');
          setActionLoading(null);
        });
    },
    [addToast, reloadReports],
  );

  const handleLockAccount = useCallback(
    (userId: string) => {
      setActionLoading(userId);
      moderationApi
        .lockAccount(userId, 7)
        .then((result) => {
          if (result.success) {
            addToast('Đã tạm khóa tài khoản 7 ngày', 'warning');
            reloadReports();
          } else {
            addToast(result.message || 'Lỗi khóa tài khoản', 'error');
          }
          setActionLoading(null);
        })
        .catch(() => {
          addToast('Lỗi kết nối máy chủ', 'error');
          setActionLoading(null);
        });
    },
    [addToast, reloadReports],
  );

  const getContentPreview = (report: ContentReportItem): string => {
    if (!report.targetContent) return '(Nội dung không khả dụng)';
    if (report.targetType === 'DISCUSSION') {
      return report.targetContent.content || '';
    }
    return report.targetContent.comment || '';
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="mod-badge mod-badge-pending">Chờ xử lý</span>;
      case 'RESOLVED':
        return <span className="mod-badge mod-badge-resolved">Đã xử lý</span>;
      case 'DISMISSED':
        return <span className="mod-badge mod-badge-dismissed">Đã bỏ qua</span>;
      default:
        return null;
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const content = getContentPreview(r).toLowerCase();
    const offender = r.offendingUserId?.fullName?.toLowerCase() || '';
    const reporter = r.reportedBy?.fullName?.toLowerCase() || '';
    return (
      content.includes(term) ||
      offender.includes(term) ||
      reporter.includes(term)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-moderation-page">
      {/* Filter Tabs & Search */}
      <div className="mod-toolbar">
        <div className="mod-tabs">
          {(
            [
              ['all', 'Tất cả'],
              ['PENDING', 'Chờ xử lý'],
              ['RESOLVED', 'Đã xử lý'],
              ['DISMISSED', 'Đã bỏ qua'],
            ] as [FilterTab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`mod-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {key === 'PENDING' && summary.pending > 0 && (
                <span className="mod-tab-badge">{summary.pending}</span>
              )}
            </button>
          ))}
        </div>
        <div className="mod-search-box">
          <IconlySearch size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Tìm theo nội dung, người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="mod-loading">
          <div className="mod-spinner" />
          <span>Đang tải dữ liệu...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="mod-empty">
          <IconlyShield size={48} color="#d1d5db" />
          <p>
            Không có báo cáo nào{activeTab !== 'all' ? ' trong mục này' : ''}
          </p>
        </div>
      ) : (
        <div className="mod-report-list">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className={`mod-report-card ${report.status.toLowerCase()}`}
            >
              <div className="mod-report-header">
                <div className="mod-report-meta">
                  <span
                    className={`mod-type-badge ${report.targetType.toLowerCase()}`}
                  >
                    {report.targetType === 'DISCUSSION'
                      ? 'Thảo luận'
                      : 'Đánh giá'}
                  </span>
                  {getStatusBadge(report.status)}
                  <span className="mod-reason-tag">
                    {REPORT_REASON_LABELS[report.reason] || report.reason}
                  </span>
                </div>
                <span className="mod-report-date">
                  {formatDate(report.createdAt)}
                </span>
              </div>

              <div className="mod-report-content">
                <p className="mod-content-preview">
                  "{getContentPreview(report).substring(0, 200)}
                  {getContentPreview(report).length > 200 ? '...' : ''}"
                </p>
                {report.targetContent?.courseId && (
                  <span className="mod-course-ref">
                    Khóa học: {report.targetContent.courseId.title}
                  </span>
                )}
              </div>

              <div className="mod-report-users">
                <div className="mod-user-info">
                  <img
                    src={
                      report.offendingUserId?.avatarUrl ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${report.offendingUserId?.email || 'unknown'}`
                    }
                    alt=""
                    className="mod-user-avatar"
                  />
                  <div>
                    <span className="mod-user-label">Vi phạm:</span>
                    <span className="mod-user-name">
                      {report.offendingUserId?.fullName || 'N/A'}
                    </span>
                    {(report.offendingUserId?.violationCount ?? 0) > 0 && (
                      <span className="mod-violation-count">
                        ({report.offendingUserId?.violationCount} lần vi phạm)
                      </span>
                    )}
                  </div>
                </div>
                <div className="mod-user-info">
                  <img
                    src={
                      report.reportedBy?.avatarUrl ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${report.reportedBy?.email || 'unknown'}`
                    }
                    alt=""
                    className="mod-user-avatar"
                  />
                  <div>
                    <span className="mod-user-label">Người báo cáo:</span>
                    <span className="mod-user-name">
                      {report.reportedBy?.fullName || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {report.status === 'PENDING' && (
                <div className="mod-report-actions">
                  <button
                    type="button"
                    className="mod-btn mod-btn-dismiss"
                    disabled={actionLoading === report._id}
                    onClick={() =>
                      setConfirmAction({
                        reportId: report._id,
                        action: 'DISMISS',
                      })
                    }
                  >
                    <IconlyClose size={14} color="currentColor" />
                    Bỏ qua báo cáo
                  </button>
                  <button
                    type="button"
                    className="mod-btn mod-btn-hide"
                    disabled={actionLoading === report._id}
                    onClick={() =>
                      setConfirmAction({ reportId: report._id, action: 'HIDE' })
                    }
                  >
                    <IconlyShow size={14} color="currentColor" />
                    Ẩn nội dung
                  </button>
                  <button
                    type="button"
                    className="mod-btn mod-btn-delete"
                    disabled={actionLoading === report._id}
                    onClick={() =>
                      setConfirmAction({
                        reportId: report._id,
                        action: 'DELETE',
                      })
                    }
                  >
                    <IconlyDelete size={14} color="currentColor" />
                    Xóa vĩnh viễn
                  </button>
                  <button
                    type="button"
                    className="mod-btn mod-btn-detail"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailModal(true);
                    }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              )}

              {report.status !== 'PENDING' && (
                <div className="mod-report-resolved-info">
                  <span>
                    {report.moderationAction === 'DELETE'
                      ? 'Đã xóa vĩnh viễn'
                      : report.moderationAction === 'HIDE'
                        ? 'Đã ẩn nội dung'
                        : report.status === 'DISMISSED'
                          ? 'Đã bỏ qua'
                          : 'Đã xử lý'}
                  </span>
                  {report.moderatedBy && (
                    <span className="mod-moderated-by">
                      bởi {report.moderatedBy.fullName}
                    </span>
                  )}
                  {report.moderatedAt && (
                    <span className="mod-moderated-date">
                      lúc {formatDate(report.moderatedAt)}
                    </span>
                  )}
                </div>
              )}

              {/*    Gợi ý khóa tài khoản nếu vi phạm > 3 */}
              {report.status === 'PENDING' &&
                (report.offendingUserId?.violationCount ?? 0) > 3 &&
                !report.offendingUserId?.isLocked && (
                  <div className="mod-lock-suggestion">
                    <IconlyDanger size={16} color="#dc2626" />
                    <span>
                      Tài khoản này đã vi phạm{' '}
                      {report.offendingUserId?.violationCount} lần.
                    </span>
                    <button
                      type="button"
                      className="mod-btn mod-btn-lock"
                      disabled={actionLoading === report.offendingUserId?._id}
                      onClick={() =>
                        report.offendingUserId &&
                        handleLockAccount(report.offendingUserId._id)
                      }
                    >
                      <IconlyLock size={14} color="currentColor" />
                      Tạm khóa tài khoản 7 ngày
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div
          className="mod-modal-overlay"
          onClick={() => setConfirmAction(null)}
        >
          <div className="mod-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mod-modal-title">
              {confirmAction.action === 'DISMISS'
                ? 'Bỏ qua báo cáo?'
                : confirmAction.action === 'HIDE'
                  ? 'Ẩn nội dung vi phạm?'
                  : 'Xóa vĩnh viễn nội dung?'}
            </h3>
            <p className="mod-modal-desc">
              {confirmAction.action === 'DISMISS'
                ? 'Báo cáo sẽ được bỏ qua và nội dung được giữ nguyên.'
                : confirmAction.action === 'HIDE'
                  ? 'Nội dung sẽ bị ẩn khỏi giao diện công khai. Người vi phạm sẽ nhận cảnh báo.'
                  : 'Nội dung sẽ bị xóa vĩnh viễn và không thể khôi phục. Người vi phạm sẽ nhận cảnh báo.'}
            </p>
            <div className="mod-modal-actions">
              <button
                type="button"
                className="mod-btn mod-btn-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`mod-btn ${confirmAction.action === 'DELETE' ? 'mod-btn-delete' : confirmAction.action === 'HIDE' ? 'mod-btn-hide' : 'mod-btn-dismiss'}`}
                disabled={actionLoading === confirmAction.reportId}
                onClick={() => {
                  if (confirmAction.action === 'DISMISS') {
                    handleModerate(confirmAction.reportId, 'DISMISS');
                  } else {
                    handleModerate(
                      confirmAction.reportId,
                      'HIDE_OR_DELETE',
                      confirmAction.action,
                    );
                  }
                }}
              >
                {actionLoading === confirmAction.reportId
                  ? 'Đang xử lý...'
                  : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div
          className="mod-modal-overlay"
          onClick={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
        >
          <div
            className="mod-modal mod-modal-detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mod-modal-header">
              <h3>Chi tiết báo cáo</h3>
              <button
                type="button"
                className="mod-modal-close"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedReport(null);
                }}
              >
                <IconlyClose size={18} color="currentColor" />
              </button>
            </div>
            <div className="mod-detail-body">
              <div className="mod-detail-section">
                <h4>Thông tin báo cáo</h4>
                <div className="mod-detail-grid">
                  <div>
                    <span>Loại:</span>{' '}
                    {selectedReport.targetType === 'DISCUSSION'
                      ? 'Thảo luận'
                      : 'Đánh giá'}
                  </div>
                  <div>
                    <span>Lý do:</span>{' '}
                    {REPORT_REASON_LABELS[selectedReport.reason]}
                  </div>
                  <div>
                    <span>Trạng thái:</span>{' '}
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <div>
                    <span>Ngày báo cáo:</span>{' '}
                    {formatDate(selectedReport.createdAt)}
                  </div>
                </div>
                {selectedReport.details && (
                  <div className="mod-detail-extra">
                    <span>Chi tiết bổ sung:</span>
                    <p>{selectedReport.details}</p>
                  </div>
                )}
              </div>

              <div className="mod-detail-section">
                <h4>Nội dung bị báo cáo</h4>
                <div className="mod-detail-content-box">
                  <p>{getContentPreview(selectedReport)}</p>
                  {selectedReport.targetType === 'REVIEW' &&
                    selectedReport.targetContent?.rating && (
                      <div className="mod-detail-rating">
                        {'★'.repeat(selectedReport.targetContent.rating)}
                        {'☆'.repeat(5 - selectedReport.targetContent.rating)}
                        <span> ({selectedReport.targetContent.rating}/5)</span>
                      </div>
                    )}
                </div>
              </div>

              <div className="mod-detail-section">
                <h4>Người vi phạm</h4>
                <div className="mod-detail-user-row">
                  <img
                    src={
                      selectedReport.offendingUserId?.avatarUrl ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedReport.offendingUserId?.email}`
                    }
                    alt=""
                    className="mod-detail-avatar"
                  />
                  <div>
                    <strong>{selectedReport.offendingUserId?.fullName}</strong>
                    <span>{selectedReport.offendingUserId?.email}</span>
                    <span>Vai trò: {selectedReport.offendingUserId?.role}</span>
                    <span>
                      Số lần vi phạm:{' '}
                      {selectedReport.offendingUserId?.violationCount ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {selectedReport.status === 'PENDING' && (
                <div className="mod-detail-actions">
                  <button
                    type="button"
                    className="mod-btn mod-btn-dismiss"
                    disabled={!!actionLoading}
                    onClick={() =>
                      handleModerate(selectedReport._id, 'DISMISS')
                    }
                  >
                    <IconlyClose size={14} color="currentColor" /> Bỏ qua báo
                    cáo
                  </button>
                  <button
                    type="button"
                    className="mod-btn mod-btn-hide"
                    disabled={!!actionLoading}
                    onClick={() =>
                      handleModerate(
                        selectedReport._id,
                        'HIDE_OR_DELETE',
                        'HIDE',
                      )
                    }
                  >
                    <IconlyShow size={14} color="currentColor" /> Ẩn nội dung
                  </button>
                  <button
                    type="button"
                    className="mod-btn mod-btn-delete"
                    disabled={!!actionLoading}
                    onClick={() =>
                      handleModerate(
                        selectedReport._id,
                        'HIDE_OR_DELETE',
                        'DELETE',
                      )
                    }
                  >
                    <IconlyDelete size={14} color="currentColor" /> Xóa vĩnh
                    viễn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="mod-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`mod-toast mod-toast-${toast.type}`}>
            {toast.type === 'success' && (
              <IconlyTick size={16} color="currentColor" />
            )}
            {toast.type === 'error' && (
              <IconlyDanger size={16} color="currentColor" />
            )}
            {toast.type === 'warning' && (
              <IconlyDanger size={16} color="currentColor" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
