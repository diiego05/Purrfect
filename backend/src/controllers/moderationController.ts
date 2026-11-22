import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import ContentReport from '../models/ContentReport';
import CourseDiscussion from '../models/CourseDiscussion';
import CourseReview from '../models/CourseReview';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

/**
 * GET /api/v1/admin/moderation/reports
 * Lấy danh sách các báo cáo vi phạm (Admin only)
 */
export const getReports = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const targetTypeFilter = req.query.targetType as string | undefined;
    const pageStr = (req.query.page as string) || '1';
    const limitStr = (req.query.limit as string) || '20';

    const filter: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter.toUpperCase();
    }
    if (targetTypeFilter && targetTypeFilter !== 'all') {
      filter.targetType = targetTypeFilter.toUpperCase();
    }

    const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total, pendingCount, resolvedCount, dismissedCount] =
      await Promise.all([
        ContentReport.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('offendingUserId', 'fullName email avatarUrl role violationCount')
          .populate('reportedBy', 'fullName email avatarUrl')
          .populate('moderatedBy', 'fullName email avatarUrl'),
        ContentReport.countDocuments(filter),
        ContentReport.countDocuments({ status: 'PENDING' }),
        ContentReport.countDocuments({ status: 'RESOLVED' }),
        ContentReport.countDocuments({ status: 'DISMISSED' }),
      ]);

    // Enrich reports with actual content
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toObject();
        let targetContent = null;

        if (report.targetType === 'DISCUSSION') {
          targetContent = await CourseDiscussion.findById(report.targetId)
            .populate('userId', 'fullName email avatarUrl role')
            .populate('courseId', 'title slug');
        } else if (report.targetType === 'REVIEW') {
          targetContent = await CourseReview.findById(report.targetId)
            .populate('userId', 'fullName email avatarUrl role')
            .populate('courseId', 'title slug');
        }

        return {
          ...reportObj,
          targetContent: targetContent?.toObject() || null,
        };
      }),
    );

    res.json({
      success: true,
      data: {
        reports: enrichedReports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          total: pendingCount + resolvedCount + dismissedCount,
          pending: pendingCount,
          resolved: resolvedCount,
          dismissed: dismissedCount,
        },
      },
    });
  } catch (error) {
    console.error('[Moderation] getReports error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách báo cáo',
    });
  }
};

/**
 * GET /api/v1/admin/moderation/reports/:id
 * Xem chi tiết một báo cáo (Admin only)
 */
export const getReportDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reportId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(400).json({ success: false, message: 'ID báo cáo không hợp lệ' });
      return;
    }

    const report = await ContentReport.findById(reportId)
      .populate('offendingUserId', 'fullName email avatarUrl role violationCount isLocked lockedUntil')
      .populate('reportedBy', 'fullName email avatarUrl')
      .populate('moderatedBy', 'fullName email avatarUrl');

    if (!report) {
      res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
      return;
    }

    let targetContent = null;
    if (report.targetType === 'DISCUSSION') {
      targetContent = await CourseDiscussion.findById(report.targetId)
        .populate('userId', 'fullName email avatarUrl role')
        .populate('courseId', 'title slug');
    } else if (report.targetType === 'REVIEW') {
      targetContent = await CourseReview.findById(report.targetId)
        .populate('userId', 'fullName email avatarUrl role')
        .populate('courseId', 'title slug');
    }

    res.json({
      success: true,
      data: {
        ...report.toObject(),
        targetContent: targetContent?.toObject() || null,
      },
    });
  } catch (error) {
    console.error('[Moderation] getReportDetail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải chi tiết báo cáo',
    });
  }
};

/**
 * PUT /api/v1/admin/moderation/reports/:id
 * Khớp Sequence Diagram 3.2.26: ModerationController xử lý moderateReport
 * action = 'DISMISS' | 'HIDE_OR_DELETE'
 */
export const moderateReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const reportId = req.params.id as string;
    const { action, moderationAction } = req.body;
    // action: 'DISMISS' | 'HIDE_OR_DELETE'
    // moderationAction: 'HIDE' | 'DELETE' (khi action='HIDE_OR_DELETE')

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      res.status(400).json({ success: false, message: 'ID báo cáo không hợp lệ' });
      return;
    }

    if (!action || !['DISMISS', 'HIDE_OR_DELETE'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Hành động không hợp lệ. Chọn DISMISS hoặc HIDE_OR_DELETE',
      });
      return;
    }

    const adminId = req.user!._id;

    // Step 1: ContentReport.findById(reportId) -> reportObject()
    const report = await ContentReport.findById(reportId);
    if (!report) {
      res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
      return;
    }

    if (report.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        message: 'Báo cáo này đã được xử lý trước đó',
      });
      return;
    }

    // Alt [Action == 'DISMISS']
    if (action === 'DISMISS') {
      // ContentReport.updateStatus(reportId, status='DISMISSED') -> updatedReport()
      const updatedReport = await ContentReport.updateStatus(reportId, 'DISMISSED', adminId);

      res.json({
        success: true,
        message: 'Đã bỏ qua báo cáo',
        data: updatedReport,
      });
      return;
    }

    // Alt [Action == 'HIDE_OR_DELETE']
    const hideDeleteAction: 'HIDE' | 'DELETE' = moderationAction === 'DELETE' ? 'DELETE' : 'HIDE';

    // CourseDiscussion.hideOrDeleteContent(reportObject.targetId) -> contentRemoved()
    if (report.targetType === 'DISCUSSION') {
      await CourseDiscussion.hideOrDeleteContent(report.targetId, hideDeleteAction);
    } else if (report.targetType === 'REVIEW') {
      // BR26.2: Tính toán lại điểm sao trung bình (handled inside model method)
      await CourseReview.hideOrDeleteContent(report.targetId, hideDeleteAction);
    }

    // ContentReport.updateStatus(reportId, status='RESOLVED') -> updatedReport()
    const updatedReport = await ContentReport.updateStatus(
      reportId,
      'RESOLVED',
      adminId,
      hideDeleteAction,
    );

    // User.incrementViolationCountAndWarn(offendingUserId) -> violationCount()
    const violationCount = await User.incrementViolationCountAndWarn(
      report.offendingUserId,
    );

    // Gửi cảnh báo tới tài khoản vi phạm (BR26.1)
    const actionLabel = hideDeleteAction === 'DELETE' ? 'bị xóa vĩnh viễn' : 'bị ẩn';
    const contentTypeLabel = report.targetType === 'DISCUSSION' ? 'bình luận thảo luận' : 'đánh giá khóa học';

    await Notification.create({
      recipientId: report.offendingUserId,
      senderId: adminId,
      type: 'CONTENT_WARNING',
      title: 'Cảnh báo vi phạm nội dung',
      message: `Nội dung ${contentTypeLabel} của bạn đã ${actionLabel} do vi phạm tiêu chuẩn cộng đồng. Lý do: ${report.reason}. Đây là lần vi phạm thứ ${violationCount}.`,
      courseId: null,
    });

    let accountLocked = false;

    // Alt [Violation Count > 3 (Repeat Spammer)]
    // BR26.3: Tài khoản vi phạm >3 lần -> gợi ý khóa 7 ngày
    if (violationCount > 3) {
      // User.lockAccountTemporarily(offendingUserId, days) -> accountLocked()
      await User.lockAccountTemporarily(report.offendingUserId, 7);
      accountLocked = true;

      await Notification.create({
        recipientId: report.offendingUserId,
        senderId: adminId,
        type: 'ACCOUNT_LOCKED',
        title: 'Tài khoản bị tạm khóa',
        message: `Tài khoản của bạn đã bị tạm khóa 7 ngày do vi phạm tiêu chuẩn cộng đồng quá ${violationCount} lần.`,
        courseId: null,
      });
    }

    // 200 OK (Content moderated and warning issued)
    res.json({
      success: true,
      message: 'Đã kiểm duyệt nội dung và gửi cảnh báo',
      data: {
        report: updatedReport,
        violationCount,
        accountLocked,
      },
    });
  } catch (error) {
    console.error('[Moderation] moderateReport error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi kiểm duyệt nội dung',
    });
  }
};

/**
 * POST /api/v1/moderation/report
 * Người dùng báo cáo nội dung vi phạm
 */
export const submitReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !['DISCUSSION', 'REVIEW'].includes(targetType)) {
      res.status(400).json({
        success: false,
        message: 'Loại nội dung không hợp lệ',
      });
      return;
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId as string)) {
      res.status(400).json({
        success: false,
        message: 'ID nội dung không hợp lệ',
      });
      return;
    }

    if (!reason) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn lý do báo cáo',
      });
      return;
    }

    const reporterId = req.user!._id;

    // Check if already reported by this user
    const existingReport = await ContentReport.findOne({
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId as string),
      reportedBy: reporterId,
      status: 'PENDING',
    });

    if (existingReport) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã báo cáo nội dung này rồi',
      });
      return;
    }

    // Find the offending user
    let offendingUserId: mongoose.Types.ObjectId | null = null;

    if (targetType === 'DISCUSSION') {
      const discussion = await CourseDiscussion.findById(targetId as string);
      if (!discussion) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nội dung' });
        return;
      }
      offendingUserId = discussion.userId;
    } else {
      const review = await CourseReview.findById(targetId as string);
      if (!review) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nội dung' });
        return;
      }
      offendingUserId = review.userId;
    }

    // Cannot report own content
    if (offendingUserId.toString() === reporterId.toString()) {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể báo cáo nội dung của chính mình',
      });
      return;
    }

    const report = await ContentReport.create({
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId as string),
      offendingUserId,
      reportedBy: reporterId,
      reason,
      details: details || null,
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi báo cáo thành công. Quản trị viên sẽ xem xét sớm nhất.',
      data: report,
    });
  } catch (error) {
    console.error('[Moderation] submitReport error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi gửi báo cáo',
    });
  }
};

/**
 * POST /api/v1/admin/moderation/lock-account/:userId
 * Admin khóa tài khoản vi phạm (Exception Flow 5b)
 */
export const lockAccount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const targetUserId = req.params.userId as string;
    const { days = 7 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
      return;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }

    if (user.role === 'ADMIN') {
      res.status(403).json({ success: false, message: 'Không thể khóa tài khoản Admin' });
      return;
    }

    const lockedUser = await User.lockAccountTemporarily(targetUserId, days);

    if (lockedUser) {
      await Notification.create({
        recipientId: new mongoose.Types.ObjectId(targetUserId),
        senderId: req.user!._id,
        type: 'ACCOUNT_LOCKED',
        title: 'Tài khoản bị tạm khóa',
        message: `Tài khoản của bạn đã bị tạm khóa ${days} ngày do vi phạm tiêu chuẩn cộng đồng.`,
        courseId: null,
      });
    }

    res.json({
      success: true,
      message: `Đã khóa tài khoản ${days} ngày`,
      data: lockedUser,
    });
  } catch (error) {
    console.error('[Moderation] lockAccount error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi khóa tài khoản',
    });
  }
};
