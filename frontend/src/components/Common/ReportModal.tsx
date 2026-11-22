import React, { useState } from 'react';
import { moderationApi } from '../../services/moderationApi';
import type { ReportTargetType, ReportReason } from '../../types/moderation';
import { REPORT_REASON_LABELS } from '../../types/moderation';
import { IconlyDanger, IconlyClose, IconlyTick } from '../Onboarding/IconlyIcons';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onSuccess,
}) => {
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    moderationApi
      .submitReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      })
      .then((res) => {
        if (res.success) {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setDetails('');
            onSuccess?.();
            onClose();
          }, 1500);
        } else {
          setError(res.message || 'Không thể gửi báo cáo');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Lỗi kết nối máy chủ');
        setLoading(false);
      });
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <div className="report-modal-title">
            <IconlyDanger size={20} color="#ef4444" />
            <span>Báo cáo {targetType === 'DISCUSSION' ? 'thảo luận' : 'đánh giá'}</span>
          </div>
          <button type="button" className="report-modal-close" onClick={handleClose}>
            <IconlyClose size={18} color="#64748b" />
          </button>
        </div>

        {success ? (
          <div className="report-modal-success">
            <div className="report-modal-success-icon">
              <IconlyTick size={28} color="#10b981" />
            </div>
            <h4>Đã gửi báo cáo thành công</h4>
            <p>Cảm ơn bạn đã phản hồi. Quản trị viên sẽ xem xét và xử lý vi phạm trong thời gian sớm nhất.</p>
          </div>
        ) : (
          <form className="report-modal-form" onSubmit={handleSubmit}>
            {targetTitle && (
              <div className="report-modal-preview">
                "{targetTitle.length > 120 ? targetTitle.substring(0, 120) + '...' : targetTitle}"
              </div>
            )}

            {error && <div className="report-modal-error">{error}</div>}

            <div className="report-field-group">
              <label>Lý do báo cáo vi phạm *</label>
              <div className="report-reasons-list">
                {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((r) => (
                  <label key={r} className={`report-reason-item ${reason === r ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    <span>{REPORT_REASON_LABELS[r]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="report-field-group">
              <label htmlFor="reportDetails">Mô tả chi tiết (tùy chọn)</label>
              <textarea
                id="reportDetails"
                rows={3}
                placeholder="Cung cấp thêm ngữ cảnh về vi phạm..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="report-modal-actions">
              <button
                type="button"
                className="report-btn-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="report-btn-submit"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
