import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CartItem from '../models/Cart';
import { Course } from '../models/Course';
import Order from '../models/Order';
import { UserInteraction } from '../models/UserInteraction';

type AuthRequest = Request & { user?: { id: string } };

/**
 * GET /api/cart
 * Lấy toàn bộ danh sách khóa học trong giỏ hàng của học viên
 */
export const getCart = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const items = await CartItem.find({ userId })
      .populate(
        'courseId',
        'title slug thumbnailUrl price discountPrice level durationText durationHours averageRating badge',
      )
      .sort({ createdAt: -1 });

    // Lọc bỏ những mục khóa học có thể đã bị xóa khỏi hệ thống
    const validItems = items.filter((item) => item.courseId !== null);

    // Tính tổng tiền giỏ hàng
    let totalAmount = 0;
    for (const item of validItems) {
      const c = item.courseId as unknown as {
        price: number;
        discountPrice?: number;
      };
      const effectivePrice =
        c.discountPrice && c.discountPrice > 0 && c.discountPrice < c.price
          ? c.discountPrice
          : c.price;
      totalAmount += effectivePrice || 0;
    }

    res.json({
      items: validItems,
      totalCount: validItems.length,
      totalAmount,
    });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin giỏ hàng.' });
  }
};

/**
 * POST /api/cart/add
 * Thêm một khóa học vào giỏ hàng
 */
export const addToCart = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập để thêm vào giỏ hàng.' });
      return;
    }

    const { courseId } = req.body as { courseId: string };
    if (!courseId) {
      res.status(400).json({ message: 'Thiếu mã khóa học (courseId).' });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: 'Không tìm thấy khóa học này.' });
      return;
    }

    // Kiểm tra học viên đã sở hữu khóa học này chưa
    const alreadyEnrolled = await Order.findOne({
      userId,
      courseId: course._id,
      status: 'PAID',
    });

    if (alreadyEnrolled) {
      res.status(400).json({
        message: 'Bạn đã đăng ký khóa học này trước đó rồi.',
        isEnrolled: true,
      });
      return;
    }

    // Thêm vào giỏ hàng nếu chưa có (idempotent)
    const cartItem = await CartItem.findOneAndUpdate(
      { userId, courseId: course._id },
      { userId: new mongoose.Types.ObjectId(userId), courseId: course._id },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Ghi nhận tương tác CART cho hệ thống AI gợi ý khóa học (trọng số 2.0)
    await UserInteraction.create({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: course._id,
      actionType: 'CART',
      weightScore: 2.0,
    });

    const totalCount = await CartItem.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: 'Đã thêm khóa học vào giỏ hàng!',
      cartItem,
      totalCount,
    });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi thêm vào giỏ hàng.' });
  }
};

/**
 * DELETE /api/cart/remove/:courseId
 * Xóa một khóa học khỏi giỏ hàng
 */
export const removeFromCart = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;

    if (!userId || !courseId) {
      res
        .status(400)
        .json({ message: 'Thiếu thông tin người dùng hoặc khóa học.' });
      return;
    }

    await CartItem.findOneAndDelete({ userId, courseId });
    const totalCount = await CartItem.countDocuments({ userId });

    res.json({
      success: true,
      message: 'Đã xóa khóa học khỏi giỏ hàng.',
      totalCount,
    });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi xóa khỏi giỏ hàng.' });
  }
};

/**
 * DELETE /api/cart/clear
 * Xóa sạch toàn bộ giỏ hàng
 */
export const clearCart = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    await CartItem.deleteMany({ userId });

    res.json({
      success: true,
      message: 'Đã dọn sạch giỏ hàng.',
      totalCount: 0,
    });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi xóa sạch giỏ hàng.' });
  }
};
