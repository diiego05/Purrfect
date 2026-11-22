import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { InstructorApplication } from '../models/InstructorApplication';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

/**
 * POST /api/v1/instructor/apply
 * Học viên gửi đơn đăng ký làm giảng viên
 */
export const submitApplication = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      fullName,
      email,
      phoneNumber,
      expertise,
      experienceYears,
      bio,
      teachingTopics,
      portfolioUrl,
      cvUrl,
    } = req.body;

    if (!fullName || !email || !phoneNumber || !expertise) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, email, số điện thoại và chuyên môn.',
      });
      return;
    }

    if (req.user?.role === 'INSTRUCTOR' || req.user?.role === 'ADMIN') {
      res.status(400).json({
        success: false,
        message: 'Tài khoản của bạn đã có quyền Giảng viên hoặc Quản trị viên.',
      });
      return;
    }

    // Kiểm tra xem đã có đơn PENDING chưa
    const existing = await InstructorApplication.findOne({
      userId,
      status: 'PENDING',
    });

    let application;
    if (existing) {
      // Cập nhật đơn đang chờ
      existing.fullName = fullName.trim();
      existing.email = email.trim().toLowerCase();
      existing.phoneNumber = phoneNumber.trim();
      existing.expertise = expertise.trim();
      existing.experienceYears = Number(experienceYears) || 0;
      existing.bio = (bio || '').trim();
      existing.teachingTopics = (teachingTopics || '').trim();
      existing.portfolioUrl = (portfolioUrl || '').trim();
      existing.cvUrl = (cvUrl || '').trim();
      application = await existing.save();
    } else {
      application = await InstructorApplication.create({
        userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        expertise: expertise.trim(),
        experienceYears: Number(experienceYears) || 0,
        bio: (bio || '').trim(),
        teachingTopics: (teachingTopics || '').trim(),
        portfolioUrl: (portfolioUrl || '').trim(),
        cvUrl: (cvUrl || '').trim(),
        status: 'PENDING',
      });
    }

    // Gửi thông báo đến tất cả các tài khoản Admin
    const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
    const notificationPromises = admins.map((admin) =>
      Notification.create({
        recipientId: admin._id,
        senderId: userId,
        type: 'NEW_INSTRUCTOR_APPLICATION',
        title: 'Đơn đăng ký Giảng viên mới',
        message: `Học viên ${fullName} (${email}) vừa nộp đơn đăng ký làm Giảng viên lĩnh vực: ${expertise}.`,
        courseId: null,
      }),
    );
    await Promise.allSettled(notificationPromises);

    res.status(201).json({
      success: true,
      message: 'Gửi đơn đăng ký làm giảng viên thành công! Ban quản trị sẽ xét duyệt sớm nhất.',
      data: application,
    });
  } catch (error) {
    console.error('[InstructorApplication] submitApplication error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi gửi đơn đăng ký làm giảng viên',
    });
  }
};

/**
 * GET /api/v1/instructor/my-application
 * Lấy đơn đăng ký gần nhất của học viên
 */
export const getMyApplication = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!._id;
    const application = await InstructorApplication.findOne({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: application || null,
    });
  } catch (error) {
    console.error('[InstructorApplication] getMyApplication error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải đơn đăng ký',
    });
  }
};

/**
 * GET /api/v1/admin/instructor-applications
 * Quản trị viên lấy danh sách đơn đăng ký
 */
export const getApplications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const pageStr = (req.query.page as string) || '1';
    const limitStr = (req.query.limit as string) || '20';

    const filter: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter.toUpperCase();
    }
    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      filter.$or = [
        { fullName: reg },
        { email: reg },
        { phoneNumber: reg },
        { expertise: reg },
      ];
    }

    const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [applications, total, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        InstructorApplication.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('userId', 'fullName email avatarUrl role')
          .populate('reviewedBy', 'fullName email avatarUrl'),
        InstructorApplication.countDocuments(filter),
        InstructorApplication.countDocuments({ status: 'PENDING' }),
        InstructorApplication.countDocuments({ status: 'APPROVED' }),
        InstructorApplication.countDocuments({ status: 'REJECTED' }),
      ]);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          total: pendingCount + approvedCount + rejectedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      },
    });
  } catch (error) {
    console.error('[InstructorApplication] getApplications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh sách đơn đăng ký',
    });
  }
};

/**
 * PUT /api/v1/admin/instructor-applications/:id/approve
 * Quản trị viên duyệt đơn -> Nâng quyền User thành INSTRUCTOR
 */
export const approveApplication = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const applicationId = req.params.id as string;
    const adminId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({ success: false, message: 'ID đơn đăng ký không hợp lệ' });
      return;
    }

    const application = await InstructorApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn đăng ký' });
      return;
    }

    if (application.status === 'APPROVED') {
      res.status(400).json({ success: false, message: 'Đơn này đã được duyệt trước đó' });
      return;
    }

    // Cập nhật trạng thái đơn
    application.status = 'APPROVED';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.rejectionReason = null;
    await application.save();

    // Nâng quyền tài khoản người dùng thành INSTRUCTOR
    await User.findByIdAndUpdate(application.userId, {
      $set: { role: 'INSTRUCTOR' },
    });

    // Gửi thông báo chúc mừng tới người dùng
    await Notification.create({
      recipientId: application.userId,
      senderId: adminId,
      type: 'INSTRUCTOR_APPLICATION_APPROVED',
      title: 'Chúc mừng! Đơn đăng ký Giảng viên đã được duyệt',
      message:
        'Hồ sơ đăng ký Giảng viên của bạn đã được Quản trị viên phê duyệt thành công. Giờ đây bạn đã có quyền truy cập Bảng điều khiển Giảng viên để tạo và xuất bản khóa học mới.',
      courseId: null,
    });

    res.json({
      success: true,
      message: `Đã phê duyệt thành công! Tài khoản ${application.fullName} đã được cấp quyền Giảng viên.`,
      data: application,
    });
  } catch (error) {
    console.error('[InstructorApplication] approveApplication error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi phê duyệt đơn đăng ký',
    });
  }
};

/**
 * PUT /api/v1/admin/instructor-applications/:id/reject
 * Quản trị viên từ chối đơn
 */
export const rejectApplication = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const applicationId = req.params.id as string;
    const adminId = req.user!._id;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      res.status(400).json({ success: false, message: 'ID đơn đăng ký không hợp lệ' });
      return;
    }

    const application = await InstructorApplication.findById(applicationId);
    if (!application) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn đăng ký' });
      return;
    }

    application.status = 'REJECTED';
    application.reviewedBy = adminId;
    application.reviewedAt = new Date();
    application.rejectionReason = (reason || 'Hồ sơ chưa đáp ứng yêu cầu chuyên môn hiện tại.').trim();
    await application.save();

    // Gửi thông báo cho người dùng
    await Notification.create({
      recipientId: application.userId,
      senderId: adminId,
      type: 'INSTRUCTOR_APPLICATION_REJECTED',
      title: 'Thông báo về đơn đăng ký Giảng viên',
      message: `Đơn đăng ký Giảng viên của bạn chưa được phê duyệt. Lý do: ${application.rejectionReason}. Bạn có thể cập nhật lại hồ sơ và nộp lại sau.`,
      courseId: null,
    });

    res.json({
      success: true,
      message: 'Đã từ chối đơn đăng ký',
      data: application,
    });
  } catch (error) {
    console.error('[InstructorApplication] rejectApplication error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi từ chối đơn đăng ký',
    });
  }
};
