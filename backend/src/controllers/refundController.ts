import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import Order from '../models/Order';
import { Course } from '../models/Course';
import RefundRequest from '../models/RefundRequest';
import { UserInteraction } from '../models/UserInteraction';
import Certificate from '../models/Certificate';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Hàm kiểm tra 3 điều kiện hoàn tiền (BR30.1):
 * 1. Thời gian thanh toán tính đến hiện tại trong vòng 14 ngày.
 * 2. Số bài giảng đã hoàn thành (đánh dấu "Đã xem" >= 80%) không vượt quá 2 bài giảng.
 * 3. Khóa học chưa phát sinh/chưa lấy chứng chỉ hoàn thành.
 */
export const evaluateRefundConditions = async (
  userId: string | mongoose.Types.ObjectId,
  order: any,
): Promise<{
  isEligible: boolean;
  errorCode?:
    | 'OVER_14_DAYS'
    | 'COMPLETED_3_OR_MORE'
    | 'CERTIFICATE_ISSUED'
    | 'ALREADY_REQUESTED';
  errorMessage?: string;
  daysPassed: number;
  completedLecturesCount: number;
  hasCertificate: boolean;
}> => {
  const targetCourseId =
    order.courseId && typeof order.courseId === 'object' && order.courseId._id
      ? order.courseId._id
      : order.courseId;

  const now = Date.now();
  const paymentTime = new Date(order.createdAt).getTime();
  const diffTime = now - paymentTime;
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Kiểm tra yêu cầu hoàn tiền đang tồn tại
  const existingRequest = await RefundRequest.findOne({
    orderId: order._id,
    status: { $in: ['PENDING', 'APPROVED'] },
  });
  if (
    existingRequest ||
    order.status === 'REFUND_PENDING' ||
    order.status === 'REFUNDED'
  ) {
    return {
      isEligible: false,
      errorCode: 'ALREADY_REQUESTED',
      errorMessage:
        'Đơn hàng này đã có yêu cầu hoàn tiền đang được xử lý hoặc đã hoàn tiền.',
      daysPassed,
      completedLecturesCount: 0,
      hasCertificate: false,
    };
  }

  // Điều kiện 1 (BR30.1 / Exception 2a): Trong vòng 14 ngày
  if (diffTime > FOURTEEN_DAYS_MS) {
    return {
      isEligible: false,
      errorCode: 'OVER_14_DAYS',
      errorMessage:
        'Đã quá thời hạn 14 ngày kể từ ngày thanh toán, không thể gửi yêu cầu hoàn tiền.',
      daysPassed,
      completedLecturesCount: 0,
      hasCertificate: false,
    };
  }

  // Điều kiện 2 (BR30.1 / Exception 2b): Số bài giảng đã hoàn thành không vượt quá 2 bài giảng
  const progressInteractions = await UserInteraction.find({
    userId,
    courseId: targetCourseId,
    actionType: 'PROGRESS',
  }).lean();

  const completedLectureKeys = new Set<string>();
  progressInteractions.forEach((item: any) => {
    const meta = (item.metadata || {}) as Record<string, any>;
    if (meta.action === 'ENTER_LEARNING_ROOM') return;

    const isDone =
      meta.isCompleted === true ||
      meta.completed === true ||
      meta.action === 'COMPLETED_LECTURE' ||
      (typeof meta.watchPercent === 'number' && meta.watchPercent >= 80) ||
      (typeof meta.progressPercent === 'number' && meta.progressPercent >= 80);

    if (isDone) {
      if (meta.lectureId) {
        completedLectureKeys.add(String(meta.lectureId));
      } else if (
        meta.sectionIndex !== undefined &&
        meta.lectureIndex !== undefined
      ) {
        completedLectureKeys.add(`${meta.sectionIndex}-${meta.lectureIndex}`);
      } else if (meta.lectureTitle) {
        completedLectureKeys.add(String(meta.lectureTitle));
      }
    }
  });

  const completedLecturesCount = completedLectureKeys.size;
  if (completedLecturesCount >= 3) {
    return {
      isEligible: false,
      errorCode: 'COMPLETED_3_OR_MORE',
      errorMessage:
        'Bạn đã hoàn thành từ 3 bài giảng trở lên, không đủ điều kiện hoàn tiền.',
      daysPassed,
      completedLecturesCount,
      hasCertificate: false,
    };
  }

  // Điều kiện 3 (BR30.1 / Exception 2c): Khóa học chưa phát sinh/chưa lấy chứng chỉ hoàn thành
  const cert = await Certificate.findOne({
    userId,
    courseId: targetCourseId,
  });

  const certInteraction = await UserInteraction.findOne({
    userId,
    courseId: targetCourseId,
    actionType: 'PROGRESS',
    'metadata.certificateIssued': true,
  });

  const hasCertificate = Boolean(cert || certInteraction);
  if (hasCertificate) {
    return {
      isEligible: false,
      errorCode: 'CERTIFICATE_ISSUED',
      errorMessage:
        'Khóa học này đã được cấp chứng chỉ hoàn thành, không thể thực hiện hoàn tiền.',
      daysPassed,
      completedLecturesCount,
      hasCertificate: true,
    };
  }

  return {
    isEligible: true,
    daysPassed,
    completedLecturesCount,
    hasCertificate: false,
  };
};

/**
 * GET /api/refunds/eligibility/:orderId
 * Kiểm tra điều kiện hoàn tiền cho đơn hàng của học viên (Basic Flow 2)
 */
export const checkEligibility = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const orderId = String(req.params.orderId || '');

    if (!userId) {
      res
        .status(401)
        .json({
          success: false,
          isEligible: false,
          errorMessage: 'Vui lòng đăng nhập.',
        });
      return;
    }

    const orderQuery: any = { userId };
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orderQuery._id = orderId;
    } else {
      orderQuery.orderCode = orderId;
    }

    const order = await Order.findOne(orderQuery).populate(
      'courseId',
      'title thumbnailUrl price instructorId',
    );

    if (!order) {
      res
        .status(404)
        .json({
          success: false,
          isEligible: false,
          errorMessage: 'Không tìm thấy đơn hàng.',
        });
      return;
    }

    if (order.status !== 'PAID') {
      res.status(200).json({
        success: true,
        isEligible: false,
        errorMessage:
          'Chỉ đơn hàng đã thanh toán thành công mới có thể yêu cầu hoàn tiền.',
      });
      return;
    }

    const evaluation = await evaluateRefundConditions(userId, order);
    res.json({
      success: true,
      order: {
        _id: order._id,
        orderCode: order.orderCode,
        amount: order.amount,
        createdAt: order.createdAt,
        course: order.courseId,
      },
      ...evaluation,
    });
  } catch (error) {
    console.error('Lỗi kiểm tra điều kiện hoàn tiền:', error);
    res
      .status(500)
      .json({
        success: false,
        isEligible: false,
        errorMessage: 'Lỗi server khi kiểm tra điều kiện hoàn tiền.',
      });
  }
};

/**
 * POST /api/refunds/request
 * Gửi yêu cầu hoàn tiền mới (Basic Flow 4, 5, 6 & BR30.1, BR30.2)
 */
export const createRefundRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { orderId, reason, notes } = req.body as {
      orderId: string;
      reason: string;
      notes?: string;
    };

    if (!userId) {
      res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
      return;
    }

    if (!orderId || !reason || !reason.trim()) {
      res
        .status(400)
        .json({ success: false, message: 'Vui lòng chọn lý do hoàn tiền.' });
      return;
    }

    const orderQuery: any = { userId };
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      orderQuery._id = orderId;
    } else {
      orderQuery.orderCode = orderId;
    }

    const order = await Order.findOne(orderQuery);
    if (!order) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy đơn hàng.' });
      return;
    }

    if (order.status !== 'PAID') {
      res.status(400).json({
        success: false,
        message:
          'Đơn hàng không ở trạng thái ĐÃ THANH TOÁN, không thể gửi yêu cầu hoàn tiền.',
      });
      return;
    }

    // Kiểm tra tính hợp lệ của 3 điều kiện (BR30.1)
    const evaluation = await evaluateRefundConditions(userId, order);
    if (!evaluation.isEligible) {
      res.status(400).json({
        message: evaluation.errorMessage || 'Không đủ điều kiện hoàn tiền.',
        errorCode: evaluation.errorCode,
      });
      return;
    }

    // Lấy thông tin giảng viên từ khóa học
    const course = await Course.findById(order.courseId);
    let instructorId: mongoose.Types.ObjectId | undefined;
    if (course && course.instructorId) {
      instructorId = course.instructorId as unknown as mongoose.Types.ObjectId;
    }

    // Tạo yêu cầu hoàn tiền mới ở trạng thái PENDING (Flow 5)
    const refundRequest = new RefundRequest({
      orderId: order._id,
      userId,
      courseId: order.courseId,
      instructorId,
      amount: order.amount,
      reason: reason.trim(),
      notes: notes?.trim() || '',
      status: 'PENDING',
    });
    await refundRequest.save();

    // BR30.2: Tạm khóa quyền truy cập phòng học và tạm dừng ghi nhận doanh thu giảng viên
    order.status = 'REFUND_PENDING';
    await order.save();

    res.status(201).json({
      success: true,
      message:
        'Yêu cầu hoàn tiền của bạn đã được gửi thành công và đang chờ xem xét xử lý.',
      refundRequest,
    });
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu hoàn tiền:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu hoàn tiền.' });
  }
};

/**
 * POST /api/refunds/cancel/:id
 * Hủy yêu cầu hoàn tiền khi đang PENDING (Alternative Flow 4a & BR30.3)
 */
export const cancelRefundRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const refundRequest = await RefundRequest.findOne({
      _id: id,
      userId,
    });

    if (!refundRequest) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu hoàn tiền.' });
      return;
    }

    if (refundRequest.status !== 'PENDING') {
      res.status(400).json({
        message:
          'Chỉ có thể hủy yêu cầu hoàn tiền khi đang ở trạng thái CHỜ DUYỆT (PENDING).',
      });
      return;
    }

    // 4a2. Chuyển trạng thái yêu cầu thành CANCELLED
    refundRequest.status = 'CANCELLED';
    refundRequest.cancelledAt = new Date();
    await refundRequest.save();

    // BR30.3: Khôi phục lại quyền vào học bình thường ngay lập tức cho Student và doanh thu giảng viên
    const order = await Order.findById(refundRequest.orderId);
    if (order && order.status === 'REFUND_PENDING') {
      order.status = 'PAID';
      await order.save();
    }

    res.json({
      success: true,
      message:
        'Đã hủy yêu cầu hoàn tiền thành công. Quyền truy cập bài học đã được khôi phục.',
      refundRequest,
    });
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu hoàn tiền:', error);
    res.status(500).json({ message: 'Lỗi server khi hủy yêu cầu hoàn tiền.' });
  }
};

/**
 * GET /api/refunds/my-requests
 * Lấy danh sách các yêu cầu hoàn tiền của học viên hiện tại
 */
export const getMyRefundRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const requests = await RefundRequest.find({ userId })
      .populate('courseId', 'title slug thumbnailUrl price')
      .populate('orderId', 'orderCode amount paymentMethod createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Lỗi lấy danh sách hoàn tiền:', error);
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách yêu cầu hoàn tiền.' });
  }
};

/**
 * GET /api/refunds/admin/requests
 * [Admin] Xem danh sách toàn bộ yêu cầu hoàn tiền (UC33)
 */
export const getAdminRefundRequests = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { status, search } = req.query as {
      status?: string;
      search?: string;
    };
    const query: Record<string, any> = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    let requests = await RefundRequest.find(query)
      .populate('userId', 'fullName email avatarUrl phoneNumber')
      .populate('instructorId', 'fullName email')
      .populate('courseId', 'title slug thumbnailUrl price')
      .populate('orderId', 'orderCode amount paymentMethod createdAt')
      .populate('processedBy', 'fullName email')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      requests = requests.filter((r: any) => {
        const studentName = r.userId?.fullName?.toLowerCase() || '';
        const studentEmail = r.userId?.email?.toLowerCase() || '';
        const courseTitle = r.courseId?.title?.toLowerCase() || '';
        const orderCode = r.orderId?.orderCode?.toLowerCase() || '';
        return (
          studentName.includes(q) ||
          studentEmail.includes(q) ||
          courseTitle.includes(q) ||
          orderCode.includes(q)
        );
      });
    }

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách hoàn tiền Admin:', error);
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách yêu cầu hoàn tiền.' });
  }
};

/**
 * POST /api/refunds/admin/process/:id
 * [Admin] Duyệt (APPROVE) hoặc Từ chối (REJECT) yêu cầu hoàn tiền (UC33)
 */
export const processAdminRefund = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const adminId = req.user?._id;
    const { id } = req.params;
    const { action, rejectionReason, adminNotes } = req.body as {
      action: 'APPROVE' | 'REJECT';
      rejectionReason?: string;
      adminNotes?: string;
    };

    if (!['APPROVE', 'REJECT'].includes(action)) {
      res
        .status(400)
        .json({ message: 'Hành động không hợp lệ (APPROVE hoặc REJECT).' });
      return;
    }

    const refundRequest = await RefundRequest.findById(id);
    if (!refundRequest) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu hoàn tiền.' });
      return;
    }

    if (refundRequest.status !== 'PENDING') {
      res.status(400).json({
        message: 'Yêu cầu này đã được xử lý trước đó hoặc đã bị hủy.',
      });
      return;
    }

    const order = await Order.findById(refundRequest.orderId);

    if (action === 'APPROVE') {
      refundRequest.status = 'APPROVED';
      refundRequest.processedBy = adminId;
      refundRequest.processedAt = new Date();
      if (adminNotes) refundRequest.adminNotes = adminNotes.trim();
      await refundRequest.save();

      // Cập nhật trạng thái đơn hàng thành REFUNDED vĩnh viễn
      if (order) {
        order.status = 'REFUNDED';
        await order.save();
      }

      // Thu hồi tương tác ENROLL để chắc chắn khóa học không hiển thị trong phòng học
      await UserInteraction.deleteMany({
        userId: refundRequest.userId,
        courseId: refundRequest.courseId,
        actionType: 'ENROLL',
      });

      res.json({
        success: true,
        message: 'Đã phê duyệt hoàn tiền thành công cho học viên.',
        refundRequest,
      });
    } else {
      // REJECT
      if (!rejectionReason || !rejectionReason.trim()) {
        res
          .status(400)
          .json({ message: 'Vui lòng cung cấp lý do từ chối hoàn tiền.' });
        return;
      }

      refundRequest.status = 'REJECTED';
      refundRequest.rejectionReason = rejectionReason.trim();
      refundRequest.processedBy = adminId;
      refundRequest.processedAt = new Date();
      if (adminNotes) refundRequest.adminNotes = adminNotes.trim();
      await refundRequest.save();

      // Khôi phục lại trạng thái đơn hàng thành PAID để học viên tiếp tục học bình thường
      if (order) {
        order.status = 'PAID';
        await order.save();
      }

      res.json({
        success: true,
        message:
          'Đã từ chối yêu cầu hoàn tiền. Quyền truy cập bài học đã được mở lại cho học viên.',
        refundRequest,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý duyệt hoàn tiền Admin:', error);
    res.status(500).json({ message: 'Lỗi server khi xét duyệt hoàn tiền.' });
  }
};
