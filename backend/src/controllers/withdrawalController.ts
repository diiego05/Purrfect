import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { Course } from '../models/Course';
import Order from '../models/Order';
import WithdrawalRequest from '../models/WithdrawalRequest';
import SystemConfig from '../models/SystemConfig';
import { UserInteraction } from '../models/UserInteraction';
import Certificate from '../models/Certificate';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Lấy số tiền rút tối thiểu từ SystemConfig (mặc định 200,000 VNĐ)
 */
const getMinWithdrawalAmount = async (): Promise<number> => {
  try {
    const config = await SystemConfig.findOne({
      keyName: 'MIN_WITHDRAWAL_AMOUNT',
    });
    if (config && config.valueText) {
      const val = parseFloat(config.valueText);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (err) {
    console.warn('Lỗi lấy MIN_WITHDRAWAL_AMOUNT:', err);
  }
  return 200000;
};

// Hoa hồng tính trên đúng số tiền học viên thực trả (sau mã giảm giá).
const getCommissionRate = async (): Promise<number> => {
  const config = await SystemConfig.findOne({
    keyName: 'COMMISSION_RATE_PERCENT',
  }).lean();
  const value = Number(config?.valueText);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 15;
};

/**
 * Helper tính toán trạng thái thanh toán và giải tỏa doanh thu (Clearance & Escrow)
 * Logic: Tiền của khóa học vừa được bán phải ở trạng thái PENDING (Tạm giữ bảo lưu hoàn tiền)
 * Khi nào khóa học hết hạn hoàn trả (>14 ngày) hoặc không còn khả dụng hoàn trả
 * (học viên đã học >= 3 bài hoặc đã cấp chứng chỉ) thì mới ở trạng thái CÓ THỂ RÚT ĐƯỢC.
 */
export async function calculateInstructorRevenueBreakdown(
  instructorId: string | mongoose.Types.ObjectId,
) {
  const commissionRate = await getCommissionRate();
  const courses = await Course.find({
    $or: [
      { instructorId: new mongoose.Types.ObjectId(instructorId) },
      { instructorId: String(instructorId) },
    ],
  })
    .select('_id title price')
    .lean();

  const courseIds = courses.map((c: any) => c._id);
  const courseMap = new Map<string, any>();
  courses.forEach((c: any) => courseMap.set(String(c._id), c));

  const orders = await Order.find({
    courseId: { $in: courseIds },
    status: { $in: ['PAID', 'REFUND_PENDING', 'REFUNDED'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  const userIds = orders.map((o) => o.userId).filter(Boolean);
  const [progressInteractions, certificates] = await Promise.all([
    UserInteraction.find({
      userId: { $in: userIds },
      courseId: { $in: courseIds },
      actionType: 'PROGRESS',
    }).lean(),
    Certificate.find({
      userId: { $in: userIds },
      courseId: { $in: courseIds },
    }).lean(),
  ]);

  const completedLecturesMap = new Map<string, Set<string>>();
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
      const uId = String(item.userId);
      const cId = String(item.courseId);
      const mapKey = `${uId}_${cId}`;
      if (!completedLecturesMap.has(mapKey)) {
        completedLecturesMap.set(mapKey, new Set<string>());
      }
      const set = completedLecturesMap.get(mapKey)!;
      if (meta.lectureId) {
        set.add(String(meta.lectureId));
      } else if (
        meta.sectionIndex !== undefined &&
        meta.lectureIndex !== undefined
      ) {
        set.add(`${meta.sectionIndex}-${meta.lectureIndex}`);
      } else if (meta.lectureTitle) {
        set.add(String(meta.lectureTitle));
      }
    }
  });

  const certSet = new Set<string>();
  certificates.forEach((cert: any) => {
    certSet.add(`${String(cert.userId)}_${String(cert.courseId)}`);
  });

  let totalRevenue = 0;
  let pendingClearanceAmount = 0;
  let clearedRevenue = 0;
  let pendingOrdersCount = 0;
  let clearedOrdersCount = 0;

  const now = Date.now();
  const orderClearanceDetails = orders.map((ord: any) => {
    const targetCourse = courseMap.get(String(ord.courseId));
    const courseTitle = targetCourse?.title || 'Khóa học';
    const grossAmount = ord.amount || 0;
    const commissionAmount = Math.round((grossAmount * commissionRate) / 100);
    const ordAmount = Math.max(0, grossAmount - commissionAmount);
    const paymentTime = new Date(ord.createdAt).getTime();
    const diffTime = now - paymentTime;
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const mapKey = `${String(ord.userId)}_${String(ord.courseId)}`;
    const completedLecturesCount = completedLecturesMap.get(mapKey)?.size || 0;
    const hasCertificate = certSet.has(mapKey);

    if (ord.status === 'REFUNDED') {
      return {
        orderId: String(ord._id),
        orderCode: ord.orderCode,
        courseId: String(ord.courseId),
        courseTitle,
        amount: ordAmount,
        grossAmount,
        commissionAmount,
        createdAt: ord.createdAt,
        status: 'REFUNDED' as const,
        statusLabel: 'Đã hoàn tiền cho học viên',
        isCleared: false,
        isPendingClearance: false,
        reason:
          'Đơn hàng đã được hoàn tiền cho học viên, không tính vào doanh thu.',
        daysPassed,
        daysRemaining: 0,
        completedLecturesCount,
        hasCertificate,
      };
    }

    if (ord.status === 'REFUND_PENDING') {
      return {
        orderId: String(ord._id),
        orderCode: ord.orderCode,
        courseId: String(ord.courseId),
        courseTitle,
        amount: ordAmount,
        grossAmount,
        commissionAmount,
        createdAt: ord.createdAt,
        status: 'REFUND_PENDING' as const,
        statusLabel: 'Đang khiếu nại hoàn tiền',
        isCleared: false,
        isPendingClearance: false,
        reason:
          'Đơn hàng đang có yêu cầu hoàn tiền chờ giải quyết, doanh thu bị tạm khóa.',
        daysPassed,
        daysRemaining: 0,
        completedLecturesCount,
        hasCertificate,
      };
    }

    // Đơn hàng PAID:
    totalRevenue += ordAmount;

    // Kiểm tra điều kiện mở khóa rút tiền:
    const isOver14Days = diffTime >= FOURTEEN_DAYS_MS;
    const isCompleted3OrMore = completedLecturesCount >= 3;
    const isCertIssued = hasCertificate;

    const isNonRefundable = isOver14Days || isCompleted3OrMore || isCertIssued;

    if (isNonRefundable) {
      clearedRevenue += ordAmount;
      clearedOrdersCount += 1;

      let clearReason = 'Đã đủ điều kiện mở khóa rút tiền';
      if (isOver14Days) {
        clearReason = `Đã quá thời hạn 14 ngày bảo lưu hoàn tiền (${daysPassed} ngày kể từ ngày mua).`;
      } else if (isCompleted3OrMore) {
        clearReason = `Học viên đã học ${completedLecturesCount} bài giảng (mất quyền yêu cầu hoàn trả theo quy định).`;
      } else if (isCertIssued) {
        clearReason =
          'Học viên đã nhận chứng chỉ tốt nghiệp khóa học (không thể hoàn tiền).';
      }

      return {
        orderId: String(ord._id),
        orderCode: ord.orderCode,
        courseId: String(ord.courseId),
        courseTitle,
        amount: ordAmount,
        grossAmount,
        commissionAmount,
        createdAt: ord.createdAt,
        status: 'CLEARED' as const,
        statusLabel: 'Khả dụng có thể rút',
        isCleared: true,
        isPendingClearance: false,
        reason: clearReason,
        daysPassed,
        daysRemaining: 0,
        completedLecturesCount,
        hasCertificate,
      };
    }

    // Đơn hàng mới bán: trong vòng 14 ngày & học < 3 bài & chưa cấp chứng chỉ -> PENDING (Tạm giữ bảo lưu)
    pendingClearanceAmount += ordAmount;
    pendingOrdersCount += 1;
    const daysRemaining = Math.max(1, 14 - daysPassed);

    return {
      orderId: String(ord._id),
      orderCode: ord.orderCode,
      courseId: String(ord.courseId),
      courseTitle,
      amount: ordAmount,
      grossAmount,
      commissionAmount,
      createdAt: ord.createdAt,
      status: 'PENDING_CLEARANCE' as const,
      statusLabel: 'Đang tạm giữ bảo lưu',
      isCleared: false,
      isPendingClearance: true,
      reason: `Đang trong thời hạn bảo lưu 14 ngày (còn ${daysRemaining} ngày, học viên đã học ${completedLecturesCount}/2 bài).`,
      daysPassed,
      daysRemaining,
      completedLecturesCount,
      hasCertificate,
    };
  });

  return {
    courses,
    orders,
    commissionRate,
    totalRevenue,
    pendingClearanceAmount,
    clearedRevenue,
    pendingOrdersCount,
    clearedOrdersCount,
    orderClearanceDetails,
  };
}

/**
 * GET /api/withdrawals/instructor/balance
 * Lấy số dư khả dụng và lịch sử rút tiền của Giảng viên
 */
export const getInstructorBalance = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const instructorId = req.user?._id;
    if (!instructorId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const breakdown = await calculateInstructorRevenueBreakdown(instructorId);

    // Tìm các khoản đã rút hoặc đang chờ rút
    const withdrawals = await WithdrawalRequest.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    }).sort({ createdAt: -1 });

    const pendingWithdrawalAmount = withdrawals
      .filter((w) => w.status === 'PENDING')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const approvedWithdrawalAmount = withdrawals
      .filter((w) => w.status === 'APPROVED')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // SỐ DƯ KHẢ DỤNG THỰC TẾ:
    // CHỈ ĐƯỢC RÚT TỪ TIỀN ĐÃ CLEARED (Hết hạn hoàn tiền hoặc học viên không còn khả dụng hoàn tiền)
    const availableBalance = Math.max(
      0,
      breakdown.clearedRevenue -
        approvedWithdrawalAmount -
        pendingWithdrawalAmount,
    );

    const minWithdrawal = await getMinWithdrawalAmount();

    res.json({
      success: true,
      data: {
        totalRevenue: breakdown.totalRevenue,
        pendingClearanceAmount: breakdown.pendingClearanceAmount,
        clearedRevenue: breakdown.clearedRevenue,
        availableBalance,
        pendingWithdrawalAmount,
        approvedWithdrawalAmount,
        minWithdrawal,
        coursesCount: breakdown.courses.length,
        ordersCount: breakdown.orders.length,
        pendingOrdersCount: breakdown.pendingOrdersCount,
        clearedOrdersCount: breakdown.clearedOrdersCount,
        withdrawals,
        orderClearanceDetails: breakdown.orderClearanceDetails,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy số dư giảng viên:', error);
    res
      .status(500)
      .json({ message: 'Lỗi server khi tính toán số dư giảng viên.' });
  }
};

/**
 * POST /api/withdrawals/instructor/request
 * Giảng viên gửi yêu cầu rút tiền
 */
export const createWithdrawalRequest = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const instructorId = req.user?._id;
    if (!instructorId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const { amount, bankName, bankAccount, accountHolder, notes, qrCodeUrl } =
      req.body as {
        amount: number;
        bankName: string;
        bankAccount: string;
        accountHolder: string;
        notes?: string;
        qrCodeUrl?: string;
      };

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      res.status(400).json({ message: 'Số tiền rút không hợp lệ.' });
      return;
    }

    const minWithdrawal = await getMinWithdrawalAmount();
    if (numAmount < minWithdrawal) {
      res.status(400).json({
        message: `Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString('vi-VN')} VNĐ.`,
      });
      return;
    }

    if (!bankName?.trim() || !bankAccount?.trim() || !accountHolder?.trim()) {
      res.status(400).json({
        message:
          'Vui lòng điền đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản.',
      });
      return;
    }

    // Tính toán số dư khả dụng thực tế dựa trên các đơn đã cleared
    const breakdown = await calculateInstructorRevenueBreakdown(instructorId);

    const withdrawals = await WithdrawalRequest.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });
    const deducted = withdrawals
      .filter((w) => ['PENDING', 'APPROVED'].includes(w.status))
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const availableBalance = Math.max(0, breakdown.clearedRevenue - deducted);

    if (numAmount > availableBalance) {
      if (breakdown.pendingClearanceAmount > 0) {
        res.status(400).json({
          message: `Số tiền muốn rút (${numAmount.toLocaleString('vi-VN')} VNĐ) vượt quá số dư khả dụng (${availableBalance.toLocaleString('vi-VN')} VNĐ). Bạn có ${breakdown.pendingClearanceAmount.toLocaleString('vi-VN')} VNĐ từ các khóa học vừa bán đang ở trạng thái Tạm giữ bảo lưu hoàn tiền (sẽ mở khóa rút khi đơn hàng quá 14 ngày hoặc học viên học từ 3 bài trở lên).`,
        });
      } else {
        res.status(400).json({
          message: `Số dư khả dụng (${availableBalance.toLocaleString('vi-VN')} VNĐ) không đủ để thực hiện yêu cầu rút ${numAmount.toLocaleString('vi-VN')} VNĐ.`,
        });
      }
      return;
    }

    const withdrawalRequest = new WithdrawalRequest({
      instructorId: new mongoose.Types.ObjectId(instructorId),
      amount: numAmount,
      bankName: bankName.trim(),
      bankAccount: bankAccount.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      notes: notes?.trim() || '',
      qrCodeUrl: qrCodeUrl?.trim() || '',
      status: 'PENDING',
    });
    await withdrawalRequest.save();

    res.status(201).json({
      success: true,
      message:
        'Yêu cầu rút tiền của bạn đã được gửi thành công và đang chờ Admin duyệt.',
      withdrawalRequest,
    });
  } catch (error) {
    console.error('Lỗi khi gửi yêu cầu rút tiền:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu rút tiền.' });
  }
};

/**
 * GET /api/withdrawals/admin/requests
 * [Admin] Lấy danh sách toàn bộ yêu cầu rút tiền của giảng viên
 */
export const getAdminWithdrawals = async (
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

    let list = await WithdrawalRequest.find(query)
      .populate('instructorId', 'fullName email avatarUrl phoneNumber')
      .populate('processedBy', 'fullName email')
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((w: any) => {
        const insName = w.instructorId?.fullName?.toLowerCase() || '';
        const insEmail = w.instructorId?.email?.toLowerCase() || '';
        const bank = w.bankName?.toLowerCase() || '';
        const acc = w.bankAccount?.toLowerCase() || '';
        const holder = w.accountHolder?.toLowerCase() || '';
        return (
          insName.includes(q) ||
          insEmail.includes(q) ||
          bank.includes(q) ||
          acc.includes(q) ||
          holder.includes(q)
        );
      });
    }

    res.json({ success: true, withdrawals: list });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách rút tiền Admin:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách rút tiền.' });
  }
};

/**
 * POST /api/withdrawals/admin/process/:id
 * [Admin] Duyệt (APPROVE) hoặc Từ chối (REJECT) yêu cầu rút tiền của giảng viên
 */
export const processAdminWithdrawal = async (
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

    const item = await WithdrawalRequest.findById(id);
    if (!item) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu rút tiền.' });
      return;
    }

    if (item.status !== 'PENDING') {
      res.status(400).json({
        message: 'Yêu cầu rút tiền này đã được xử lý trước đó.',
      });
      return;
    }

    if (action === 'APPROVE') {
      item.status = 'APPROVED';
      item.processedBy = adminId;
      item.processedAt = new Date();
      if (adminNotes) item.adminNotes = adminNotes.trim();
      await item.save();

      res.json({
        success: true,
        message: 'Đã phê duyệt yêu cầu rút tiền thành công cho giảng viên.',
        withdrawalRequest: item,
      });
    } else {
      if (!rejectionReason || !rejectionReason.trim()) {
        res.status(400).json({
          message: 'Vui lòng cung cấp lý do từ chối yêu cầu rút tiền.',
        });
        return;
      }

      item.status = 'REJECTED';
      item.rejectionReason = rejectionReason.trim();
      item.processedBy = adminId;
      item.processedAt = new Date();
      if (adminNotes) item.adminNotes = adminNotes.trim();
      await item.save();

      res.json({
        success: true,
        message:
          'Đã từ chối yêu cầu rút tiền. Số tiền đã được hoàn lại vào số dư khả dụng của giảng viên.',
        withdrawalRequest: item,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý duyệt rút tiền:', error);
    res.status(500).json({ message: 'Lỗi server khi xét duyệt rút tiền.' });
  }
};
