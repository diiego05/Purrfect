import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import './AuthCard.css';

type AuthStep =
  | 'EMAIL'
  | 'LOGIN_PASSWORD'
  | 'REGISTER_OTP'
  | 'REGISTER_INFO'
  | 'FORGOT_REQUEST'
  | 'FORGOT_VERIFY';

export const AuthCard: React.FC = () => {
  const { loginSuccess } = useAuth();

  // Form states
  const [step, setStep] = useState<AuthStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // 6-box OTP states for Register
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 6-box OTP states for Forgot Password
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const forgotOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState('');

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Đếm ngược 2 phút (120s) trước khi cho phép gửi lại mã OTP
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };


  // Helper cho 6 ô OTP
  const handleOtpBoxChange = (
    index: number,
    value: string,
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    if (char && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    digits: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleOtpBoxPaste = (
    e: React.ClipboardEvent<HTMLDivElement | HTMLInputElement>,
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setDigits(updated);
    const targetIdx = Math.min(pasted.length, 5);
    refs.current[targetIdx]?.focus();
  };


  // 1. Bước 1: Nhập Email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Địa chỉ email không đúng định dạng');
      return;
    }

    if (!acceptTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản Sử dụng để tiếp tục');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.checkEmail(email.trim());
      if (!res.success) {
        setErrorMsg(res.message || 'Lỗi kiểm tra email');
        setLoading(false);
        return;
      }

      if (res.exists) {
        setStep('LOGIN_PASSWORD');
      } else {
        setOtpDigits(['', '', '', '', '', '']);
        setStep('REGISTER_OTP');
        setResendCooldown(120);
        setSuccessMsg('Mã xác nhận OTP đã được gửi đến email của bạn.');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      }

    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Bước 2A: Xác thực 6 số OTP
  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Vui lòng điền đủ 6 chữ số mã OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyRegisterOtp(email.trim(), code);
      if (res.success) {
        setStep('REGISTER_INFO');
        setSuccessMsg(null);
      } else {
        setErrorMsg(res.message || 'Mã OTP không chính xác hoặc đã hết hạn');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi xác thực OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP đăng ký
  const handleResendRegisterOtp = async () => {
    if (resendCooldown > 0) return;
    resetMessages();
    setLoading(true);
    try {
      const res = await authApi.resendRegisterOtp(email.trim());
      if (res.success) {
        setSuccessMsg('Mã xác nhận OTP mới đã được gửi đến email của bạn.');
        setResendCooldown(120);
        setOtpDigits(['', '', '', '', '', '']);
        otpInputsRef.current[0]?.focus();
      } else {
        setErrorMsg(res.message || 'Không thể gửi lại mã OTP');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi gửi lại mã OTP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  // 3. Bước 2B: Nhập thông tin & mật khẩu -> Hoàn tất đăng ký
  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của bạn');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    const code = otpDigits.join('');

    setLoading(true);
    try {
      const res = await authApi.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        otpCode: code,
      });

      if (res.success && (res.accessToken || res.token) && res.user) {
        loginSuccess(res.accessToken || res.token!, res.refreshToken, res.user);
      } else {
        setErrorMsg(res.message || 'Đăng ký không thành công');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi tạo tài khoản: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  // 4. Bước Đăng nhập khi đã có tài khoản
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      if (res.success && (res.accessToken || res.token) && res.user) {
        loginSuccess(res.accessToken || res.token!, res.refreshToken, res.user);
      } else {
        setErrorMsg(res.message || 'Đăng nhập không thành công');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi đăng nhập: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Quên mật khẩu: Gửi OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email để nhận mã OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.success) {
        setForgotOtpDigits(['', '', '', '', '', '']);
        setStep('FORGOT_VERIFY');
        setSuccessMsg('Mã xác nhận OTP đã được gửi đến email của bạn.');
        setTimeout(() => forgotOtpInputsRef.current[0]?.focus(), 100);
      } else {
        setErrorMsg(res.message || 'Không thể gửi mã xác nhận');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi gửi OTP: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  // 6. Quên mật khẩu: Xác nhận OTP 6 số & Đổi mật khẩu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const code = forgotOtpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPassword(email.trim(), code, newPassword);
      if (res.success) {
        setSuccessMsg('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.');
        setPassword('');
        setStep('LOGIN_PASSWORD');
      } else {
        setErrorMsg(res.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi đổi mật khẩu: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setLoading(false);
    }
  };

  // 7. Google OAuth
  const handleGoogleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await authApi.getGoogleAuthUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg(res.message || 'Chưa cấu hình GOOGLE_CLIENT_ID trong backend/.env');
      }
    } catch (err: any) {
      setErrorMsg('Không thể khởi tạo đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-card">
      {/* CỘT TRÁI: FORM AUTH */}
      <div className="auth-form-column">
        <h2 className="auth-header-title">Chào mừng đến với Purrfect</h2>
        <p className="auth-header-subtitle">
          {step === 'REGISTER_OTP'
            ? 'Mã xác nhận OTP đã được gửi đến email của bạn.'
            : step === 'REGISTER_INFO'
            ? 'Nhập thông tin cá nhân và mật khẩu để tạo tài khoản mới.'
            : step === 'FORGOT_REQUEST'
            ? 'Nhập email của bạn để nhận mã xác nhận OTP.'
            : step === 'FORGOT_VERIFY'
            ? 'Nhập mã xác nhận OTP và mật khẩu mới của bạn.'
            : 'Đăng nhập vào tài khoản Purr của bạn để tiếp tục học tập.'}
        </p>

        {/* Thông báo Alert */}
        {errorMsg && <div className="auth-alert auth-alert-error">{errorMsg}</div>}
        {successMsg && <div className="auth-alert auth-alert-success">{successMsg}</div>}

        {/* ============================================================== */}
        {/* BƯỚC 1: NHẬP EMAIL                                             */}
        {/* ============================================================== */}
        {step === 'EMAIL' && (
          <form onSubmit={handleCheckEmail}>
            <div className="auth-form-group">
              <label className="auth-input-label">
                EMAIL <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Checkbox Ghi nhớ đăng nhập */}
            <label className="auth-checkbox-row">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="auth-checkbox-label">Ghi nhớ đăng nhập</span>
            </label>

            {/* Nút Tiếp tục */}
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : 'Tiếp tục'}
            </button>

            {/* Đường kẻ HOẶC */}
            <div className="auth-divider">
              <span>HOẶC</span>
            </div>

            {/* Nút Tiếp tục với Google */}
            <button
              type="button"
              className="auth-btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Tiếp tục với Google
            </button>

            {/* Checkbox Chấp nhận điều khoản với link gạch chân */}
            <label className="auth-terms-row">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span className="auth-terms-text">
                Tôi chấp nhận{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-terms-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Điều khoản Sử dụng
                </a>{' '}
                và{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-terms-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Thông báo về quyền riêng tư
                </a>{' '}
                của Purrfect
              </span>
            </label>
          </form>
        )}

        {/* ============================================================== */}
        {/* NẾU ĐÃ CÓ TÀI KHOẢN -> NHẬP MẬT KHẨU LOGIN                     */}
        {/* ============================================================== */}
        {step === 'LOGIN_PASSWORD' && (
          <form onSubmit={handleLogin}>
            <div className="auth-email-badge">
              <span className="auth-email-badge-email">{email}</span>
              <button
                type="button"
                className="auth-change-email-btn"
                onClick={() => {
                  resetMessages();
                  setStep('EMAIL');
                }}
              >
                Thay đổi
              </button>
            </div>

            <div className="auth-form-group">
              <label className="auth-input-label">
                MẬT KHẨU <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Link Quên mật khẩu */}
            <span
              className="auth-forgot-link"
              onClick={() => {
                resetMessages();
                setStep('FORGOT_REQUEST');
              }}
            >
              Quên mật khẩu?
            </span>

            {/* Checkbox Ghi nhớ */}
            <label className="auth-checkbox-row">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="auth-checkbox-label">Ghi nhớ đăng nhập</span>
            </label>

            {/* Nút Đăng nhập */}
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : 'Đăng nhập'}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('EMAIL');
              }}
            >
              ← Quay lại
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* NẾU CHƯA CÓ TÀI KHOẢN -> MÀN HÌNH NHẬP 6 Ô OTP                  */}
        {/* ============================================================== */}
        {step === 'REGISTER_OTP' && (
          <form onSubmit={handleVerifyRegisterOtp}>
            <div className="auth-form-group">
              <label className="auth-input-label" style={{ justifyContent: 'center', marginBottom: 12 }}>
                NHẬP MÃ XÁC NHẬN OTP <span className="auth-star-required">*</span>
              </label>

              {/* 6 ô nhập OTP riêng biệt */}
              <div
                className="auth-otp-boxes-group"
                onPaste={(e) => handleOtpBoxPaste(e, setOtpDigits, otpInputsRef)}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="auth-otp-box"
                    value={digit}
                    onChange={(e) =>
                      handleOtpBoxChange(idx, e.target.value, otpDigits, setOtpDigits, otpInputsRef)
                    }
                    onKeyDown={(e) =>
                      handleOtpBoxKeyDown(idx, e, otpDigits, otpInputsRef)
                    }
                    autoFocus={idx === 0}
                  />
                ))}
              </div>


              {/* Nút gửi lại mã với thời gian đếm ngược 2 phút */}
              <div className="auth-resend-row">
                <button
                  type="button"
                  className="auth-resend-btn"
                  disabled={resendCooldown > 0}
                  onClick={handleResendRegisterOtp}
                  style={
                    resendCooldown > 0
                      ? { opacity: 0.6, cursor: 'not-allowed', color: '#94a3b8' }
                      : {}
                  }
                >
                  {resendCooldown > 0
                    ? `Gửi lại sau (${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60)
                        .toString()
                        .padStart(2, '0')})`
                    : 'Gửi lại mã'}
                </button>
              </div>

            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : 'Xác nhận OTP'}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('EMAIL');
              }}
            >
              ← Quay lại
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* BƯỚC TIẾP THEO: NHẬP THÔNG TIN VÀ MẬT KHẨU                      */}
        {/* ============================================================== */}
        {step === 'REGISTER_INFO' && (
          <form onSubmit={handleCompleteRegister}>
            <div className="auth-form-group">
              <label className="auth-input-label">
                HỌ VÀ TÊN <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-input-label">
                MẬT KHẨU (Ít nhất 6 ký tự) <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-input-label">
                XÁC NHẬN MẬT KHẨU <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : 'Hoàn tất đăng ký & Bắt đầu'}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('REGISTER_OTP');
              }}
            >
              ← Quay lại bước OTP
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* QUÊN MẬT KHẨU: YÊU CẦU MÃ OTP                                  */}
        {/* ============================================================== */}
        {step === 'FORGOT_REQUEST' && (
          <form onSubmit={handleRequestForgotOtp}>
            <div className="auth-form-group">
              <label className="auth-input-label">
                EMAIL CẦN KHÔI PHỤC <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : 'Gửi mã xác nhận OTP'}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('LOGIN_PASSWORD');
              }}
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* QUÊN MẬT KHẨU: NHẬP 6 Ô OTP & ĐẶT MẬT KHẨU MỚI                */}
        {/* ============================================================== */}
        {step === 'FORGOT_VERIFY' && (
          <form onSubmit={handleResetPassword}>
            <div className="auth-form-group">
              <label className="auth-input-label" style={{ justifyContent: 'center', marginBottom: 12 }}>
                NHẬP MÃ XÁC NHẬN OTP <span className="auth-star-required">*</span>
              </label>

              {/* 6 ô OTP */}
              <div
                className="auth-otp-boxes-group"
                onPaste={(e) => handleOtpBoxPaste(e, setForgotOtpDigits, forgotOtpInputsRef)}
              >
                {forgotOtpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      forgotOtpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="auth-otp-box"
                    value={digit}
                    onChange={(e) =>
                      handleOtpBoxChange(
                        idx,
                        e.target.value,
                        forgotOtpDigits,
                        setForgotOtpDigits,
                        forgotOtpInputsRef
                      )
                    }
                    onKeyDown={(e) =>
                      handleOtpBoxKeyDown(idx, e, forgotOtpDigits, forgotOtpInputsRef)
                    }
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

            </div>

            <div className="auth-form-group">
              <label className="auth-input-label">
                MẬT KHẨU MỚI <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <span className="auth-spinner"></span> : 'Xác nhận & Đổi mật khẩu'}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('FORGOT_REQUEST');
              }}
            >
              ← Gửi lại mã khác
            </button>
          </form>
        )}
      </div>

      {/* CỘT PHẢI: MINH HỌA NỀN TRÙNG VỚI NỀN TỔNG THỂ */}
      <div className="auth-illustration-column">
        <img
          src="/assets/Learning-bro.svg"
          alt="Purrfect Learning Illustration"
          className="auth-illustration-img"
        />
      </div>
    </div>
  );
};
