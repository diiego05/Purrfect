import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import CourseReview, { ReviewReplyRole } from '../models/CourseReview';
import { Course } from '../models/Course';
import { Order } from '../models/Order';
import Notification from '../models/Notification';

/**
 * POST /api/v1/reviews/:id/reply hoặc /api/reviews/:id/reply
 * Lược đồ tuần tự Sequence Diagram 3.2.23 (sd PhanHoiDanhGia)
 * Actor: Instructor (hoặc Admin)
 */
export const replyToReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thực hiện phản hồi.',
      });
      return;
    }

    const reviewId = String(req.params.id);
    const rawReply =
      req.body.instructorReply ?? req.body.reply ?? req.body.content;
    const instructorReply = typeof rawReply === 'string' ? rawReply.trim() : '';

    // alt [Reply Content Empty] -> 400 Bad Request (Reply content cannot be empty)
    if (!instructorReply) {
      res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi không được để trống',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({
        success: false,
        message: 'Mã đánh giá không hợp lệ.',
      });
      return;
    }

    // findById(reviewId) -> reviewObject()
    const reviewObject = await CourseReview.findById(reviewId);

    // alt [Review Not Found or Not Course Owner] -> 403 Forbidden
    if (!reviewObject) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to reply to this review',
      });
      return;
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = isAdmin
      ? true
      : await Course.verifyOwnership(reviewObject.courseId, req.user._id);

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to reply to this review',
      });
      return;
    }

    // alt [Authorized Owner] -> saveInstructorReply(reviewId, instructorReply, repliedAt)
    const replyRole: ReviewReplyRole = isAdmin ? 'ADMIN' : 'INSTRUCTOR';
    const repliedAt = new Date();

    const updatedReview = await CourseReview.saveInstructorReply(
      reviewId,
      instructorReply,
      req.user._id,
      replyRole,
      repliedAt,
    );

    // Gửi thông báo đến học viên (tác giả đánh giá)
    try {
      if (
        reviewObject.userId &&
        reviewObject.userId.toString() !== req.user._id.toString()
      ) {
        const course = await Course.findById(reviewObject.courseId).select(
          'title',
        );
        const roleLabel =
          replyRole === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên';
        await Notification.create({
          recipientId: reviewObject.userId,
          senderId: req.user._id,
          courseId: reviewObject.courseId,
          reviewId: reviewObject._id,
          type: 'NEW_REVIEW_REPLY',
          title: `${roleLabel} đã phản hồi đánh giá của bạn`,
          message: `${req.user.fullName || 'Giảng viên'} đã phản hồi nhận xét của bạn về khóa học "${course?.title || 'khóa học'}".`,
          isRead: false,
        });
      }
    } catch (notifErr) {
      console.warn(
        '[ReviewController] Warning sending notification:',
        notifErr,
      );
    }

    // 200 OK (updatedReview)
    res.status(200).json({
      success: true,
      message: 'Phản hồi đánh giá thành công',
      data: updatedReview,
    });
  } catch (error) {
    console.error('[ReviewController] Error in replyToReview:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi phản hồi đánh giá.',
    });
  }
};

/**
 * PUT /api/v1/reviews/:id/reply
 * Alternative Flow 4a1: Giảng viên chỉnh sửa phản hồi đã gửi
 */
export const updateReviewReply = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const reviewId = String(req.params.id);
    const rawReply =
      req.body.instructorReply ?? req.body.reply ?? req.body.content;
    const instructorReply = typeof rawReply === 'string' ? rawReply.trim() : '';

    if (!instructorReply) {
      res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi không được để trống',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res
        .status(400)
        .json({ success: false, message: 'Mã đánh giá không hợp lệ' });
      return;
    }

    const reviewObject = await CourseReview.findById(reviewId);
    if (!reviewObject) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy đánh giá' });
      return;
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = isAdmin
      ? true
      : await Course.verifyOwnership(reviewObject.courseId, req.user._id);

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa phản hồi này',
      });
      return;
    }

    reviewObject.instructorReply = instructorReply;
    reviewObject.repliedAt = new Date();
    await reviewObject.save();

    const populated = await CourseReview.findById(reviewId)
      .populate('userId', 'fullName email avatarUrl role')
      .populate('repliedBy', 'fullName email avatarUrl role');

    res.status(200).json({
      success: true,
      message: 'Cập nhật phản hồi thành công',
      data: populated,
    });
  } catch (error) {
    console.error('[ReviewController] Error in updateReviewReply:', error);
    res.status(500).json({ success: false, message: 'Lỗi cập nhật phản hồi' });
  }
};

/**
 * DELETE /api/v1/reviews/:id/reply
 * Alternative Flow 4a2: Giảng viên xóa phản hồi đã gửi
 */
export const deleteReviewReply = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const reviewId = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      res
        .status(400)
        .json({ success: false, message: 'Mã đánh giá không hợp lệ' });
      return;
    }

    const reviewObject = await CourseReview.findById(reviewId);
    if (!reviewObject) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy đánh giá' });
      return;
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = isAdmin
      ? true
      : await Course.verifyOwnership(reviewObject.courseId, req.user._id);

    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa phản hồi này',
      });
      return;
    }

    const cleared = await CourseReview.deleteInstructorReply(reviewId);

    res.status(200).json({
      success: true,
      message: 'Đã xóa phản hồi đánh giá',
      data: cleared,
    });
  } catch (error) {
    console.error('[ReviewController] Error in deleteReviewReply:', error);
    res.status(500).json({ success: false, message: 'Lỗi xóa phản hồi' });
  }
};

/**
 * GET /api/v1/courses/:courseId/reviews hoặc /api/courses/:courseId/reviews
 * Lấy danh sách đánh giá của khóa học (kèm phân bố sao và thống kê)
 */
export const getCourseReviews = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const courseIdParam = String(req.params.courseId);

    // Cho phép truyền courseId hoặc slug
    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseIdParam)) {
      course = await Course.findById(courseIdParam);
    }
    if (!course) {
      course = await Course.findOne({ slug: courseIdParam });
    }

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học',
      });
      return;
    }

    // Lấy danh sách đánh giá của khóa học (lọc bỏ các đánh giá vi phạm bị ẩn/xóa -
    const reviews = await CourseReview.find({
      courseId: course._id,
      status: { $nin: ['HIDDEN', 'DELETED'] },
    })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email avatarUrl role')
      .populate('repliedBy', 'fullName email avatarUrl role')
      .lean();

    // Thống kê phân bố sao
    const totalReviews = reviews.length;
    let sumRating = 0;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      starCounts[star as keyof typeof starCounts] =
        (starCounts[star as keyof typeof starCounts] || 0) + 1;
      sumRating += r.rating || 5;
    });

    const averageRating =
      totalReviews > 0
        ? Number((sumRating / totalReviews).toFixed(1))
        : course.averageRating || 5.0;

    const starPercentages = {
      5:
        totalReviews > 0
          ? Math.round((starCounts[5] / totalReviews) * 100)
          : 88,
      4:
        totalReviews > 0 ? Math.round((starCounts[4] / totalReviews) * 100) : 9,
      3:
        totalReviews > 0 ? Math.round((starCounts[3] / totalReviews) * 100) : 2,
      2:
        totalReviews > 0 ? Math.round((starCounts[2] / totalReviews) * 100) : 1,
      1:
        totalReviews > 0 ? Math.round((starCounts[1] / totalReviews) * 100) : 0,
    };

    // Kiểm tra quyền của người dùng hiện tại
    let isEnrolled = false;
    let isCourseOwner = false;
    let myReview = null;

    if (req.user) {
      const currentUserId = req.user._id.toString();
      isCourseOwner = Boolean(
        req.user.role === 'ADMIN' ||
        (course.instructorId &&
          course.instructorId.toString() === currentUserId),
      );

      const paidOrder = await Order.findOne({
        userId: req.user._id,
        courseId: course._id,
        status: 'PAID',
      });
      isEnrolled = Boolean(paidOrder || isCourseOwner);

      myReview = reviews.find(
        (r) =>
          r.userId &&
          (typeof r.userId === 'object'
            ? (r.userId as { _id?: unknown })._id?.toString() === currentUserId
            : false),
      );
    }

    res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating,
          totalReviews,
          starCounts,
          starPercentages,
        },
        userMeta: {
          isEnrolled,
          isCourseOwner,
          hasReviewed: Boolean(myReview),
          myReview,
        },
      },
    });
  } catch (error) {
    console.error('[ReviewController] Error in getCourseReviews:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải đánh giá' });
  }
};

/**
 * POST /api/v1/courses/:courseId/reviews hoặc /api/courses/:courseId/reviews
 * Học viên gửi đánh giá mới hoặc cập nhật đánh giá của mình
 */
export const submitCourseReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
      return;
    }

    const courseIdParam = String(req.params.courseId);
    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseIdParam)) {
      course = await Course.findById(courseIdParam);
    }
    if (!course) {
      course = await Course.findOne({ slug: courseIdParam });
    }

    if (!course) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy khóa học' });
      return;
    }

    const { rating, comment } = req.body;
    const numRating = Number(rating);
    const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

    if (!numRating || numRating < 1 || numRating > 5) {
      res.status(400).json({
        success: false,
        message: 'Điểm đánh giá phải từ 1 đến 5 sao',
      });
      return;
    }

    if (!trimmedComment) {
      res.status(400).json({
        success: false,
        message: 'Nội dung nhận xét không được để trống',
      });
      return;
    }

    // Kiểm tra quyền ghi danh
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = course.instructorId?.toString() === req.user._id.toString();
    const paidOrder = await Order.findOne({
      userId: req.user._id,
      courseId: course._id,
      status: 'PAID',
    });

    if (!isAdmin && !isOwner && !paidOrder) {
      res.status(403).json({
        success: false,
        message: 'Chỉ học viên đã ghi danh khóa học mới có quyền đánh giá',
      });
      return;
    }

    // Tạo hoặc cập nhật đánh giá
    const review = await CourseReview.findOneAndUpdate(
      { courseId: course._id, userId: req.user._id },
      {
        $set: {
          rating: numRating,
          comment: trimmedComment,
        },
      },
      { upsert: true, new: true },
    )
      .populate('userId', 'fullName email avatarUrl role')
      .populate('repliedBy', 'fullName email avatarUrl role');

    // Cập nhật lại averageRating của khóa học (loại trừ đánh giá vi phạm -
    const allReviews = await CourseReview.find({
      courseId: course._id,
      status: { $nin: ['HIDDEN', 'DELETED'] },
    });
    const avg =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Course.findByIdAndUpdate(course._id, {
      $set: { averageRating: Number(avg.toFixed(1)) },
    });

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công',
      data: review,
    });
  } catch (error) {
    console.error('[ReviewController] Error in submitCourseReview:', error);
    res.status(500).json({ success: false, message: 'Lỗi gửi đánh giá' });
  }
};

/**
 * GET /api/v1/instructor/reviews hoặc /api/instructor/reviews
 * Giảng viên / Admin xem danh sách tất cả đánh giá của các khóa học mình quản lý
 */
export const getInstructorReviews = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isInstructor = req.user.role === 'INSTRUCTOR';

    if (!isAdmin && !isInstructor) {
      res.status(403).json({
        success: false,
        message: 'Chỉ Giảng viên hoặc Quản trị viên mới có quyền truy cập',
      });
      return;
    }

    // Lấy danh sách khóa học thuộc sở hữu
    const courseQuery = isAdmin
      ? { isDeleted: false }
      : { instructorId: req.user._id, isDeleted: false };

    const courses = await Course.find(courseQuery).select(
      '_id title slug thumbnailUrl averageRating',
    );
    const courseIds = courses.map((c) => c._id);

    // Lọc theo trạng thái phản hồi
    const filter = String(req.query.status || 'all');
    const selectedCourseId = req.query.courseId
      ? String(req.query.courseId)
      : null;

    const query: Record<string, unknown> = {
      courseId:
        selectedCourseId && mongoose.Types.ObjectId.isValid(selectedCourseId)
          ? new mongoose.Types.ObjectId(selectedCourseId)
          : { $in: courseIds },
    };

    if (filter === 'unreplied') {
      query.$or = [
        { instructorReply: null },
        { instructorReply: '' },
        { instructorReply: { $exists: false } },
      ];
    } else if (filter === 'replied') {
      query.instructorReply = { $ne: null, $exists: true };
    }

    const reviews = await CourseReview.find(query)
      .sort({ createdAt: -1 })
      .populate('courseId', 'title slug thumbnailUrl')
      .populate('userId', 'fullName email avatarUrl role')
      .populate('repliedBy', 'fullName email avatarUrl role')
      .lean();

    // Thống kê nhanh KPI
    const totalReviewsAll = await CourseReview.countDocuments({
      courseId: { $in: courseIds },
    });
    const unrepliedCount = await CourseReview.countDocuments({
      courseId: { $in: courseIds },
      $or: [
        { instructorReply: null },
        { instructorReply: '' },
        { instructorReply: { $exists: false } },
      ],
    });
    const repliedCount = totalReviewsAll - unrepliedCount;
    const responseRate =
      totalReviewsAll > 0
        ? Math.round((repliedCount / totalReviewsAll) * 100)
        : 100;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        courses,
        summary: {
          totalReviews: totalReviewsAll,
          unrepliedCount,
          repliedCount,
          responseRate,
        },
      },
    });
  } catch (error) {
    console.error('[ReviewController] Error in getInstructorReviews:', error);
    res
      .status(500)
      .json({
        success: false,
        message: 'Lỗi tải danh sách đánh giá của giảng viên',
      });
  }
};
