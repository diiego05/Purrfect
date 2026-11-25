import { useState, useEffect } from 'react';
import { systemConfigApi } from '../../../services/systemConfigApi';
import type { SystemConfig } from '../../../types/systemConfig';
import { CONFIG_KEYS } from '../../../types/systemConfig';
import {
  IconlySetting,
  IconlyTick,
  IconlyClose,
  IconlySwap,
} from '../../Onboarding/IconlyIcons';
import './SystemConfigManagement.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastCounter = 0;

export default function SystemConfigManagement() {
  const [, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Finance form
  const [commissionRate, setCommissionRate] = useState('15');
  const [minWithdrawal, setMinWithdrawal] = useState('200000');
  const [purrPointRate, setPurrPointRate] = useState('1000');
  const [maxRefundTimes, setMaxRefundTimes] = useState('3');
  const [commissionError, setCommissionError] = useState('');
  const [minWithdrawalError, setMinWithdrawalError] = useState('');
  const [purrPointError, setPurrPointError] = useState('');
  const [maxRefundError, setMaxRefundError] = useState('');

  // Reset confirm
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const populateFormFromConfigs = (cfgs: SystemConfig[]) => {
    const map: Record<string, string> = {};
    cfgs.forEach((c) => {
      map[c.keyName] = c.valueText;
    });

    setCommissionRate(map[CONFIG_KEYS.COMMISSION_RATE_PERCENT] ?? '15');
    setMinWithdrawal(map[CONFIG_KEYS.MIN_WITHDRAWAL_AMOUNT] ?? '200000');
    setPurrPointRate(map[CONFIG_KEYS.PURR_POINT_RATE_VND] ?? '1000');
    setMaxRefundTimes(map[CONFIG_KEYS.MAX_REFUND_TIMES_PER_USER] ?? '3');
  };

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const cfgs = await systemConfigApi.getAll();
        if (!ignore) {
          setConfigs(cfgs);
          populateFormFromConfigs(cfgs);
        }
      } catch {
        if (!ignore) addToast('Lỗi khi tải dữ liệu cấu hình.', 'error');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => {
      ignore = true;
    };
  }, []);

  // ─── Finance save ───────────────────────────────────────────────
  const validateFinance = (): boolean => {
    let valid = true;
    const cr = parseFloat(commissionRate);
    if (isNaN(cr) || cr < 0 || cr > 100) {
      setCommissionError('Tỷ lệ hoa hồng phải từ 0 đến 100.');
      valid = false;
    } else {
      setCommissionError('');
    }
    const mw = parseFloat(minWithdrawal);
    if (isNaN(mw) || mw < 0) {
      setMinWithdrawalError('Số tiền rút tối thiểu phải ≥ 0.');
      valid = false;
    } else {
      setMinWithdrawalError('');
    }

    const pr = parseFloat(purrPointRate);
    if (isNaN(pr) || pr <= 0) {
      setPurrPointError(
        'Tỷ lệ quy đổi điểm PurrPoint phải lớn hơn 0 (Ví dụ: 1000).',
      );
      valid = false;
    } else {
      setPurrPointError('');
    }

    const mr = parseInt(maxRefundTimes, 10);
    if (isNaN(mr) || mr <= 0) {
      setMaxRefundError('Số lần hoàn tiền tối đa phải ≥ 1.');
      valid = false;
    } else {
      setMaxRefundError('');
    }

    return valid;
  };

  const saveFinanceConfigs = async () => {
    if (!validateFinance()) return;
    setSaving(true);
    try {
      await systemConfigApi.update([
        {
          keyName: CONFIG_KEYS.COMMISSION_RATE_PERCENT,
          valueText: commissionRate,
        },
        {
          keyName: CONFIG_KEYS.MIN_WITHDRAWAL_AMOUNT,
          valueText: minWithdrawal,
        },
        {
          keyName: CONFIG_KEYS.PURR_POINT_RATE_VND,
          valueText: purrPointRate,
        },
        {
          keyName: CONFIG_KEYS.MAX_REFUND_TIMES_PER_USER,
          valueText: maxRefundTimes,
        },
      ]);
      addToast('Lưu cấu hình tài chính thành công!', 'success');
      const cfgs = await systemConfigApi.getAll();
      setConfigs(cfgs);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset to defaults ──────────────────────────────────────────
  const handleReset = async () => {
    setShowResetConfirm(false);
    setSaving(true);
    try {
      await systemConfigApi.resetToDefaults();
      addToast('Đã khôi phục cài đặt mặc định thành công!', 'success');
      const cfgs = await systemConfigApi.getAll();
      setConfigs(cfgs);
      populateFormFromConfigs(cfgs);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Lỗi khi khôi phục cài đặt.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="scm-loading">
        <div className="scm-spinner"></div>
        <span>Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="scm-container">
      {/* Toast Notifications */}
      <div className="scm-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`scm-toast scm-toast--${t.type}`}>
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
      <div className="scm-header">
        <div>
          <h1
            className="scm-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <IconlySetting size={26} color="#3b82f6" />
            <span>Cấu hình hệ thống</span>
          </h1>
          <p className="scm-subtitle">
            Quản lý cài đặt tài chính và các thông số vận hành nền tảng
          </p>
        </div>
        <button
          className="scm-btn scm-btn--danger-outline"
          onClick={() => setShowResetConfirm(true)}
          disabled={saving}
        >
          Khôi phục mặc định
        </button>
      </div>

      {/* Panel: Finance Configuration */}
      <div className="scm-panel">
        <h2 className="scm-panel-title">Cấu hình tài chính</h2>
        <p className="scm-panel-desc">
          Thiết lập các thông số liên quan đến tài chính, hoa hồng và rút tiền
          trên nền tảng.
        </p>

        <div className="scm-form-group">
          <label className="scm-label">
            Tỷ lệ hoa hồng nền tảng (%)
            <span className="scm-required">*</span>
          </label>
          <input
            type="number"
            className={`scm-input ${commissionError ? 'scm-input--error' : ''}`}
            value={commissionRate}
            min={0}
            max={100}
            step={0.5}
            onChange={(e) => {
              setCommissionRate(e.target.value);
              setCommissionError('');
            }}
            placeholder="Nhập tỷ lệ 0–100"
          />
          {commissionError && (
            <span className="scm-error-msg">{commissionError}</span>
          )}
          <span className="scm-hint">
            Phần trăm hoa hồng nền tảng thu từ doanh thu khóa học của giảng viên
            (0 đến 100%).
          </span>
        </div>

        <div className="scm-form-group">
          <label className="scm-label">
            Số tiền rút tối thiểu (VND)
            <span className="scm-required">*</span>
          </label>
          <input
            type="number"
            className={`scm-input ${minWithdrawalError ? 'scm-input--error' : ''}`}
            value={minWithdrawal}
            min={0}
            step={1000}
            onChange={(e) => {
              setMinWithdrawal(e.target.value);
              setMinWithdrawalError('');
            }}
            placeholder="Nhập số tiền tối thiểu"
          />
          {minWithdrawalError && (
            <span className="scm-error-msg">{minWithdrawalError}</span>
          )}
          <span className="scm-hint">
            Số tiền số dư khả dụng tối thiểu giảng viên cần đạt để gửi yêu cầu
            rút tiền (VD: 200000 = 200.000 VND).
          </span>
        </div>

        <div className="scm-form-group">
          <label className="scm-label">
            Tỷ lệ quy đổi điểm PurrPoint khi hoàn tiền (VNĐ / 1 Point)
            <span className="scm-required">*</span>
          </label>
          <input
            type="number"
            className={`scm-input ${purrPointError ? 'scm-input--error' : ''}`}
            value={purrPointRate}
            min={1}
            step={100}
            onChange={(e) => {
              setPurrPointRate(e.target.value);
              setPurrPointError('');
            }}
            placeholder="Mặc định: 1000"
          />
          {purrPointError && (
            <span className="scm-error-msg">{purrPointError}</span>
          )}
          <span className="scm-hint">
            Mức quy đổi tiền hoàn thành điểm PurrPoint cho học viên: Mặc định
            1.000 VNĐ = 1 point (Ví dụ: hoàn 200.000 VNĐ = 200 points).
          </span>
        </div>

        <div className="scm-form-group">
          <label className="scm-label">
            Số lần hoàn tiền tối đa cho mỗi tài khoản
            <span className="scm-required">*</span>
          </label>
          <input
            type="number"
            className={`scm-input ${maxRefundError ? 'scm-input--error' : ''}`}
            value={maxRefundTimes}
            min={1}
            max={20}
            step={1}
            onChange={(e) => {
              setMaxRefundTimes(e.target.value);
              setMaxRefundError('');
            }}
            placeholder="Mặc định: 3"
          />
          {maxRefundError && (
            <span className="scm-error-msg">{maxRefundError}</span>
          )}
          <span className="scm-hint">
            Số lần hoàn tiền tối đa mà mỗi học viên được phép thực hiện trên hệ
            thống (Mặc định: 3 lần).
          </span>
        </div>

        <div className="scm-form-actions">
          <button
            className="scm-btn scm-btn--primary"
            onClick={saveFinanceConfigs}
            disabled={saving}
          >
            {saving ? (
              'Đang lưu...'
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <IconlyTick size={15} color="#ffffff" />
                <span>Lưu cấu hình</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Reset Confirm Modal ───────────────────────────────────── */}
      {showResetConfirm && (
        <div
          className="scm-modal-overlay"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="scm-modal scm-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scm-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconlySwap size={18} color="#ef4444" />
                <span>Khôi phục cài đặt mặc định</span>
              </h3>
            </div>
            <div className="scm-modal-body">
              <p>
                Toàn bộ cài đặt tài chính sẽ được đặt lại về giá trị mặc định
                của hệ thống. Bạn có muốn tiếp tục không?
              </p>
            </div>
            <div className="scm-modal-footer">
              <button
                className="scm-btn scm-btn--outline"
                onClick={() => setShowResetConfirm(false)}
              >
                Hủy
              </button>
              <button
                className="scm-btn scm-btn--danger"
                onClick={handleReset}
                disabled={saving}
              >
                {saving ? 'Đang khôi phục...' : 'Khôi phục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
