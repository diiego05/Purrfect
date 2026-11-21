import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { Course } from '../models/Course';
import Order from '../models/Order';
import WithdrawalRequest from '../models/WithdrawalRequest';
import SystemConfig from '../models/SystemConfig';

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

    // 1. Tìm tất cả các khóa học của giảng viên
    const courses = await Course.find({
      $or: [
        { instructorId: new mongoose.Types.ObjectId(instructorId) },
        { instructorId: String(instructorId) },
      ],
    }).select('_id title price');

    const courseIds = courses.map((c: any) => c._id);

    // 2. Tính tổng doanh thu từ các đơn hàng PAID thật
    // BR30.2: Các đơn hàng REFUND_PENDING và REFUNDED tự động bị loại trừ
    const paidOrders = await Order.find({
      courseId: { $in: courseIds },
      status: 'PAID',
    }).lean();

    const totalRevenue = paidOrders.reduce(
      (sum, ord) => sum + (ord.amount || 0),
      0,
    );

    // 3. Tìm các khoản đã rút hoặc đang chờ rút
    const withdrawals = await WithdrawalRequest.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    }).sort({ createdAt: -1 });

    const pendingWithdrawalAmount = withdrawals
      .filter((w) => w.status === 'PENDING')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const approvedWithdrawalAmount = withdrawals
      .filter((w) => w.status === 'APPROVED')
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // Số dư khả dụng = Tổng doanh thu - Đã rút thành công - Đang chờ duyệt
    const availableBalance = Math.max(
      0,
      totalRevenue - approvedWithdrawalAmount - pendingWithdrawalAmount,
    );

    const minWithdrawal = await getMinWithdrawalAmount();

    res.json({
      success: true,
      data: {
        totalRevenue,
        availableBalance,
        pendingWithdrawalAmount,
        approvedWithdrawalAmount,
        minWithdrawal,
        coursesCount: courses.length,
        ordersCount: paidOrders.length,
        withdrawals,
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

    const { amount, bankName, bankAccount, accountHolder, notes } =
      req.body as {
        amount: number;
        bankName: string;
        bankAccount: string;
        accountHolder: string;
        notes?: string;
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

    // Tính toán số dư khả dụng thực tế
    const courses = await Course.find({
      $or: [
        { instructorId: new mongoose.Types.ObjectId(instructorId) },
        { instructorId: String(instructorId) },
      ],
    }).select('_id');
    const courseIds = courses.map((c: any) => c._id);

    const paidOrders = await Order.find({
      courseId: { $in: courseIds },
      status: 'PAID',
    }).lean();
    const totalRevenue = paidOrders.reduce(
      (sum, ord) => sum + (ord.amount || 0),
      0,
    );

    const withdrawals = await WithdrawalRequest.find({
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });
    const deducted = withdrawals
      .filter((w) => ['PENDING', 'APPROVED'].includes(w.status))
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const availableBalance = Math.max(0, totalRevenue - deducted);

    if (numAmount > availableBalance) {
      res.status(400).json({
        message: `Số dư khả dụng (${availableBalance.toLocaleString('vi-VN')} VNĐ) không đủ để thực hiện yêu cầu rút ${numAmount.toLocaleString('vi-VN')} VNĐ.`,
      });
      return;
    }

    const withdrawalRequest = new WithdrawalRequest({
      instructorId: new mongoose.Types.ObjectId(instructorId),
      amount: numAmount,
      bankName: bankName.trim(),
      bankAccount: bankAccount.trim(),
      accountHolder: accountHolder.trim().toUpperCase(),
      notes: notes?.trim() || '',
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
        res
          .status(400)
          .json({
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
