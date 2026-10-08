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
