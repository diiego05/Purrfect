import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import {
  IconlyUserGroup,
  IconlyImage,
  IconlyShield,
  IconlyTick,
  IconlyClose,
  IconlyEdit,
  IconlyTimeCircle,
} from '../Onboarding/IconlyIcons';
import './ProfilePage.css';

interface FormState {
  fullName: string;
  phoneNumber: string;
  bio: string;
  avatarUrl: string;
}

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isLoading, updateUser, navigate } = useAuth();

  const [form, setForm] = useState<FormState>(() => ({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  }));

  const [previewAvatar, setPreviewAvatar] = useState<string>(
    () => user?.avatarUrl || '',
  );
  const [prevUserId, setPrevUserId] = useState<string | undefined>(user?.id);

  // Cập nhật form state khi đối tượng user khởi tạo hoặc thay đổi (chuẩn React)
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setForm({
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
    });
    setPreviewAvatar(user.avatarUrl || '');
  }

  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Thông báo phản hồi giao diện
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [avatarError, setAvatarError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // BR04.2 & Exception Flow 4a: Kiểm tra tệp tin ảnh đại diện hợp lệ
  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');
    setErrorMessage('');
    setSuccessMessage('');

    // Danh sách định dạng ảnh hợp lệ (jpg, png, webp)
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    // 4a. Kiểm tra sai định dạng tệp tin
    const isValidFormat =
      validMimeTypes.includes(file.type) ||
      validExtensions.includes(fileExtension);

    if (!isValidFormat) {
      setAvatarError(
        'Tệp tin ảnh đại diện không hợp lệ (sai định dạng .jpg, .png, .webp). Hệ thống từ chối tải ảnh và giữ nguyên ảnh cũ trên tài khoản.',
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 4a. Kiểm tra dung lượng tệp tin vượt quá 5MB
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setAvatarError(
        `Tệp tin ảnh đại diện không hợp lệ (vượt quá dung lượng > 5MB: ${actualSizeMB}MB). Hệ thống từ chối tải ảnh và giữ nguyên ảnh cũ trên tài khoản.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Tệp hợp lệ: Hiển thị preview tức thời và tiến hành upload
    const localUrl = URL.createObjectURL(file);
    setPreviewAvatar(localUrl);
    setAvatarUploading(true);

    try {
      const res = await authApi.uploadAvatar(file);
      if (res.success && res.avatarUrl) {
        setForm((prev) => ({ ...prev, avatarUrl: res.avatarUrl || '' }));
        setPreviewAvatar(res.avatarUrl);
        updateUser({ avatarUrl: res.avatarUrl });
        setSuccessMessage('Tải ảnh đại diện mới thành công!');
      } else {
        // 4a2. Lỗi máy chủ -> Giữ nguyên ảnh cũ
        setAvatarError(
          res.message ||
            'Không thể tải ảnh đại diện lên máy chủ. Đã giữ nguyên ảnh cũ.',
        );
        setPreviewAvatar(user?.avatarUrl || '');
      }
    } catch (err: unknown) {
      setAvatarError(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải ảnh đại diện lên. Đã giữ nguyên ảnh cũ.',
      );
      setPreviewAvatar(user?.avatarUrl || '');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Khôi phục Form về thông tin ban đầu
  const handleReset = () => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
      setPreviewAvatar(user.avatarUrl || '');
    }
    setErrorMessage('');
    setAvatarError('');
    setSuccessMessage('');
  };

  // 4 & 5. Lưu thay đổi hồ sơ cá nhân
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setAvatarError('');

    // Kiểm tra tính hợp lệ
    const trimmedName = form.fullName.trim();
    if (!trimmedName) {
      setErrorMessage('Họ và tên không được để trống.');
      return;
    }
    if (trimmedName.length > 100) {
      setErrorMessage('Họ và tên không được vượt quá 100 ký tự.');
      return;
    }

    const trimmedPhone = form.phoneNumber.trim();
    if (trimmedPhone) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setErrorMessage(
          'Số điện thoại không hợp lệ. Vui lòng nhập định dạng 10 chữ số (Ví dụ: 0912345678 hoặc +84912345678).',
        );
        return;
      }
    }

    // BR04.3: Chỉ gửi bio nếu là Instructor
    const isInstructor = user?.role === 'INSTRUCTOR';
    const payload = {
      fullName: trimmedName,
      phoneNumber: trimmedPhone,
      bio: isInstructor ? form.bio.trim() : undefined,
      avatarUrl: form.avatarUrl || undefined,
    };

    setSubmitting(true);
    try {
      const res = await authApi.updateProfile(payload);
      if (res.success && res.user) {
        updateUser(res.user);
        setSuccessMessage('Cập nhật thông tin hồ sơ cá nhân thành công!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMessage(res.message || 'Không thể cập nhật hồ sơ cá nhân.');
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Lỗi kết nối máy chủ khi cập nhật.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page-loading">
        <div className="profile-spinner" />
        <p>Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  // PreCondition: Người dùng đã đăng nhập thành công vào hệ thống
  if (!isAuthenticated || !user) {
    return (
      <div className="profile-unauth-container">
        <div className="profile-unauth-card">
          <div className="profile-unauth-icon">
            <IconlyShield size={40} color="#0056d2" />
          </div>
          <h2>Yêu cầu đăng nhập</h2>
          <p>
            Vui lòng đăng nhập vào tài khoản Purrfect của bạn để truy cập và
            chỉnh sửa thông tin hồ sơ cá nhân.
          </p>
          <button
            type="button"
            className="profile-login-btn"
            onClick={() => navigate('/login')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  const isInstructor = user.role === 'INSTRUCTOR';

  return (
    <div className="profile-page-wrapper">
      {/* 1. Header Banner */}
      <section className="profile-header-banner">
        <div className="profile-banner-container">
          <nav className="profile-breadcrumb" aria-label="Breadcrumb">
            <span
              className="profile-bread-link"
              onClick={() => navigate('/')}
              role="button"
              tabIndex={0}
            >
              Trang chủ
            </span>
            <span className="profile-bread-sep">/</span>
            <span className="profile-bread-current">Hồ sơ cá nhân</span>
          </nav>

          <div className="profile-hero-content">
            <h1 className="profile-hero-title">Cấu hình hồ sơ cá nhân</h1>
            <p className="profile-hero-subtitle">
              Quản lý các thông tin cá nhân cơ bản và định danh của bạn trên nền
              tảng đào tạo Purrfect.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Body Form */}
      <main className="profile-main-container">
        <div className="profile-card">
          {/* Thông báo thành công */}
          {successMessage && (
            <div className="profile-alert profile-alert--success" role="alert">
              <span className="alert-icon">
                <IconlyTick size={20} color="#059669" />
              </span>
              <div className="alert-content">
                <strong>Thành công!</strong> {successMessage}
              </div>
              <button
                type="button"
                className="alert-close"
                onClick={() => setSuccessMessage('')}
                aria-label="Đóng"
              >
                <IconlyClose size={14} color="#059669" />
              </button>
            </div>
          )}

          {/* Thông báo lỗi cập nhật form */}
          {errorMessage && (
            <div className="profile-alert profile-alert--error" role="alert">
              <span className="alert-icon">
                <IconlyClose size={20} color="#dc2626" />
              </span>
              <div className="alert-content">
                <strong>Đã có lỗi xảy ra:</strong> {errorMessage}
              </div>
              <button
                type="button"
                className="alert-close"
                onClick={() => setErrorMessage('')}
                aria-label="Đóng"
              >
                <IconlyClose size={14} color="#dc2626" />
              </button>
            </div>
          )}

          {/* Cảnh báo lỗi tệp ảnh (Exception Flow 4a) */}
          {avatarError && (
            <div className="profile-alert profile-alert--warning" role="alert">
              <span className="alert-icon">
                <IconlyShield size={20} color="#d97706" />
              </span>
              <div className="alert-content">
                <strong>Cảnh báo định dạng ảnh:</strong> {avatarError}
              </div>
              <button
                type="button"
                className="alert-close"
                onClick={() => setAvatarError('')}
                aria-label="Đóng"
              >
                <IconlyClose size={14} color="#d97706" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form" noValidate>
            {/* Khối Ảnh đại diện */}
            <div className="profile-avatar-section">
              <div className="avatar-preview-wrap">
                {previewAvatar ? (
                  <img
                    src={previewAvatar}
                    alt={form.fullName || 'Ảnh đại diện'}
                    className="avatar-preview-img"
                  />
                ) : (
                  <div className="avatar-fallback-circle">
                    {(form.fullName || user.email || 'P')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {avatarUploading && (
                  <div className="avatar-upload-overlay">
                    <div className="avatar-upload-spinner" />
                    <span>Đang tải...</span>
                  </div>
                )}

                <button
                  type="button"
                  className="avatar-change-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Thay đổi ảnh đại diện (Tối đa 5MB: .jpg, .png, .webp)"
                  disabled={avatarUploading}
                >
                  <IconlyImage size={16} color="#ffffff" />
                </button>
              </div>

              <div className="avatar-meta-info">
                <h3 className="avatar-meta-name">
                  {form.fullName || user.email}
                </h3>
                <span className={`role-badge role-${user.role.toLowerCase()}`}>
                  {user.role === 'INSTRUCTOR'
                    ? 'Giảng viên'
                    : user.role === 'ADMIN'
                      ? 'Quản trị viên'
                      : 'Học viên'}
                </span>
                <p className="avatar-rule-hint">
                  Hỗ trợ định dạng: <strong>.jpg, .png, .webp</strong> (Dung
                  lượng tối đa <strong>5MB</strong>).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="profile-form-divider" />

            {/* Thông tin cố định / Bảo mật tài khoản (BR04.1) */}
            <div className="profile-section-title-group">
              <h2 className="profile-section-heading">Thông tin tài khoản</h2>
              <p className="profile-section-sub">
                Địa chỉ email đăng nhập và vai trò người dùng được bảo vệ, không
                thể tự thay đổi.
              </p>
            </div>

            <div className="profile-fields-grid">
              {/* Email đăng nhập (Readonly / Disabled) */}
              <div className="form-group">
                <label htmlFor="user-email" className="form-label">
                  Địa chỉ Email đăng nhập
                  <span className="label-badge-locked">Cố định</span>
                </label>
                <div className="input-locked-wrap">
                  <input
                    id="user-email"
                    type="email"
                    className="form-input form-input--disabled"
                    value={user.email}
                    disabled
                    readOnly
                  />
                  <span
                    className="input-lock-icon"
                    title="Email không thể chỉnh sửa"
                  >
                    <IconlyShield size={16} color="#94a3b8" />
                  </span>
                </div>
                <span className="form-field-hint">
                  Email dùng để đăng nhập và nhận thông báo từ nền tảng.
                </span>
              </div>

              {/* Vai trò tài khoản (Readonly) */}
              <div className="form-group">
                <label htmlFor="user-role" className="form-label">
                  Vai trò tài khoản
                  <span className="label-badge-locked">Cố định</span>
                </label>
                <div className="input-locked-wrap">
                  <input
                    id="user-role"
                    type="text"
                    className="form-input form-input--disabled"
                    value={
                      user.role === 'INSTRUCTOR'
                        ? 'Giảng viên (Instructor)'
                        : user.role === 'ADMIN'
                          ? 'Quản trị viên (Admin)'
                          : 'Học viên (Student)'
                    }
                    disabled
                    readOnly
                  />
                  <span
                    className="input-lock-icon"
                    title="Vai trò do Admin phân quyền"
                  >
                    <IconlyUserGroup size={16} color="#94a3b8" />
                  </span>
                </div>
                <span className="form-field-hint">
                  Vai trò được cấp và quản lý bởi Quản trị viên hệ thống.
                </span>
              </div>
            </div>

            <div className="profile-form-divider" />

            {/* Thông tin cá nhân cơ bản (Cho phép chỉnh sửa) */}
            <div className="profile-section-title-group">
              <h2 className="profile-section-heading">
                Thông tin cá nhân cơ bản
              </h2>
              <p className="profile-section-sub">
                Cập nhật họ tên hiển thị và số điện thoại liên hệ của bạn.
              </p>
            </div>

            <div className="profile-fields-grid">
              {/* Họ và tên */}
              <div className="form-group">
                <label htmlFor="user-fullname" className="form-label required">
                  Họ và tên
                </label>
                <div className="input-icon-wrap">
                  <input
                    id="user-fullname"
                    type="text"
                    className="form-input"
                    placeholder="Nhập họ và tên của bạn"
                    value={form.fullName}
                    maxLength={100}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    required
                  />
                  <span className="input-trailing-icon">
                    <IconlyEdit size={16} color="#94a3b8" />
                  </span>
                </div>
                <span className="form-field-hint">
                  Tên này sẽ hiển thị trên giấy chứng chỉ và hồ sơ công khai của
                  bạn.
                </span>
              </div>

              {/* Số điện thoại */}
              <div className="form-group">
                <label htmlFor="user-phone" className="form-label">
                  Số điện thoại
                </label>
                <div className="input-icon-wrap">
                  <input
                    id="user-phone"
                    type="tel"
                    className="form-input"
                    placeholder="Ví dụ: 0912345678"
                    value={form.phoneNumber}
                    maxLength={15}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                  <span className="input-trailing-icon">
                    <IconlyTimeCircle size={16} color="#94a3b8" />
                  </span>
                </div>
                <span className="form-field-hint">
                  Hỗ trợ định dạng 10 chữ số (Đầu 03, 05, 07, 08, 09 hoặc +84).
                </span>
              </div>
            </div>

            {/* BR04.3: Phần giới thiệu bản thân (Chỉ dành riêng cho Instructor) */}
            {isInstructor ? (
              <div className="form-group bio-form-group">
                <div className="bio-label-row">
                  <label htmlFor="user-bio" className="form-label">
                    Giới thiệu bản thân (Bio)
                    <span className="label-badge-instructor">
                      Dành riêng cho Giảng viên
                    </span>
                  </label>
                  <span
                    className={`bio-counter ${form.bio.length >= 500 ? 'bio-counter--limit' : ''}`}
                  >
                    {form.bio.length}/500 ký tự
                  </span>
                </div>
                <textarea
                  id="user-bio"
                  rows={4}
                  className="form-textarea"
                  placeholder="Chia sẻ về quá trình công tác, chuyên môn chuyên sâu, các chứng chỉ quốc tế và định hướng giảng dạy của bạn..."
                  value={form.bio}
                  maxLength={500}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                />
                <span className="form-field-hint">
                  Phần giới thiệu sẽ được hiển thị ở mục thông tin Giảng viên
                  trong các khóa học mà bạn giảng dạy.
                </span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="profile-actions-bar">
              <button
                type="button"
                className="btn-profile-secondary"
                onClick={handleReset}
                disabled={submitting}
              >
                Khôi phục ban đầu
              </button>
              <button
                type="submit"
                className="btn-profile-primary"
                disabled={submitting || avatarUploading}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Đang lưu thay đổi...</span>
                  </>
                ) : (
                  <>
                    <IconlyTick size={16} color="#ffffff" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
