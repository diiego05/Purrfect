import { useState, useEffect } from 'react';
import { systemConfigApi, bannerApi } from '../../../services/systemConfigApi';
import type { SystemConfig, Banner } from '../../../types/systemConfig';
import { CONFIG_KEYS } from '../../../types/systemConfig';
import './SystemConfigManagement.css';

type TabId = 'finance' | 'banners' | 'ui';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface BannerFormData {
  imageUrl: string;
  title: string;
  linkUrl: string;
  orderIndex: number;
  isActive: boolean;
}

const DEFAULT_BANNER_FORM: BannerFormData = {
  imageUrl: '',
  title: '',
  linkUrl: '',
  orderIndex: 0,
  isActive: true,
};

let toastCounter = 0;

export default function SystemConfigManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('finance');
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Finance form
  const [commissionRate, setCommissionRate] = useState('15');
  const [minWithdrawal, setMinWithdrawal] = useState('200000');
  const [commissionError, setCommissionError] = useState('');
  const [minWithdrawalError, setMinWithdrawalError] = useState('');

  // UI form
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerFacebook, setFooterFacebook] = useState('');
  const [footerYoutube, setFooterYoutube] = useState('');
  const [footerZalo, setFooterZalo] = useState('');

  // Banner modal
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerFormData>(DEFAULT_BANNER_FORM);
  const [bannerFormError, setBannerFormError] = useState('');
  const [bannerSaving, setBannerSaving] = useState(false);

  // Delete confirm
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);

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
    cfgs.forEach((c) => { map[c.keyName] = c.valueText; });

    setCommissionRate(map[CONFIG_KEYS.COMMISSION_RATE_PERCENT] ?? '15');
    setMinWithdrawal(map[CONFIG_KEYS.MIN_WITHDRAWAL_AMOUNT] ?? '200000');
    setHeroTitle(map[CONFIG_KEYS.HOME_HERO_TITLE] ?? '');
    setHeroSubtitle(map[CONFIG_KEYS.HOME_HERO_SUBTITLE] ?? '');
    setFooterEmail(map[CONFIG_KEYS.FOOTER_EMAIL] ?? '');
    setFooterPhone(map[CONFIG_KEYS.FOOTER_PHONE] ?? '');
    setFooterAddress(map[CONFIG_KEYS.FOOTER_ADDRESS] ?? '');
    setFooterFacebook(map[CONFIG_KEYS.FOOTER_FACEBOOK] ?? '');
    setFooterYoutube(map[CONFIG_KEYS.FOOTER_YOUTUBE] ?? '');
    setFooterZalo(map[CONFIG_KEYS.FOOTER_ZALO] ?? '');
  };

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cfgs, bans] = await Promise.all([
          systemConfigApi.getAll(),
          bannerApi.getAll(),
        ]);
        if (!ignore) {
          setConfigs(cfgs);
          setBanners(bans);
          populateFormFromConfigs(cfgs);
        }
      } catch {
        if (!ignore) addToast('Lỗi khi tải dữ liệu cấu hình.', 'error');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => { ignore = true; };
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
        { keyName: CONFIG_KEYS.COMMISSION_RATE_PERCENT, valueText: commissionRate },
        { keyName: CONFIG_KEYS.MIN_WITHDRAWAL_AMOUNT, valueText: minWithdrawal },
      ]);
      addToast('Lưu cấu hình tài chính thành công!', 'success');
      const cfgs = await systemConfigApi.getAll();
      setConfigs(cfgs);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── UI save ────────────────────────────────────────────────────
  const saveUiConfigs = async () => {
    setSaving(true);
    try {
      await systemConfigApi.update([
        { keyName: CONFIG_KEYS.HOME_HERO_TITLE, valueText: heroTitle },
        { keyName: CONFIG_KEYS.HOME_HERO_SUBTITLE, valueText: heroSubtitle },
        { keyName: CONFIG_KEYS.FOOTER_EMAIL, valueText: footerEmail },
        { keyName: CONFIG_KEYS.FOOTER_PHONE, valueText: footerPhone },
        { keyName: CONFIG_KEYS.FOOTER_ADDRESS, valueText: footerAddress },
        { keyName: CONFIG_KEYS.FOOTER_FACEBOOK, valueText: footerFacebook },
        { keyName: CONFIG_KEYS.FOOTER_YOUTUBE, valueText: footerYoutube },
        { keyName: CONFIG_KEYS.FOOTER_ZALO, valueText: footerZalo },
      ]);
      addToast('Lưu cấu hình giao diện thành công!', 'success');
      const cfgs = await systemConfigApi.getAll();
      setConfigs(cfgs);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Lỗi khi lưu cấu hình.', 'error');
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
      addToast(err instanceof Error ? err.message : 'Lỗi khi khôi phục cài đặt.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Banner CRUD ────────────────────────────────────────────────
  const openCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm({ ...DEFAULT_BANNER_FORM, orderIndex: banners.length });
    setBannerFormError('');
    setShowBannerModal(true);
  };

  const openEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      linkUrl: banner.linkUrl || '',
      orderIndex: banner.orderIndex,
      isActive: banner.isActive,
    });
    setBannerFormError('');
    setShowBannerModal(true);
  };

  const saveBanner = async () => {
    if (!bannerForm.imageUrl.trim()) {
      setBannerFormError('URL hình ảnh không được để trống.');
      return;
    }
    setBannerSaving(true);
    try {
      if (editingBanner) {
        const updated = await bannerApi.update(editingBanner._id, bannerForm);
        setBanners((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
        addToast('Cập nhật banner thành công!', 'success');
      } else {
        const created = await bannerApi.create(bannerForm);
        setBanners((prev) => [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex));
        addToast('Tạo banner thành công!', 'success');
      }
      setShowBannerModal(false);
    } catch (err) {
      setBannerFormError(err instanceof Error ? err.message : 'Lỗi khi lưu banner.');
    } finally {
      setBannerSaving(false);
    }
  };

  const handleToggleBanner = async (id: string) => {
    try {
      const updated = await bannerApi.toggle(id);
      setBanners((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      addToast(`Banner đã được ${updated.isActive ? 'kích hoạt' : 'tắt'}.`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Lỗi khi thay đổi trạng thái.', 'error');
    }
  };

  const confirmDeleteBanner = (id: string) => {
    setDeletingBannerId(id);
  };

  const handleDeleteBanner = async () => {
    if (!deletingBannerId) return;
    try {
      await bannerApi.delete(deletingBannerId);
      setBanners((prev) => prev.filter((b) => b._id !== deletingBannerId));
      addToast('Xóa banner thành công!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Lỗi khi xóa banner.', 'error');
    } finally {
      setDeletingBannerId(null);
    }
  };

  const moveBanner = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newBanners.length) return;

    [newBanners[index], newBanners[swapIndex]] = [newBanners[swapIndex], newBanners[index]];
    const updated = newBanners.map((b, i) => ({ ...b, orderIndex: i }));
    setBanners(updated);

    try {
      await bannerApi.reorder(updated.map((b) => ({ id: b._id, orderIndex: b.orderIndex })));
    } catch {
      addToast('Lỗi khi sắp xếp banner.', 'error');
      // Reload
      const fresh = await bannerApi.getAll();
      setBanners(fresh);
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
            <span>{t.type === 'success' ? '✓' : '✕'}</span>
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="scm-header">
        <div>
          <h1 className="scm-title">⚙️ Cấu hình hệ thống</h1>
          <p className="scm-subtitle">Quản lý cài đặt tài chính, banner quảng cáo và nội dung giao diện</p>
        </div>
        <button
          className="scm-btn scm-btn--danger-outline"
          onClick={() => setShowResetConfirm(true)}
          disabled={saving}
        >
          🔄 Khôi phục mặc định
        </button>
      </div>

      {/* Stats bar */}
      <div className="scm-stats">
        <div className="scm-stat-card">
          <span className="scm-stat-icon">💰</span>
          <div>
            <div className="scm-stat-value">{commissionRate}%</div>
            <div className="scm-stat-label">Hoa hồng</div>
          </div>
        </div>
        <div className="scm-stat-card">
          <span className="scm-stat-icon">💵</span>
          <div>
            <div className="scm-stat-value">{formatCurrency(minWithdrawal)}</div>
            <div className="scm-stat-label">Rút tối thiểu</div>
          </div>
        </div>
        <div className="scm-stat-card">
          <span className="scm-stat-icon">🖼️</span>
          <div>
            <div className="scm-stat-value">{banners.length}</div>
            <div className="scm-stat-label">Tổng banner</div>
          </div>
        </div>
        <div className="scm-stat-card">
          <span className="scm-stat-icon">✅</span>
          <div>
            <div className="scm-stat-value">{banners.filter((b) => b.isActive).length}</div>
            <div className="scm-stat-label">Banner đang hiện</div>
          </div>
        </div>
        <div className="scm-stat-card">
          <span className="scm-stat-icon">🔧</span>
          <div>
            <div className="scm-stat-value">{configs.length}</div>
            <div className="scm-stat-label">Tổng cài đặt</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="scm-tabs">
        <button
          className={`scm-tab ${activeTab === 'finance' ? 'scm-tab--active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          💰 Tài chính
        </button>
        <button
          className={`scm-tab ${activeTab === 'banners' ? 'scm-tab--active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          🖼️ Banner quảng cáo
        </button>
        <button
          className={`scm-tab ${activeTab === 'ui' ? 'scm-tab--active' : ''}`}
          onClick={() => setActiveTab('ui')}
        >
          🎨 Nội dung giao diện
        </button>
      </div>

      {/* ── Tab: Finance ──────────────────────────────────────────── */}
      {activeTab === 'finance' && (
        <div className="scm-panel">
          <h2 className="scm-panel-title">Cấu hình tài chính</h2>
          <p className="scm-panel-desc">Thiết lập các thông số liên quan đến tài chính và thanh toán trên nền tảng.</p>

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
              onChange={(e) => { setCommissionRate(e.target.value); setCommissionError(''); }}
              placeholder="Nhập tỷ lệ 0–100"
            />
            {commissionError && <span className="scm-error-msg">{commissionError}</span>}
            <span className="scm-hint">
              Phần trăm hoa hồng nền tảng thu từ doanh thu của giảng viên. Giá trị từ 0 đến 100.
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
              onChange={(e) => { setMinWithdrawal(e.target.value); setMinWithdrawalError(''); }}
              placeholder="Nhập số tiền tối thiểu"
            />
            {minWithdrawalError && <span className="scm-error-msg">{minWithdrawalError}</span>}
            <span className="scm-hint">
              Số tiền tối thiểu giảng viên cần đạt để thực hiện yêu cầu rút tiền. (VD: 200000 = 200.000 VND)
            </span>
          </div>

          <div className="scm-form-actions">
            <button className="scm-btn scm-btn--primary" onClick={saveFinanceConfigs} disabled={saving}>
              {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Banners ──────────────────────────────────────────── */}
      {activeTab === 'banners' && (
        <div className="scm-panel">
          <div className="scm-panel-header">
            <div>
              <h2 className="scm-panel-title">Quản lý Banner quảng cáo</h2>
              <p className="scm-panel-desc">Thêm, sửa, xóa và sắp xếp thứ tự banner hiển thị trên trang chủ.</p>
            </div>
            <button className="scm-btn scm-btn--primary" onClick={openCreateBanner}>
              + Thêm banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="scm-empty">
              <div className="scm-empty-icon">🖼️</div>
              <p>Chưa có banner nào. Nhấn &quot;Thêm banner&quot; để bắt đầu.</p>
            </div>
          ) : (
            <div className="scm-banner-list">
              {banners.map((banner, index) => (
                <div key={banner._id} className={`scm-banner-row ${!banner.isActive ? 'scm-banner-row--inactive' : ''}`}>
                  <div className="scm-banner-order">
                    <button
                      className="scm-order-btn"
                      onClick={() => moveBanner(index, 'up')}
                      disabled={index === 0}
                      title="Di chuyển lên"
                    >▲</button>
                    <span className="scm-order-num">{index + 1}</span>
                    <button
                      className="scm-order-btn"
                      onClick={() => moveBanner(index, 'down')}
                      disabled={index === banners.length - 1}
                      title="Di chuyển xuống"
                    >▼</button>
                  </div>

                  <div className="scm-banner-preview">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="scm-banner-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/120x60?text=No+Image';
                      }}
                    />
                  </div>

                  <div className="scm-banner-info">
                    <div className="scm-banner-title">{banner.title || <em className="scm-no-value">Không có tiêu đề</em>}</div>
                    {banner.linkUrl && (
                      <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="scm-banner-link">
                        {banner.linkUrl}
                      </a>
                    )}
                    <div className="scm-banner-meta">ID: {banner._id.slice(-6)}</div>
                  </div>

                  <div className="scm-banner-actions">
                    <label className="scm-toggle" title={banner.isActive ? 'Đang hiển thị' : 'Đang ẩn'}>
                      <input
                        type="checkbox"
                        checked={banner.isActive}
                        onChange={() => handleToggleBanner(banner._id)}
                      />
                      <span className="scm-toggle-slider"></span>
                    </label>
                    <span className={`scm-status-badge ${banner.isActive ? 'scm-status-badge--active' : 'scm-status-badge--inactive'}`}>
                      {banner.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                    <button className="scm-btn scm-btn--sm scm-btn--outline" onClick={() => openEditBanner(banner)}>
                      ✏️ Sửa
                    </button>
                    <button className="scm-btn scm-btn--sm scm-btn--danger" onClick={() => confirmDeleteBanner(banner._id)}>
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: UI Content ───────────────────────────────────────── */}
      {activeTab === 'ui' && (
        <div className="scm-panel">
          <h2 className="scm-panel-title">Nội dung giao diện</h2>
          <p className="scm-panel-desc">Cấu hình tiêu đề trang chủ và thông tin liên hệ hiển thị ở footer.</p>

          <div className="scm-section">
            <h3 className="scm-section-title">🏠 Banner trang chủ</h3>
            <div className="scm-form-group">
              <label className="scm-label">Tiêu đề chính (Hero Title)</label>
              <input
                type="text"
                className="scm-input"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="VD: Nền tảng học trực tuyến hàng đầu"
              />
            </div>
            <div className="scm-form-group">
              <label className="scm-label">Mô tả phụ (Hero Subtitle)</label>
              <textarea
                className="scm-textarea"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="VD: Khám phá hàng nghìn khóa học chất lượng cao"
                rows={3}
              />
            </div>
          </div>

          <div className="scm-section">
            <h3 className="scm-section-title">📞 Thông tin liên hệ (Footer)</h3>
            <div className="scm-form-row">
              <div className="scm-form-group">
                <label className="scm-label">Email hỗ trợ</label>
                <input
                  type="email"
                  className="scm-input"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  placeholder="support@learnova.vn"
                />
              </div>
              <div className="scm-form-group">
                <label className="scm-label">Hotline</label>
                <input
                  type="text"
                  className="scm-input"
                  value={footerPhone}
                  onChange={(e) => setFooterPhone(e.target.value)}
                  placeholder="1900 1234"
                />
              </div>
            </div>
            <div className="scm-form-group">
              <label className="scm-label">Địa chỉ</label>
              <input
                type="text"
                className="scm-input"
                value={footerAddress}
                onChange={(e) => setFooterAddress(e.target.value)}
                placeholder="TP. Hồ Chí Minh, Việt Nam"
              />
            </div>
          </div>

          <div className="scm-section">
            <h3 className="scm-section-title">🌐 Mạng xã hội</h3>
            <div className="scm-form-group">
              <label className="scm-label">Facebook</label>
              <input
                type="url"
                className="scm-input"
                value={footerFacebook}
                onChange={(e) => setFooterFacebook(e.target.value)}
                placeholder="https://facebook.com/learnova"
              />
            </div>
            <div className="scm-form-group">
              <label className="scm-label">YouTube</label>
              <input
                type="url"
                className="scm-input"
                value={footerYoutube}
                onChange={(e) => setFooterYoutube(e.target.value)}
                placeholder="https://youtube.com/@learnova"
              />
            </div>
            <div className="scm-form-group">
              <label className="scm-label">Zalo</label>
              <input
                type="text"
                className="scm-input"
                value={footerZalo}
                onChange={(e) => setFooterZalo(e.target.value)}
                placeholder="https://zalo.me/learnova"
              />
            </div>
          </div>

          <div className="scm-form-actions">
            <button className="scm-btn scm-btn--primary" onClick={saveUiConfigs} disabled={saving}>
              {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
            </button>
          </div>
        </div>
      )}

      {/* ── Banner Modal ──────────────────────────────────────────── */}
      {showBannerModal && (
        <div className="scm-modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="scm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scm-modal-header">
              <h3>{editingBanner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}</h3>
              <button className="scm-modal-close" onClick={() => setShowBannerModal(false)}>✕</button>
            </div>
            <div className="scm-modal-body">
              {bannerFormError && <div className="scm-alert scm-alert--error">{bannerFormError}</div>}

              <div className="scm-form-group">
                <label className="scm-label">URL hình ảnh <span className="scm-required">*</span></label>
                <input
                  type="url"
                  className={`scm-input ${bannerFormError && !bannerForm.imageUrl.trim() ? 'scm-input--error' : ''}`}
                  value={bannerForm.imageUrl}
                  onChange={(e) => { setBannerForm((f) => ({ ...f, imageUrl: e.target.value })); setBannerFormError(''); }}
                  placeholder="https://example.com/banner.jpg"
                  autoFocus
                />
                {bannerForm.imageUrl && (
                  <div className="scm-banner-preview-box">
                    <img
                      src={bannerForm.imageUrl}
                      alt="Preview"
                      className="scm-banner-preview-img"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Invalid+URL'; }}
                    />
                  </div>
                )}
              </div>

              <div className="scm-form-group">
                <label className="scm-label">Tiêu đề</label>
                <input
                  type="text"
                  className="scm-input"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Tiêu đề banner (tùy chọn)"
                />
              </div>

              <div className="scm-form-group">
                <label className="scm-label">Liên kết khi click</label>
                <input
                  type="url"
                  className="scm-input"
                  value={bannerForm.linkUrl}
                  onChange={(e) => setBannerForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://... (tùy chọn)"
                />
              </div>

              <div className="scm-form-row">
                <div className="scm-form-group">
                  <label className="scm-label">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    className="scm-input"
                    value={bannerForm.orderIndex}
                    min={0}
                    onChange={(e) => setBannerForm((f) => ({ ...f, orderIndex: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="scm-form-group scm-form-group--checkbox">
                  <label className="scm-label">Trạng thái</label>
                  <label className="scm-checkbox-label">
                    <input
                      type="checkbox"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    <span>Hiển thị banner</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="scm-modal-footer">
              <button className="scm-btn scm-btn--outline" onClick={() => setShowBannerModal(false)}>
                Hủy
              </button>
              <button className="scm-btn scm-btn--primary" onClick={saveBanner} disabled={bannerSaving}>
                {bannerSaving ? 'Đang lưu...' : editingBanner ? '💾 Cập nhật' : '+ Tạo banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────── */}
      {deletingBannerId && (
        <div className="scm-modal-overlay" onClick={() => setDeletingBannerId(null)}>
          <div className="scm-modal scm-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="scm-modal-header">
              <h3>🗑️ Xác nhận xóa banner</h3>
            </div>
            <div className="scm-modal-body">
              <p>Bạn có chắc chắn muốn xóa banner này không? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="scm-modal-footer">
              <button className="scm-btn scm-btn--outline" onClick={() => setDeletingBannerId(null)}>Hủy</button>
              <button className="scm-btn scm-btn--danger" onClick={handleDeleteBanner}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Confirm Modal ───────────────────────────────────── */}
      {showResetConfirm && (
        <div className="scm-modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="scm-modal scm-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="scm-modal-header">
              <h3>🔄 Khôi phục cài đặt mặc định</h3>
            </div>
            <div className="scm-modal-body">
              <p>Toàn bộ cài đặt tài chính và giao diện sẽ được đặt lại về giá trị mặc định của hệ thống. Bạn có muốn tiếp tục không?</p>
            </div>
            <div className="scm-modal-footer">
              <button className="scm-btn scm-btn--outline" onClick={() => setShowResetConfirm(false)}>Hủy</button>
              <button className="scm-btn scm-btn--danger" onClick={handleReset} disabled={saving}>
                {saving ? 'Đang khôi phục...' : 'Khôi phục'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

