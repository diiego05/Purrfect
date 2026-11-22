import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập hoặc thiếu token',
      });
      return;
    }

    const secret =
      process.env.JWT_SECRET || 'purrfect_secret_key_learnova_2026';
    const decoded = jwt.verify(token, secret) as { id: string; email: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: 'Người dùng không tồn tại' });
      return;
    }

    if (user.status === 'BLOCKED') {
      // UC26: Kiểm tra tự động mở khóa tài khoản hết hạn tạm khóa
      if (user.isLocked && user.lockedUntil && new Date(user.lockedUntil) <= new Date()) {
        // Hết hạn khóa -> tự động mở khóa
        await User.findByIdAndUpdate(user._id, {
          $set: { status: 'ACTIVE', isLocked: false, lockedUntil: null },
        });
        req.user = user;
        next();
        return;
      }
      res
        .status(403)
        .json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
    });
  }
};

/**
 * Middleware xác thực quyền Quản trị viên (Admin)
 * Yêu cầu phải chạy sau middleware authenticateToken
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Từ chối truy cập: Bạn không có quyền Quản trị viên (Admin)',
    });
    return;
  }

  next();
};

/**
 * Middleware xác thực quyền Giảng viên (Instructor hoặc Admin)
 * Yêu cầu phải chạy sau middleware authenticateToken
 */
export const requireInstructor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn',
    });
    return;
  }

  if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message:
        'Từ chối truy cập: Chức năng chỉ dành cho Giảng viên (Instructor)',
    });
    return;
  }

  next();
};

/**
 * Middleware xác thực quyền Học viên (Student)
 * Chặn Quản trị viên (Admin) và Giảng viên (Instructor) khỏi các chức năng chỉ dành cho Học viên
 */
export const requireStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn',
    });
    return;
  }

  if (req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      message:
        'Từ chối truy cập: Chức năng nộp đơn đăng ký giảng viên chỉ dành cho tài khoản Học viên (Student)',
    });
    return;
  }

  next();
};

/**
 * Middleware xác thực tùy chọn:
 * Nếu có token hợp lệ -> gắn req.user
 * Nếu không có token hoặc token hết hạn -> vẫn cho đi tiếp dưới dạng khách (req.user = undefined)
 */
export const optionalAuthenticateToken = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (token) {
      const secret =
        process.env.JWT_SECRET || 'purrfect_secret_key_learnova_2026';
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
      };
      const user = await User.findById(decoded.id);
      if (user && user.status !== 'BLOCKED') {
        req.user = user;
      }
    }
  } catch {
    // Bỏ qua lỗi token, coi như khách
  }
  next();
};
