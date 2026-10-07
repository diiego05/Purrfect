import { Router } from 'express';
import {
  checkEmail,
  login,
  register,
  resendRegisterOtp,
  verifyRegisterOtp,
  uploadAvatar,
  upload,
  forgotPassword,
  verifyOtp,
  resetPassword,
  refreshTokenHandler,
  logout,
  getMe,
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Luồng kiểm tra email và đăng nhập / đăng ký
router.post('/check-email', checkEmail);
router.post('/resend-register-otp', resendRegisterOtp);
router.post('/verify-register-otp', verifyRegisterOtp);
router.post('/login', login);
router.post('/register', register);
router.post('/refresh-token', refreshTokenHandler);


// Tải avatar lên Cloudinary
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);



// Luồng quên mật khẩu & OTP
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Đăng xuất và lấy thông tin phiên
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);

// Google OAuth
router.get('/google/url', getGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);


export default router;
