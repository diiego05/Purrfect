import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { User, UserRole, UserStatus } from '../models/User';
import bcrypt from 'bcryptjs';

interface SampleUserItem {
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  onboardingCompleted: boolean;
  bio: string;
}

/**
 * Seed initial sample users if the user collection is empty or has only 1 user
 */
export const seedDefaultUsersIfEmpty = async (): Promise<void> => {
  try {
    const count = await User.countDocuments();
    if (count < 3) {
      const defaultPasswordHash = await bcrypt.hash('Purrfect@2026', 10);

      const sampleUsers: SampleUserItem[] = [
        {
          email: 'admin@purrfect.io',
          fullName: 'Nguyễn Văn Admin',
          phoneNumber: '0901234567',
          role: 'ADMIN',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Quản trị viên trưởng hệ thống Purrfect Academy',
        },
        {
          email: 'instructor.minh@purrfect.io',
          fullName: 'ThS. Nguyễn Quang Minh',
          phoneNumber: '0912345678',
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Chuyên gia đào tạo Full-stack Development với 10 năm kinh nghiệm',
        },
        {
          email: 'instructor.linh@purrfect.io',
          fullName: 'Hoàng Mai Linh',
          phoneNumber: '0923456789',
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Senior Product Designer tại Grab, Cố vấn UI/UX',
        },
        {
          email: 'instructor.khoa@purrfect.io',
          fullName: 'TS. Trần Anh Khoa',
          phoneNumber: '0934567890',
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Tiến sĩ Khoa học Dữ liệu & Trí tuệ Nhân tạo',
        },
        {
          email: 'student.an@gmail.com',
          fullName: 'Đặng Gia An',
          phoneNumber: '0945678901',
          role: 'STUDENT',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Sinh viên năm cuối ngành Công nghệ Thông tin',
        },
        {
          email: 'student.thu@gmail.com',
          fullName: 'Lê Minh Thư',
          phoneNumber: '0956789012',
          role: 'STUDENT',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Digital Marketer đang nâng cao kỹ năng Data Analytics',
        },
        {
          email: 'student.duy@gmail.com',
          fullName: 'Phạm Quốc Duy',
          phoneNumber: '0967890123',
          role: 'STUDENT',
          status: 'ACTIVE',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: true,
          bio: 'Lập trình viên chuyển ngành sang AI Engineering',
        },
        {
          email: 'student.blocked@gmail.com',
          fullName: 'Vũ Đức Thành',
          phoneNumber: '0978901234',
          role: 'STUDENT',
          status: 'BLOCKED',
          passwordHash: defaultPasswordHash,
          onboardingCompleted: false,
          bio: 'Tài khoản vi phạm chính sách cộng đồng và bị tạm khóa',
        },
      ];

      for (const u of sampleUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          await User.create(u);
        }
      }
      console.log('[UserManagement] Seeded sample users successfully');
    }
  } catch (err) {
    console.error('[UserManagement] Error seeding sample users:', err);
  }
};

/**
 * GET /api/users
 * Lấy danh sách tất cả tài khoản người dùng kèm bộ lọc và thống kê
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;

    const query: Record<string, unknown> = {};

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      query.$or = [
        { fullName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phoneNumber: { $regex: term, $options: 'i' } },
      ];
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [
      users,
      total,
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalBlocked,
    ] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
      User.countDocuments({}),
      User.countDocuments({ role: 'STUDENT' }),
      User.countDocuments({ role: 'INSTRUCTOR' }),
      User.countDocuments({ role: 'ADMIN' }),
      User.countDocuments({ status: 'BLOCKED' }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        stats: {
          totalUsers,
          totalStudents,
          totalInstructors,
          totalAdmins,
          totalBlocked,
        },
      },
    });
  } catch (error) {
    console.error('[UserManagement] Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách người dùng',
    });
  }
};

/**
 * PATCH /api/users/:id/status
 * Khóa hoặc mở khóa tài khoản người dùng
 */
export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'BLOCKED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ (phải là ACTIVE hoặc BLOCKED)',
      });
      return;
    }

    // Không cho phép tự khóa chính mình
    if (req.user?._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể tự khóa tài khoản của chính mình',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    res.json({
      success: true,
      message:
        status === 'BLOCKED'
          ? 'Đã khóa tài khoản người dùng thành công'
          : 'Đã mở khóa tài khoản người dùng thành công',
      data: user,
    });
  } catch (error) {
    console.error('[UserManagement] Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật trạng thái người dùng',
    });
  }
};

/**
 * PATCH /api/users/:id/role
 * Thay đổi vai trò quyền hạn của người dùng (STUDENT, INSTRUCTOR, ADMIN)
 */
export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
      res.status(400).json({
        success: false,
        message:
          'Vai trò không hợp lệ (phải là STUDENT, INSTRUCTOR hoặc ADMIN)',
      });
      return;
    }

    // Nếu tự hạ quyền chính mình, kiểm tra xem còn Admin nào khác không
    if (req.user?._id.toString() === id && role !== 'ADMIN') {
      const adminCount = await User.countDocuments({
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      if (adminCount <= 1) {
        res.status(400).json({
          success: false,
          message: 'Hệ thống cần ít nhất một Quản trị viên đang hoạt động',
        });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
      return;
    }

    res.json({
      success: true,
      message: `Đã cập nhật vai trò người dùng thành ${role}`,
      data: user,
    });
  } catch (error) {
    console.error('[UserManagement] Error updating role:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật vai trò người dùng',
    });
  }
};

/**
 * POST /api/users
 * Thêm người dùng mới vào hệ thống
 */
export const createUser = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      email,
      fullName,
      password,
      role = 'STUDENT',
      status = 'ACTIVE',
      phoneNumber = '',
    } = _req.body;

    if (!email || !email.trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Địa chỉ email này đã tồn tại trong hệ thống',
      });
      return;
    }

    const rawPassword = password || 'Purrfect@2026';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const newUser = await User.create({
      email: normalizedEmail,
      fullName: fullName?.trim() || '',
      phoneNumber: phoneNumber?.trim() || '',
      passwordHash,
      role,
      status,
      onboardingCompleted: true,
    });

    const userResponse = newUser.toObject() as unknown as Record<
      string,
      unknown
    >;
    delete userResponse.passwordHash;

    res.status(201).json({
      success: true,
      message: 'Đã tạo tài khoản người dùng mới thành công',
      data: userResponse,
    });
  } catch (error) {
    console.error('[UserManagement] Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo tài khoản người dùng',
    });
  }
};

/**
 * DELETE /api/users/:id
 * Xóa tài khoản người dùng
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của chính mình',
      });
      return;
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng để xóa',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Đã xóa người dùng khỏi hệ thống thành công',
    });
  } catch (error) {
    console.error('[UserManagement] Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa người dùng',
    });
  }
};
