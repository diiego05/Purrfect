import { useState, useEffect } from 'react';
import { systemConfigApi } from '../../../services/systemConfigApi';
import type { SystemConfig } from '../../../types/systemConfig';
import { CONFIG_KEYS } from '../../../types/systemConfig';
import {
  IconlySetting,
  IconlyBuy,
  IconlyDiscount,
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
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Finance form
  const [commissionRate, setCommissionRate] = useState('15');
  const [minWithdrawal, setMinWithdrawal] = useState('200000');
  const [commissionError, setCommissionError] = useState('');
  const [minWithdrawalError, setMinWithdrawalError] = useState('');

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

  const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('vi-VN').format(num) + ' VND';
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

      {/* Stats bar */}
      <div className="scm-stats">
        <div className="scm-stat-card">
          <span className="scm-stat-icon">
            <IconlyDiscount size={22} color="#10b981" />
          </span>
          <div>
            <div className="scm-stat-value">{commissionRate}%</div>
            <div className="scm-stat-label">Hoa hồng</div>
          </div>
        </div>
        <div className="scm-stat-card">
          <span className="scm-stat-icon">
            <IconlyBuy size={22} color="#3b82f6" />
          </span>
          <div>
            <div className="scm-stat-value">
              {formatCurrency(minWithdrawal)}
            </div>
            <div className="scm-stat-label">Rút tối thiểu</div>
          </div>
        </div>
        <div className="scm-stat-card">
          <span className="scm-stat-icon">
            <IconlySetting size={22} color="#0056d2" />
          </span>
          <div>
            <div className="scm-stat-value">{configs.length}</div>
            <div className="scm-stat-label">Tổng cài đặt</div>
          </div>
        </div>
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
