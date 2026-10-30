import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import './AuthCard.css';

type AuthStep =
  | 'LOGIN'
  | 'REGISTER_EMAIL'
  | 'REGISTER_OTP'
  | 'REGISTER_PASSWORD'
  | 'FORGOT_REQUEST'
  | 'FORGOT_VERIFY'
  | 'GOOGLE_ACCOUNT_DETECTED'
  | 'SET_GOOGLE_PASSWORD';

export interface AuthCardProps {
  initialStep?: AuthStep;
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialStep }) => {
  const { loginSuccess } = useAuth();

  const getInitialStep = (): AuthStep => {
    if (initialStep) return initialStep;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/register') return 'REGISTER_EMAIL';
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'register') return 'REGISTER_EMAIL';
    return 'LOGIN';
  };

  // Form states
  const [step, setStep] = useState<AuthStep>(getInitialStep);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 6-box OTP states for Register
  const [otpDigits, setOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Giới hạn gửi lại OTP đăng ký: tối đa 3 lần
  const [remainingResends, setRemainingResends] = useState<number>(3);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // 6-box OTP states for Forgot Password
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const forgotOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [newPassword, setNewPassword] = useState('');

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bộ đếm ngược thời gian gửi lại mã OTP (60s mỗi lần)
  useEffect(() => {
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
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
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
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleOtpBoxPaste = (
    e: React.ClipboardEvent<HTMLDivElement | HTMLInputElement>,
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setDigits(updated);
    const targetIdx = Math.min(pasted.length, 5);
    refs.current[targetIdx]?.focus();
  };

  // =========================================================================
  // 1. ĐĂNG NHẬP (EMAIL + MẬT KHẨU)
  // =========================================================================
  const handleLogin = async (e: React.FormEvent) => {
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

    if (!password) {
      setErrorMsg('Vui lòng nhập mật khẩu của bạn');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      if (res.success && (res.accessToken || res.token) && res.user) {
        loginSuccess(res.accessToken || res.token!, res.refreshToken, res.user);
      } else {
        setErrorMsg(res.message || 'Email hoặc mật khẩu không chính xác');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi đăng nhập: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại sau'),
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 2. ĐĂNG KÝ - BƯỚC 1: NHẬP EMAIL -> GỬI OTP
  // =========================================================================
  const handleRegisterEmail = async (e: React.FormEvent) => {
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
        setErrorMsg(
          'Email này đã được sử dụng. Vui lòng chuyển sang tab Đăng nhập để tiếp tục.',
        );
        setLoading(false);
        return;
      }

      // Email chưa có tài khoản -> OTP đã được gửi về email
      setOtpDigits(['', '', '', '', '', '']);
      setRemainingResends(
        res.remainingResends !== undefined ? res.remainingResends : 3,
      );
      setResendCooldown(60);
      setStep('REGISTER_OTP');
      setSuccessMsg(`Mã xác nhận OTP đã được gửi đến email: ${email.trim()}`);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 2. ĐĂNG KÝ - BƯỚC 2: XÁC THỰC OTP (GỬI LẠI TỐI ĐA 3 LẦN)
  // =========================================================================
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
        setPassword('');
        setConfirmPassword('');
        setStep('REGISTER_PASSWORD');
        setSuccessMsg(null);
      } else {
        setErrorMsg(res.message || 'Mã OTP không chính xác hoặc đã hết hạn');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi xác thực OTP: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại'),
      );
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP đăng ký (Tối đa 3 lần)
  const handleResendRegisterOtp = async () => {
    if (remainingResends <= 0) {
      setErrorMsg('Bạn đã hết số lần gửi lại mã OTP (tối đa 3 lần).');
      return;
    }
    if (resendCooldown > 0) return;

    resetMessages();
    setLoading(true);
    try {
      const res = await authApi.resendRegisterOtp(email.trim());
      if (res.success) {
        const updatedRemaining =
          res.remainingResends !== undefined
            ? res.remainingResends
            : Math.max(0, remainingResends - 1);

        setRemainingResends(updatedRemaining);
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg('Mã xác nhận OTP mới đã được gửi đến email của bạn.');
        otpInputsRef.current[0]?.focus();
      } else {
        if (res.remainingResends !== undefined) {
          setRemainingResends(res.remainingResends);
        }
        setErrorMsg(res.message || 'Không thể gửi lại mã OTP');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi gửi lại mã OTP: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại'),
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 2. ĐĂNG KÝ - BƯỚC 3: MẬT KHẨU (NHẬP LẠI) -> HOÀN TẤT ĐĂNG KÝ
  // =========================================================================
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
      setErrorMsg('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
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
        // Tài khoản mới đăng ký -> Chuyển hướng sang trang khảo sát Onboarding
        loginSuccess(
          res.accessToken || res.token!,
          res.refreshToken,
          res.user,
          '/onboarding',
        );
      } else {
        setErrorMsg(res.message || 'Đăng ký không thành công');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi tạo tài khoản: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại'),
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 3. QUÊN MẬT KHẨU
  // =========================================================================
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email cần khôi phục');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      if (res.success) {
        setForgotOtpDigits(['', '', '', '', '', '']);
        setStep('FORGOT_VERIFY');
        setSuccessMsg(
          'Mã OTP khôi phục mật khẩu đã được gửi đến email của bạn.',
        );
        setTimeout(() => forgotOtpInputsRef.current[0]?.focus(), 100);
      } else {
        setErrorMsg(res.message || 'Không thể gửi mã khôi phục');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi gửi mã OTP: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại sau'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const code = forgotOtpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Vui lòng điền đủ 6 chữ số mã OTP');
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
        setSuccessMsg(
          'Đổi mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
        );
        setPassword('');
        setStep('LOGIN');
      } else {
        setErrorMsg(res.message || 'Không thể đặt lại mật khẩu');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi đổi mật khẩu: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại'),
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 4. GOOGLE OAUTH & TẠO PASSWORD CHO TÀI KHOẢN GOOGLE
  // =========================================================================
  const handleGoogleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await authApi.getGoogleAuthUrl();
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg(
          res.message || 'Chưa cấu hình GOOGLE_CLIENT_ID trong backend/.env',
        );
      }
    } catch {
      setErrorMsg('Không thể khởi tạo đăng nhập Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSetGooglePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (password.length < 6) {
      setErrorMsg('Mật khẩu mới phải chứa ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.setGooglePassword(email.trim(), password);
      if (res.success && (res.accessToken || res.token) && res.user) {
        loginSuccess(res.accessToken || res.token!, res.refreshToken, res.user);
      } else {
        setErrorMsg(res.message || 'Không thể tạo mật khẩu');
      }
    } catch (err: unknown) {
      setErrorMsg(
        'Lỗi tạo mật khẩu: ' +
          (err instanceof Error ? err.message : 'Vui lòng thử lại'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-card">
      {/* CỘT TRÁI: FORM AUTH */}
      <div className="auth-form-column">
        {/* TAB CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ */}
        {(step === 'LOGIN' || step.startsWith('REGISTER')) && (
          <div className="auth-tabs-nav">
            <button
              type="button"
              className={`auth-tab-btn ${step === 'LOGIN' ? 'active' : ''}`}
              onClick={() => {
                resetMessages();
                setPassword('');
                setStep('LOGIN');
                if (
                  window.location.pathname.replace(/\/+$/, '') === '/register'
                ) {
                  window.history.pushState({}, '', '/login');
                }
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${step.startsWith('REGISTER') ? 'active' : ''}`}
              onClick={() => {
                resetMessages();
                setPassword('');
                setConfirmPassword('');
                setStep('REGISTER_EMAIL');
                if (window.location.pathname.replace(/\/+$/, '') === '/login') {
                  window.history.pushState({}, '', '/register');
                }
              }}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* TIÊU ĐỀ THEO BƯỚC */}
        <h2 className="auth-header-title">
          {step === 'LOGIN'
            ? 'Chào mừng đến với Purrfect'
            : step === 'REGISTER_EMAIL'
              ? 'Tạo tài khoản mới'
              : step === 'REGISTER_OTP'
                ? 'Xác nhận mã OTP'
                : step === 'REGISTER_PASSWORD'
                  ? 'Thiết lập mật khẩu'
                  : step === 'FORGOT_REQUEST'
                    ? 'Khôi phục mật khẩu'
                    : step === 'FORGOT_VERIFY'
                      ? 'Đặt lại mật khẩu mới'
                      : 'Chào mừng đến với Purrfect'}
        </h2>

        <p className="auth-header-subtitle">
          {step === 'LOGIN'
            ? 'Đăng nhập vào tài khoản Purr của bạn để tiếp tục học tập.'
            : step === 'REGISTER_EMAIL'
              ? 'Nhập địa chỉ email của bạn để bắt đầu đăng ký tài khoản.'
              : step === 'REGISTER_OTP'
                ? `Mã xác nhận OTP đã được gửi đến email của bạn.`
                : step === 'REGISTER_PASSWORD'
                  ? 'Nhập thông tin cá nhân và mật khẩu (nhập lại) để hoàn tất đăng ký.'
                  : step === 'FORGOT_REQUEST'
                    ? 'Nhập email của bạn để nhận mã xác nhận OTP khôi phục mật khẩu.'
                    : step === 'FORGOT_VERIFY'
                      ? 'Nhập mã xác nhận OTP và mật khẩu mới của bạn.'
                      : 'Truy cập vào tài khoản Purr của bạn để tiếp tục học tập.'}
        </p>

        {/* THÔNG BÁO ALERT */}
        {errorMsg && (
          <div className="auth-alert auth-alert-error">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="auth-alert auth-alert-success">{successMsg}</div>
        )}

        {/* ============================================================== */}
        {/* PHẦN 1: ĐĂNG NHẬP (EMAIL + MẬT KHẨU)                            */}
        {/* ============================================================== */}
        {step === 'LOGIN' && (
          <form onSubmit={handleLogin}>
            {/* Ô Email */}
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

            {/* Ô Mật khẩu */}
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

            {/* Checkbox Ghi nhớ & Link Quên mật khẩu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
              }}
            >
              <label className="auth-checkbox-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="auth-checkbox-label">Ghi nhớ đăng nhập</span>
              </label>

              <span
                className="auth-forgot-link"
                style={{ margin: 0 }}
                onClick={() => {
                  resetMessages();
                  setStep('FORGOT_REQUEST');
                }}
              >
                Quên mật khẩu?
              </span>
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? <span className="auth-spinner"></span> : 'Đăng nhập'}
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

            {/* Link chuyển sang Đăng ký */}
            <div className="auth-switch-footer">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  resetMessages();
                  setPassword('');
                  setConfirmPassword('');
                  setStep('REGISTER_EMAIL');
                  if (
                    window.location.pathname.replace(/\/+$/, '') === '/login'
                  ) {
                    window.history.pushState({}, '', '/register');
                  }
                }}
              >
                Đăng ký ngay
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* PHẦN 2: ĐĂNG KÝ - BƯỚC 1: NHẬP EMAIL                           */}
        {/* ============================================================== */}
        {step === 'REGISTER_EMAIL' && (
          <form onSubmit={handleRegisterEmail}>
            <div className="auth-form-group">
              <label className="auth-input-label">
                EMAIL ĐĂNG KÝ <span className="auth-star-required">*</span>
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

            {/* Checkbox Chấp nhận điều khoản */}
            <label
              className="auth-terms-row"
              style={{ marginTop: 0, marginBottom: 18 }}
            >
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

            {/* Nút Tiếp tục */}
            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
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

            {/* Link chuyển sang Đăng nhập */}
            <div className="auth-switch-footer">
              Đã có tài khoản?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  resetMessages();
                  setStep('LOGIN');
                  if (
                    window.location.pathname.replace(/\/+$/, '') === '/register'
                  ) {
                    window.history.pushState({}, '', '/login');
                  }
                }}
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* PHẦN 2: ĐĂNG KÝ - BƯỚC 2: NHẬP OTP (GỬI LẠI TỐI ĐA 3 LẦN)     */}
        {/* ============================================================== */}
        {step === 'REGISTER_OTP' && (
          <form onSubmit={handleVerifyRegisterOtp}>
            {/* Badge email hiển thị */}
            <div className="auth-email-badge">
              <span className="auth-email-badge-email">{email}</span>
              <button
                type="button"
                className="auth-change-email-btn"
                onClick={() => {
                  resetMessages();
                  setStep('REGISTER_EMAIL');
                }}
              >
                Thay đổi email
              </button>
            </div>

            <div className="auth-form-group">
              <label
                className="auth-input-label"
                style={{ justifyContent: 'center', marginBottom: 12 }}
              >
                NHẬP MÃ XÁC NHẬN OTP (6 SỐ){' '}
                <span className="auth-star-required">*</span>
              </label>

              {/* 6 ô nhập OTP riêng biệt */}
              <div
                className="auth-otp-boxes-group"
                onPaste={(e) =>
                  handleOtpBoxPaste(e, setOtpDigits, otpInputsRef)
                }
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
                      handleOtpBoxChange(
                        idx,
                        e.target.value,
                        otpDigits,
                        setOtpDigits,
                        otpInputsRef,
                      )
                    }
                    onKeyDown={(e) =>
                      handleOtpBoxKeyDown(idx, e, otpDigits, otpInputsRef)
                    }
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {/* Hàng gửi lại mã: Tối đa 3 lần */}
              <div className="auth-resend-row" style={{ marginTop: 12 }}>
                {remainingResends > 0 ? (
                  <button
                    type="button"
                    className="auth-resend-btn"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendRegisterOtp}
                    style={
                      resendCooldown > 0
                        ? {
                            opacity: 0.65,
                            cursor: 'not-allowed',
                            color: '#64748b',
                          }
                        : {}
                    }
                  >
                    {resendCooldown > 0
                      ? `Gửi lại sau (${resendCooldown}s)`
                      : 'Gửi lại mã OTP'}
                  </button>
                ) : (
                  <span className="auth-resend-limit-exceeded">
                    Đã hết số lần gửi lại mã OTP (tối đa 3 lần)
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                'Xác nhận OTP'
              )}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('REGISTER_EMAIL');
              }}
            >
              ← Quay lại
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* PHẦN 2: ĐĂNG KÝ - BƯỚC 3: MẬT KHẨU (NHẬP LẠI)                  */}
        {/* ============================================================== */}
        {step === 'REGISTER_PASSWORD' && (
          <form onSubmit={handleCompleteRegister}>
            {/* Badge email */}
            <div className="auth-email-badge">
              <span className="auth-email-badge-email">{email}</span>
            </div>

            {/* Ô Họ và tên */}
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

            {/* Ô Mật khẩu */}
            <div className="auth-form-group">
              <label className="auth-input-label">
                MẬT KHẨU (TỐI THIỂU 6 KÝ TỰ){' '}
                <span className="auth-star-required">*</span>
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

            {/* Ô Nhập lại mật khẩu */}
            <div className="auth-form-group">
              <label className="auth-input-label">
                NHẬP LẠI MẬT KHẨU <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Xác nhận lại mật khẩu vừa nhập"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Nút Hoàn tất */}
            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                'Hoàn tất đăng ký & Bắt đầu'
              )}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('REGISTER_OTP');
              }}
            >
              ← Quay lại
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* QUÊN MẬT KHẨU: BƯỚC 1 - NHẬP EMAIL                             */}
        {/* ============================================================== */}
        {step === 'FORGOT_REQUEST' && (
          <form onSubmit={handleRequestForgotOtp}>
            <div className="auth-form-group">
              <label className="auth-input-label">
                EMAIL CẦN KHÔI PHỤC{' '}
                <span className="auth-star-required">*</span>
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

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                'Gửi mã xác nhận OTP'
              )}
            </button>

            <button
              type="button"
              className="auth-btn-back"
              onClick={() => {
                resetMessages();
                setStep('LOGIN');
              }}
            >
              ← Quay lại đăng nhập
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* QUÊN MẬT KHẨU: BƯỚC 2 - NHẬP OTP & ĐẶT MẬT KHẨU MỚI           */}
        {/* ============================================================== */}
        {step === 'FORGOT_VERIFY' && (
          <form onSubmit={handleResetPassword}>
            <div className="auth-form-group">
              <label
                className="auth-input-label"
                style={{ justifyContent: 'center', marginBottom: 12 }}
              >
                NHẬP MÃ XÁC NHẬN OTP (6 SỐ){' '}
                <span className="auth-star-required">*</span>
              </label>

              {/* 6 ô OTP */}
              <div
                className="auth-otp-boxes-group"
                onPaste={(e) =>
                  handleOtpBoxPaste(e, setForgotOtpDigits, forgotOtpInputsRef)
                }
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
                        forgotOtpInputsRef,
                      )
                    }
                    onKeyDown={(e) =>
                      handleOtpBoxKeyDown(
                        idx,
                        e,
                        forgotOtpDigits,
                        forgotOtpInputsRef,
                      )
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

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                'Xác nhận & Đổi mật khẩu'
              )}
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

        {/* ============================================================== */}
        {/* TÀI KHOẢN GOOGLE ĐƯỢC PHÁT HIỆN                                */}
        {/* ============================================================== */}
        {step === 'GOOGLE_ACCOUNT_DETECTED' && (
          <div>
            <div className="auth-email-badge" style={{ marginBottom: '24px' }}>
              <span className="auth-email-badge-email">{email}</span>
              <button
                type="button"
                className="auth-change-email-btn"
                onClick={() => {
                  resetMessages();
                  setStep('LOGIN');
                  if (
                    window.location.pathname.replace(/\/+$/, '') === '/register'
                  ) {
                    window.history.pushState({}, '', '/login');
                  }
                }}
              >
                Quay lại
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '24px',
              }}
            >
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#1e3a8a',
                    marginBottom: '4px',
                  }}
                >
                  Tài khoản đăng nhập bằng Google
                </p>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: '#3b82f6',
                    lineHeight: '1.55',
                    margin: 0,
                  }}
                >
                  Email này trước đó đã đăng nhập bằng Google. Bạn có thể tiếp
                  tục với Google hoặc tạo mật khẩu mới cho tài khoản.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="auth-btn-primary"
              onClick={() => {
                resetMessages();
                setPassword('');
                setConfirmPassword('');
                setStep('SET_GOOGLE_PASSWORD');
              }}
              style={{ marginBottom: '16px' }}
            >
              Tạo mật khẩu cho email này
            </button>

            <button
              type="button"
              className="auth-btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Tiếp tục với Google
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TẠO MẬT KHẨU CHO TÀI KHOẢN GOOGLE                              */}
        {/* ============================================================== */}
        {step === 'SET_GOOGLE_PASSWORD' && (
          <form onSubmit={handleSetGooglePassword}>
            <div className="auth-email-badge" style={{ marginBottom: '24px' }}>
              <span className="auth-email-badge-email">{email}</span>
              <button
                type="button"
                className="auth-change-email-btn"
                onClick={() => {
                  resetMessages();
                  setStep('GOOGLE_ACCOUNT_DETECTED');
                }}
              >
                Quay lại
              </button>
            </div>

            <div className="auth-form-group">
              <label className="auth-input-label">
                MẬT KHẨU MỚI <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Tối thiểu 6 ký tự"
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

            <div className="auth-form-group">
              <label className="auth-input-label">
                XÁC NHẬN MẬT KHẨU <span className="auth-star-required">*</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner"></span>
              ) : (
                'Tạo mật khẩu & Đăng nhập'
              )}
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
