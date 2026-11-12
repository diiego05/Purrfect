import { Request, Response } from 'express';
import mongoose from 'mongoose';
import WishlistItem from '../models/Wishlist';
import { Course } from '../models/Course';

type AuthRequest = Request & { user?: { id: string } };

/**
 * GET /api/wishlist
 * Lấy toàn bộ danh sách khóa học yêu thích của học viên
 */
export const getWishlist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const items = await WishlistItem.find({ userId })
      .populate(
        'courseId',
        'title slug thumbnailUrl price discountPrice level durationText durationHours averageRating badge',
      )
      .sort({ createdAt: -1 });

    const validItems = items.filter((item) => item.courseId !== null);

    res.json({
      items: validItems,
      totalCount: validItems.length,
    });
  } catch {
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách yêu thích.' });
  }
};

/**
 * POST /api/wishlist/toggle
 * Bật/tắt lưu khóa học vào danh sách yêu thích
 */
export const toggleWishlist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập để lưu khóa học yêu thích.' });
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

    const existing = await WishlistItem.findOne({ userId, courseId });

    if (existing) {
      await WishlistItem.findByIdAndDelete(existing._id);
      const totalCount = await WishlistItem.countDocuments({ userId });
      res.json({
        success: true,
        isWishlisted: false,
        message: 'Đã xóa khóa học khỏi danh sách yêu thích.',
        totalCount,
      });
      return;
    }

    const newItem = new WishlistItem({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: course._id,
    });
    await newItem.save();

    const totalCount = await WishlistItem.countDocuments({ userId });

    res.status(200).json({
      success: true,
      isWishlisted: true,
      message: 'Đã lưu khóa học vào danh sách yêu thích!',
      totalCount,
    });
  } catch {
    res
      .status(500)
      .json({ message: 'Lỗi server khi cập nhật danh sách yêu thích.' });
  }
};

/**
 * GET /api/wishlist/check/:courseId
 * Kiểm tra xem một khóa học đã được học viên yêu thích chưa
 */
export const checkWishlistStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;

    if (!userId || !courseId) {
      res.json({ isWishlisted: false });
      return;
    }

    const existing = await WishlistItem.findOne({ userId, courseId });
    res.json({ isWishlisted: Boolean(existing) });
  } catch {
    res.json({ isWishlisted: false });
  }
};
