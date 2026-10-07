import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { User } from '../models/User';
import { Otp } from '../models/Otp';
import { RefreshToken } from '../models/RefreshToken';
import { AuthRequest } from '../middlewares/auth';
import { sendOtpEmail } from '../utils/mailer';
import cloudinary from '../config/cloudinary';

// Multer memory storage cho upload ảnh lên Cloudinary
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
});

// Hàm tạo Access Token (7 ngày) và Refresh Token (30 ngày)
const generateTokens = async (userId: string, email: string, role: string) => {
  const secret = process.env.JWT_SECRET || 'purrfect_secret_key_learnova_2026';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'purrfect_refresh_secret_key_learnova_2026';

  const accessToken = jwt.sign({ id: userId, email, role }, secret, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: userId, email }, refreshSecret, { expiresIn: '30d' });

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

// 1. Kiểm tra Email: Nếu đã có -> Chuyển sang Login; Nếu chưa có -> Tự động gửi OTP REGISTER
export const checkEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hợp lệ' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.json({
        success: true,
        exists: true,
        email: normalizedEmail,
        user: {
          email: existingUser.email,
          fullName: existingUser.fullName,
          avatarUrl: existingUser.avatarUrl,
          hasPassword: !!existingUser.passwordHash,
          isBlocked: existingUser.status === 'BLOCKED',
        },
      });
      return;
    }

    // Email chưa có trên hệ thống -> Sinh mã OTP và gửi về email
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await Otp.updateMany(
      { email: normalizedEmail, type: 'REGISTER', isUsed: false },
      { $set: { isUsed: true } }
    );

    const otpRecord = new Otp({
      email: normalizedEmail,
      code: otpCode,
      type: 'REGISTER',
      expiresAt,
      isUsed: false,
    });
    await otpRecord.save();

    console.log(`[AUTH-OTP] Mã OTP đăng ký tài khoản cho ${normalizedEmail}: ${otpCode}`);
    const emailSent = await sendOtpEmail(normalizedEmail, otpCode, 'REGISTER');

    res.json({
      success: true,
      exists: false,
      email: normalizedEmail,
      message: 'Mã xác nhận OTP đã được gửi đến email của bạn',
    });
  } catch (error) {

    console.error('Lỗi khi kiểm tra email:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra email' });
  }
};

// 2. Gửi lại OTP đăng ký (Resend Register OTP)
export const resendRegisterOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Kiểm tra giới hạn 2 phút (120 giây) trước khi cho phép gửi lại mã mới
    const lastOtp = await Otp.findOne({
      email: normalizedEmail,
      type: 'REGISTER',
    }).sort({ createdAt: -1 });

    if (lastOtp && lastOtp.createdAt) {
      const elapsedMs = Date.now() - new Date(lastOtp.createdAt).getTime();
      const cooldownMs = 2 * 60 * 1000; // 2 phút
      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        res.status(429).json({
          success: false,
          message: `Vui lòng đợi ${remainingSec} giây trước khi yêu cầu gửi lại mã OTP mới`,
          remainingSec,
        });
        return;
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await Otp.updateMany(
      { email: normalizedEmail, type: 'REGISTER', isUsed: false },
      { $set: { isUsed: true } }
    );


    const otpRecord = new Otp({
      email: normalizedEmail,
      code: otpCode,
      type: 'REGISTER',
      expiresAt,
      isUsed: false,
    });
    await otpRecord.save();

    console.log(`[AUTH-OTP] Gửi lại mã OTP đăng ký cho ${normalizedEmail}: ${otpCode}`);
    const emailSent = await sendOtpEmail(normalizedEmail, otpCode, 'REGISTER');

    res.json({
      success: true,
      message: 'Mã xác nhận OTP mới đã được gửi đến email của bạn',
    });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi gửi lại mã OTP' });
  }
};

// 2.1 Xác thực OTP đăng ký trước khi nhập thông tin & mật khẩu
export const verifyRegisterOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      code: String(code).trim(),
      type: 'REGISTER',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Mã xác nhận không đúng hoặc đã hết hạn (5 phút)' });
      return;
    }

    res.json({
      success: true,
      message: 'Mã xác nhận hợp lệ',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra mã OTP' });
  }
};


// 3. Đăng nhập
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ email và mật khẩu' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404).json({ success: false, message: 'Tài khoản không tồn tại trên hệ thống' });
      return;
    }

    if (user.status === 'BLOCKED') {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({
        success: false,
        message: 'Tài khoản này được đăng ký qua Google. Vui lòng đăng nhập bằng Google hoặc bấm Quên mật khẩu để đặt mật khẩu mới.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Mật khẩu không chính xác' });
      return;
    }

    const { accessToken, refreshToken } = await generateTokens(user._id.toString(), user.email, user.role);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng nhập' });
  }
};

// 4. Đăng ký tài khoản (Mặc định STUDENT + Bắt buộc xác thực OTP gửi về email)
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phoneNumber, otpCode } = req.body;

    if (!email || !password || !otpCode) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ email, mật khẩu và mã OTP' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email này đã được sử dụng. Vui lòng đăng nhập.' });
      return;
    }

    // Kiểm tra mã OTP REGISTER
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      code: String(otpCode).trim(),
      type: 'REGISTER',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
      return;
    }

    // Đánh dấu OTP đã dùng
    otpRecord.isUsed = true;
    await otpRecord.save();

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Mặc định vai trò là STUDENT theo yêu cầu
    const newUser = new User({
      email: normalizedEmail,
      passwordHash,
      fullName: fullName?.trim() || normalizedEmail.split('@')[0],
      phoneNumber: phoneNumber || '',
      role: 'STUDENT',
      status: 'ACTIVE',
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalizedEmail)}`,
    });

    await newUser.save();

    const { accessToken, refreshToken } = await generateTokens(newUser._id.toString(), newUser.email, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        phoneNumber: newUser.phoneNumber,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo tài khoản' });
  }
};

// 5. Cấp lại Access Token từ Refresh Token (7 ngày)
export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Thiếu refresh token' });
      return;
    }

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'purrfect_refresh_secret_key_learnova_2026';
    const decoded = jwt.verify(refreshToken, refreshSecret) as { id: string; email: string };

    const user = await User.findById(decoded.id);
    if (!user || user.status === 'BLOCKED') {
      res.status(403).json({ success: false, message: 'Tài khoản không hợp lệ hoặc bị khóa' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'purrfect_secret_key_learnova_2026';
    const newAccessToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

    res.json({
      success: true,
      token: newAccessToken,
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
};

// 6. Yêu cầu mã OTP Quên mật khẩu
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await Otp.updateMany(
      { email: normalizedEmail, type: 'FORGOT_PASSWORD', isUsed: false },
      { $set: { isUsed: true } }
    );


    const otpRecord = new Otp({
      userId: user._id,
      email: normalizedEmail,
      code: otpCode,
      type: 'FORGOT_PASSWORD',
      expiresAt,
      isUsed: false,
    });
    await otpRecord.save();

    console.log(`[AUTH-OTP] Mã OTP khôi phục mật khẩu cho ${normalizedEmail}: ${otpCode}`);
    const emailSent = await sendOtpEmail(normalizedEmail, otpCode, 'FORGOT_PASSWORD');

    res.json({
      success: true,
      message: 'Mã xác nhận OTP đã được gửi đến email của bạn',
    });
  } catch (error) {

    console.error('Lỗi forgot password:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi gửi mã khôi phục mật khẩu' });
  }
};

// 7. Xác thực mã OTP
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      code: code.trim(),
      type: 'FORGOT_PASSWORD',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Mã xác nhận không đúng hoặc đã hết hạn' });
      return;
    }

    res.json({
      success: true,
      message: 'Mã xác nhận hợp lệ',
    });
  } catch (error) {
    console.error('Lỗi kiểm tra OTP:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra OTP' });
  }
};

// 8. Đặt lại mật khẩu mới
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      code: code.trim(),
      type: 'FORGOT_PASSWORD',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      res.status(400).json({ success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.',
    });
  } catch (error) {
    console.error('Lỗi reset password:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu' });
  }
};

// 9. Tải ảnh đại diện lên Cloudinary (Dùng Cloudinary lưu ảnh avatar)
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Vui lòng chọn tệp hình ảnh để tải lên' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'purrfect/avatars',
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      },
      async (err, result) => {
        if (err || !result) {
          console.error('Cloudinary upload error:', err);
          res.status(500).json({ success: false, message: 'Lỗi tải ảnh lên Cloudinary' });
          return;
        }

        req.user!.avatarUrl = result.secure_url;
        await req.user!.save();

        res.json({
          success: true,
          message: 'Tải ảnh đại diện lên Cloudinary thành công',
          avatarUrl: result.secure_url,
          user: {
            id: req.user!._id,
            email: req.user!.email,
            fullName: req.user!.fullName,
            role: req.user!.role,
            avatarUrl: result.secure_url,
          },
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Lỗi upload avatar:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải ảnh lên' });
  }
};

// 10. Đăng xuất
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (err) {
    res.json({ success: true, message: 'Đăng xuất thành công' });
  }
};

// 11. Lấy thông tin user hiện tại
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Chưa xác thực' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl,
      phoneNumber: req.user.phoneNumber,
      bio: req.user.bio,
    },
  });
};

// 12. Google OAuth URL
export const getGoogleAuthUrl = (_req: Request, res: Response): Promise<void> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientId) {
    res.json({
      success: false,
      configured: false,
      message: 'Chưa cấu hình GOOGLE_CLIENT_ID trong backend/.env',
      url: null,
    });
    return Promise.resolve();
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: callbackUrl,
    client_id: clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const qs = new URLSearchParams(options);
  res.json({
    success: true,
    configured: true,
    url: `${rootUrl}?${qs.toString()}`,
  });
  return Promise.resolve();
};

// 13. Xử lý Google OAuth Callback
export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!code) {
    res.redirect(`${clientUrl}/login?auth_error=missing_google_code`);
    return;
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      res.redirect(`${clientUrl}/login?auth_error=google_oauth_not_configured`);
      return;
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Google token error:', tokenData);
      res.redirect(`${clientUrl}/login?auth_error=google_token_exchange_failed`);
      return;
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = (await userResponse.json()) as any;

    if (!googleUser || !googleUser.email) {
      res.redirect(`${clientUrl}/login?auth_error=cannot_fetch_google_user`);
      return;
    }

    const normalizedEmail = googleUser.email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = new User({
        email: normalizedEmail,
        fullName: googleUser.name || normalizedEmail.split('@')[0],
        avatarUrl: googleUser.picture || '',
        googleId: googleUser.id,
        role: 'STUDENT',
        status: 'ACTIVE',
      });
      await user.save();
    } else {
      if (!user.googleId) user.googleId = googleUser.id;
      if (!user.avatarUrl && googleUser.picture) user.avatarUrl = googleUser.picture;
      await user.save();
    }

    const { accessToken, refreshToken } = await generateTokens(user._id.toString(), user.email, user.role);

    res.redirect(`${clientUrl}/login?token=${accessToken}&refreshToken=${refreshToken}&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    console.error('Lỗi trong Google Callback:', error);
    res.redirect(`${clientUrl}/login?auth_error=google_internal_error`);
  }
};
