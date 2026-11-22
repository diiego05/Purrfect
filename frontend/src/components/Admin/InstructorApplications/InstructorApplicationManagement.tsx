import React, { useState, useEffect, useCallback } from 'react';
import { instructorApplicationApi } from '../../../services/instructorApplicationApi';
import type {
  InstructorApplicationItem,
  ApplicationSummary,
  ApplicationStatus,
} from '../../../types/instructorApplication';
import {
  IconlyWork,
  IconlyTick,
  IconlyClose,
  IconlyTimeCircle,
  IconlySearch,
} from '../../Onboarding/IconlyIcons';
import './InstructorApplicationManagement.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

type FilterTab = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const InstructorApplicationManagement: React.FC = () => {
  const [applications, setApplications] = useState<InstructorApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ApplicationSummary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal & Detail states
  const [selectedApp, setSelectedApp] = useState<InstructorApplicationItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

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
    const params: { status?: string; search?: string } = {};
    if (activeTab !== 'all') {
      params.status = activeTab;
    }
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    instructorApplicationApi
      .getApplications(params)
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setApplications(res.data.applications);
          setSummary(res.data.summary);
        } else {
          addToast(res.message || 'Lỗi tải danh sách đơn đăng ký', 'error');
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
  }, [activeTab, searchTerm, addToast, refreshTrigger]);

  const reload = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleApprove = useCallback(
    (id: string) => {
      setActionLoading(id);
      instructorApplicationApi
        .approveApplication(id)
        .then((res) => {
          if (res.success) {
            addToast(res.message || 'Đã phê duyệt đơn đăng ký giảng viên thành công!', 'success');
            setShowDetailModal(false);
            setSelectedApp(null);
            reload();
          } else {
            addToast(res.message || 'Lỗi phê duyệt đơn', 'error');
          }
          setActionLoading(null);
        })
        .catch(() => {
          addToast('Lỗi kết nối máy chủ', 'error');
          setActionLoading(null);
        });
    },
    [addToast, reload],
  );

  const handleReject = useCallback(() => {
    if (!rejectingAppId) return;
    setActionLoading(rejectingAppId);
    instructorApplicationApi
      .rejectApplication(rejectingAppId, rejectionReason)
      .then((res) => {
        if (res.success) {
          addToast('Đã từ chối đơn đăng ký', 'warning');
          setRejectingAppId(null);
          setRejectionReason('');
          setShowDetailModal(false);
          setSelectedApp(null);
          reload();
        } else {
          addToast(res.message || 'Lỗi từ chối đơn', 'error');
        }
        setActionLoading(null);
      })
      .catch(() => {
        addToast('Lỗi kết nối máy chủ', 'error');
        setActionLoading(null);
      });
  }, [rejectingAppId, rejectionReason, addToast, reload]);

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="ia-badge ia-badge-pending">Chờ xét duyệt</span>;
      case 'APPROVED':
        return <span className="ia-badge ia-badge-approved">Đã duyệt (Giảng viên)</span>;
      case 'REJECTED':
        return <span className="ia-badge ia-badge-rejected">Đã từ chối</span>;
      default:
        return null;
    }
  };

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
    <div className="ia-management-root">
      {/* KPI Cards */}
      <div className="ia-kpi-row">
        <div className="ia-kpi-card">
          <div className="ia-kpi-icon ia-kpi-total">
            <IconlyWork size={20} color="#6366f1" />
          </div>
          <div className="ia-kpi-info">
            <span className="ia-kpi-value">{summary.total}</span>
            <span className="ia-kpi-label">Tổng số đơn</span>
          </div>
        </div>

        <div className="ia-kpi-card">
          <div className="ia-kpi-icon ia-kpi-pending">
            <IconlyTimeCircle size={20} color="#f59e0b" />
          </div>
          <div className="ia-kpi-info">
            <span className="ia-kpi-value">{summary.pending}</span>
            <span className="ia-kpi-label">Đang chờ duyệt</span>
          </div>
        </div>

        <div className="ia-kpi-card">
          <div className="ia-kpi-icon ia-kpi-approved">
            <IconlyTick size={20} color="#10b981" />
          </div>
          <div className="ia-kpi-info">
            <span className="ia-kpi-value">{summary.approved}</span>
            <span className="ia-kpi-label">Đã phê duyệt</span>
          </div>
        </div>

        <div className="ia-kpi-card">
          <div className="ia-kpi-icon ia-kpi-rejected">
            <IconlyClose size={20} color="#ef4444" />
          </div>
          <div className="ia-kpi-info">
            <span className="ia-kpi-value">{summary.rejected}</span>
            <span className="ia-kpi-label">Đã từ chối</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ia-toolbar">
        <div className="ia-tabs">
          {([
            ['all', 'Tất cả'],
            ['PENDING', 'Chờ duyệt'],
            ['APPROVED', 'Đã duyệt'],
            ['REJECTED', 'Đã từ chối'],
          ] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`ia-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {key === 'PENDING' && summary.pending > 0 && (
                <span className="ia-tab-badge">{summary.pending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="ia-search-box">
          <IconlySearch size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, chuyên môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="ia-loading">
          <div className="ia-spinner" />
          <span>Đang tải danh sách đơn đăng ký...</span>
        </div>
      ) : applications.length === 0 ? (
        <div className="ia-empty">
          <IconlyWork size={48} color="#d1d5db" />
          <p>Không có đơn đăng ký nào{activeTab !== 'all' ? ' trong mục này' : ''}</p>
        </div>
      ) : (
        <div className="ia-list">
          {applications.map((app) => (
            <div key={app._id} className={`ia-card ${app.status.toLowerCase()}`}>
              <div className="ia-card-header">
                <div className="ia-applicant-meta">
                  <img
                    src={
                      app.userId?.avatarUrl ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(app.email)}`
                    }
                    alt=""
                    className="ia-applicant-avatar"
                  />
                  <div>
                    <div className="ia-applicant-name-row">
                      <span className="ia-applicant-name">{app.fullName}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <span className="ia-applicant-sub">
                      {app.email} • {app.phoneNumber}
                    </span>
                  </div>
                </div>
                <span className="ia-card-date">{formatDate(app.createdAt)}</span>
              </div>

              <div className="ia-card-body">
                <div className="ia-body-field">
                  <span className="ia-field-label">Chuyên môn:</span>
                  <span className="ia-field-value ia-expertise-tag">{app.expertise}</span>
                  {app.experienceYears !== undefined && (
                    <span className="ia-exp-tag">({app.experienceYears} năm kinh nghiệm)</span>
                  )}
                </div>

                {app.teachingTopics && (
                  <div className="ia-body-field">
                    <span className="ia-field-label">Đề tài dự kiến:</span>
                    <span className="ia-field-value">{app.teachingTopics}</span>
                  </div>
                )}

                {app.bio && (
                  <div className="ia-body-field">
                    <span className="ia-field-label">Tóm tắt:</span>
                    <span className="ia-field-value ia-bio-snippet">
                      "{app.bio.length > 180 ? app.bio.substring(0, 180) + '...' : app.bio}"
                    </span>
                  </div>
                )}

                {(app.portfolioUrl || app.cvUrl) && (
                  <div className="ia-links-row">
                    {app.portfolioUrl && (
                      <a
                        href={app.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ia-link-btn"
                      >
                        🔗 Portfolio / LinkedIn
                      </a>
                    )}
                    {app.cvUrl && (
                      <a
                        href={app.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ia-link-btn"
                      >
                        📄 CV / Hồ sơ năng lực
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="ia-card-footer">
                {app.status === 'PENDING' ? (
                  <div className="ia-actions-row">
                    <button
                      type="button"
                      className="ia-btn ia-btn-approve"
                      disabled={actionLoading === app._id}
                      onClick={() => handleApprove(app._id)}
                    >
                      <IconlyTick size={15} color="currentColor" />
                      Duyệt làm Giảng viên
                    </button>
                    <button
                      type="button"
                      className="ia-btn ia-btn-reject"
                      disabled={actionLoading === app._id}
                      onClick={() => setRejectingAppId(app._id)}
                    >
                      <IconlyClose size={15} color="currentColor" />
                      Từ chối
                    </button>
                    <button
                      type="button"
                      className="ia-btn ia-btn-detail"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowDetailModal(true);
                      }}
                    >
                      Xem toàn bộ hồ sơ
                    </button>
                  </div>
                ) : (
                  <div className="ia-reviewed-info">
                    <span>
                      {app.status === 'APPROVED' ? 'Đã phê duyệt' : 'Đã từ chối'}
                    </span>
                    {app.reviewedBy && (
                      <span className="ia-reviewer">bởi {app.reviewedBy.fullName}</span>
                    )}
                    {app.reviewedAt && (
                      <span className="ia-reviewed-date">lúc {formatDate(app.reviewedAt)}</span>
                    )}
                    {app.rejectionReason && (
                      <span className="ia-rejection-reason">
                        (Lý do: {app.rejectionReason})
                      </span>
                    )}
                    <button
                      type="button"
                      className="ia-btn ia-btn-detail"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => {
                        setSelectedApp(app);
                        setShowDetailModal(true);
                      }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="ia-modal-overlay" onClick={() => setRejectingAppId(null)}>
          <div className="ia-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="ia-modal-title">Từ chối đơn đăng ký</h3>
            <p className="ia-modal-desc">
              Vui lòng nhập lý do từ chối để học viên có thể hoàn thiện hồ sơ:
            </p>
            <textarea
              className="ia-modal-textarea"
              rows={3}
              placeholder="Ví dụ: Chưa cung cấp đủ chứng chỉ hoặc dự án minh chứng chuyên môn..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="ia-modal-actions">
              <button
                type="button"
                className="ia-btn ia-btn-cancel"
                onClick={() => {
                  setRejectingAppId(null);
                  setRejectionReason('');
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="ia-btn ia-btn-reject-confirm"
                disabled={actionLoading === rejectingAppId}
                onClick={handleReject}
              >
                {actionLoading === rejectingAppId ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApp && (
        <div
          className="ia-modal-overlay"
          onClick={() => {
            setShowDetailModal(false);
            setSelectedApp(null);
          }}
        >
          <div className="ia-modal ia-modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="ia-modal-header">
              <h3>Hồ sơ đăng ký Giảng viên</h3>
              <button
                type="button"
                className="ia-modal-close"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedApp(null);
                }}
              >
                <IconlyClose size={18} color="currentColor" />
              </button>
            </div>

            <div className="ia-detail-body">
              <div className="ia-detail-user-card">
                <img
                  src={
                    selectedApp.userId?.avatarUrl ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(selectedApp.email)}`
                  }
                  alt=""
                  className="ia-detail-avatar"
                />
                <div className="ia-detail-user-meta">
                  <h4>{selectedApp.fullName}</h4>
                  <span>Email: {selectedApp.email}</span>
                  <span>Điện thoại: {selectedApp.phoneNumber}</span>
                  <span>Trạng thái: {getStatusBadge(selectedApp.status)}</span>
                </div>
              </div>

              <div className="ia-detail-field">
                <strong>Chuyên môn:</strong> {selectedApp.expertise} ({selectedApp.experienceYears || 0} năm kinh nghiệm)
              </div>

              {selectedApp.teachingTopics && (
                <div className="ia-detail-field">
                  <strong>Chủ đề dự kiến giảng dạy:</strong> {selectedApp.teachingTopics}
                </div>
              )}

              {selectedApp.bio && (
                <div className="ia-detail-field">
                  <strong>Tiểu sử & Kinh nghiệm:</strong>
                  <p className="ia-detail-bio">{selectedApp.bio}</p>
                </div>
              )}

              {(selectedApp.portfolioUrl || selectedApp.cvUrl) && (
                <div className="ia-detail-links">
                  {selectedApp.portfolioUrl && (
                    <a
                      href={selectedApp.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ia-link-btn"
                    >
                      🔗 Portfolio / LinkedIn
                    </a>
                  )}
                  {selectedApp.cvUrl && (
                    <a
                      href={selectedApp.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ia-link-btn"
                    >
                      📄 CV / Hồ sơ năng lực
                    </a>
                  )}
                </div>
              )}

              {selectedApp.status === 'PENDING' && (
                <div className="ia-detail-actions">
                  <button
                    type="button"
                    className="ia-btn ia-btn-approve"
                    disabled={actionLoading === selectedApp._id}
                    onClick={() => handleApprove(selectedApp._id)}
                  >
                    <IconlyTick size={16} color="currentColor" />
                    Duyệt làm Giảng viên ngay
                  </button>
                  <button
                    type="button"
                    className="ia-btn ia-btn-reject"
                    disabled={actionLoading === selectedApp._id}
                    onClick={() => setRejectingAppId(selectedApp._id)}
                  >
                    <IconlyClose size={16} color="currentColor" />
                    Từ chối đơn
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="ia-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`ia-toast ia-toast-${t.type}`}>
            {t.type === 'success' && <IconlyTick size={16} color="currentColor" />}
            {t.type === 'error' && <IconlyClose size={16} color="currentColor" />}
            {t.type === 'warning' && <IconlyTimeCircle size={16} color="currentColor" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
