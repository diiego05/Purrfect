import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { Playlist } from '../models/Playlist';
import { Course } from '../models/Course';
import { User } from '../models/User';

export const MAX_PLAYLISTS_PER_USER = 15;
export const MAX_COURSES_PER_PLAYLIST = 30;

/**
 * Tự động tạo một số playlist công khai mẫu nếu hệ thống chưa có playlist nào
 */
async function autoSeedPublicPlaylistsIfEmpty() {
  try {
    const count = await Playlist.countDocuments();
    if (count > 0) return;

    // Tìm giảng viên hoặc admin để gán quyền tác giả
    const instructors = await User.find({
      role: { $in: ['INSTRUCTOR', 'ADMIN'] },
    });
    if (instructors.length === 0) return;

    const allCourses = await Course.find({
      status: 'PUBLISHED',
      isDeleted: false,
    });
    if (allCourses.length === 0) return;

    const seedDefs = [
      {
        name: 'Lộ trình Full-Stack Web Developer từ số 0',
        description:
          'Tổng hợp các khóa học từ nền tảng HTML/CSS/JS đến React, Node.js và triển khai ứng dụng thực chiến.',
        author: instructors[0]._id,
        courseKeywords: ['react', 'node', 'web', 'javascript', 'lập trình'],
      },
      {
        name: 'Lộ trình Chuyên viên Thiết kế UI/UX & Sản phẩm số',
        description:
          'Bộ sưu tập khóa học thiết kế giao diện Figma chuyên sâu, nghiên cứu trải nghiệm người dùng UX.',
        author: instructors[1] ? instructors[1]._id : instructors[0]._id,
        courseKeywords: ['figma', 'ui', 'ux', 'thiết kế', 'design'],
      },
      {
        name: 'Chinh phục Trí tuệ Nhân tạo & Khoa học Dữ liệu 2026',
        description:
          'Lộ trình toàn diện từ Python cơ bản, Machine Learning, Deep Learning đến ứng dụng Generative AI.',
        author: instructors[2] ? instructors[2]._id : instructors[0]._id,
        courseKeywords: ['python', 'ai', 'data', 'dữ liệu', 'machine'],
      },
      {
        name: 'Bộ kỹ năng số & Năng suất làm việc 4.0',
        description:
          'Khóa học thực chiến về Excel nâng cao, tự động hóa công việc và công cụ số cho người đi làm.',
        author: instructors[0]._id,
        courseKeywords: ['excel', 'tin học', 'kỹ năng số', 'văn phòng'],
      },
    ];

    for (const def of seedDefs) {
      const matched = allCourses.filter((c) => {
        const text = (c.title + ' ' + (c.shortDescription || '')).toLowerCase();
        return def.courseKeywords.some((kw) => text.includes(kw));
      });
      const selected =
        matched.length >= 2 ? matched.slice(0, 4) : allCourses.slice(0, 3);
      if (selected.length > 0) {
        await Playlist.create({
          name: def.name,
          description: def.description,
          userId: def.author,
          isPublic: true,
          courses: selected.map((c) => c._id),
          followers: [],
        });
      }
    }
    console.log('[PlaylistController] Đã khởi tạo các playlist mẫu công khai');
  } catch (err) {
    console.warn('[PlaylistController] Lỗi khi seed playlist:', err);
  }
}

/**
 * 1. Lấy danh sách Playlist công khai (Public Playlists)
 * GET /api/playlists/public
 */
export const getPublicPlaylists = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await autoSeedPublicPlaylistsIfEmpty();

    const search = req.query.search ? String(req.query.search).trim() : '';
    const query: Record<string, unknown> = { isPublic: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const currentUserId = req.user ? req.user._id.toString() : null;

    const playlists = await Playlist.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email role avatarUrl')
      .populate({
        path: 'courses',
        select:
          'title slug thumbnailUrl price discountPrice durationHours averageRating totalStudents level categoryId',
      })
      .lean();

    const formatted = playlists.map((p) => {
      const followerIds = (p.followers || []).map(
        (f: mongoose.Types.ObjectId) => f.toString(),
      );
      return {
        ...p,
        courseCount: (p.courses || []).length,
        followerCount: followerIds.length,
        isFollowedByMe: currentUserId
          ? followerIds.includes(currentUserId)
          : false,
        isOwner:
          currentUserId && p.userId
            ? (p.userId as { _id: mongoose.Types.ObjectId })._id.toString() ===
              currentUserId
            : false,
      };
    });

    res.json({
      success: true,
      playlists: formatted,
    });
  } catch (error) {
    console.error('Lỗi lấy playlist công khai:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi máy chủ khi lấy playlist' });
  }
};

/**
 * 2. Lấy danh sách Playlist cá nhân (Đã tạo + Đang theo dõi)
 * GET /api/playlists/my
 */
export const getMyPlaylists = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const currentUserId = req.user._id;

    // Danh sách playlist do chính người dùng tạo
    const createdPlaylists = await Playlist.find({ userId: currentUserId })
      .sort({ updatedAt: -1 })
      .populate('userId', 'fullName email role avatarUrl')
      .populate({
        path: 'courses',
        select:
          'title slug thumbnailUrl price discountPrice durationHours averageRating totalStudents level categoryId',
      })
      .lean();

    // Danh sách playlist công khai mà người dùng đang theo dõi
    const followedPlaylists = await Playlist.find({
      followers: currentUserId,
      userId: { $ne: currentUserId },
    })
      .sort({ updatedAt: -1 })
      .populate('userId', 'fullName email role avatarUrl')
      .populate({
        path: 'courses',
        select:
          'title slug thumbnailUrl price discountPrice durationHours averageRating totalStudents level categoryId',
      })
      .lean();

    const mapPlaylist = (p: (typeof createdPlaylists)[0]) => {
      const followerIds = (p.followers || []).map(
        (f: mongoose.Types.ObjectId) => f.toString(),
      );
      return {
        ...p,
        courseCount: (p.courses || []).length,
        followerCount: followerIds.length,
        isFollowedByMe: followerIds.includes(currentUserId.toString()),
        isOwner:
          p.userId &&
          (p.userId as { _id: mongoose.Types.ObjectId })._id.toString() ===
            currentUserId.toString(),
      };
    };

    res.json({
      success: true,
      created: createdPlaylists.map(mapPlaylist),
      followed: followedPlaylists.map(mapPlaylist),
      limits: {
        maxPlaylists: MAX_PLAYLISTS_PER_USER,
        maxCoursesPerPlaylist: MAX_COURSES_PER_PLAYLIST,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy playlist cá nhân:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy playlist cá nhân',
    });
  }
};

/**
 * 3. Lấy chi tiết một Playlist theo ID
 * GET /api/playlists/:id
 */
export const getPlaylistById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: 'ID playlist không hợp lệ' });
      return;
    }

    const playlist = await Playlist.findById(id)
      .populate('userId', 'fullName email role avatarUrl')
      .populate({
        path: 'courses',
        select:
          'title slug thumbnailUrl price discountPrice durationHours averageRating totalStudents level categoryId shortDescription',
      })
      .lean();

    if (!playlist) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy playlist' });
      return;
    }

    const currentUserId = req.user ? req.user._id.toString() : null;
    const authorId = playlist.userId
      ? (playlist.userId as { _id: mongoose.Types.ObjectId })._id.toString()
      : '';
    const isOwner = currentUserId === authorId;

    // Nếu playlist riêng tư và không phải tác giả -> chặn quyền truy cập
    if (!playlist.isPublic && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập playlist riêng tư này',
      });
      return;
    }

    const followerIds = (playlist.followers || []).map(
      (f: mongoose.Types.ObjectId) => f.toString(),
    );

    res.json({
      success: true,
      playlist: {
        ...playlist,
        courseCount: (playlist.courses || []).length,
        followerCount: followerIds.length,
        isFollowedByMe: currentUserId
          ? followerIds.includes(currentUserId)
          : false,
        isOwner,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết playlist:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi máy chủ khi lấy playlist' });
  }
};

/**
 * 4. Tạo playlist mới
 * POST /api/playlists
 * Basic Flow bước 1 & 2
 * Exception 1b & BR29.1: Giới hạn số lượng playlist tối đa
 */
export const createPlaylist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { name, description, isPublic } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        message: 'Tên playlist không được để trống',
      });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({
        success: false,
        message: 'Tên playlist không được vượt quá 100 ký tự',
      });
      return;
    }

    // BR29.1 & Exception 1b: Kiểm tra số lượng playlist tối đa
    const currentCount = await Playlist.countDocuments({
      userId: req.user._id,
    });
    if (currentCount >= MAX_PLAYLISTS_PER_USER) {
      res.status(400).json({
        success: false,
        message: `Bạn đã đạt giới hạn tối đa ${MAX_PLAYLISTS_PER_USER} playlist. Vui lòng xóa bớt playlist cũ trước khi tạo mới.`,
      });
      return;
    }

    const newPlaylist = await Playlist.create({
      name: name.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      userId: req.user._id,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      courses: [],
      followers: [],
    });

    await newPlaylist.populate('userId', 'fullName email role avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Khởi tạo playlist mới thành công!',
      playlist: newPlaylist,
    });
  } catch (error) {
    console.error('Lỗi tạo playlist:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi máy chủ khi tạo playlist' });
  }
};

/**
 * 5. Cập nhật thông tin hoặc sắp xếp playlist
 * PUT /api/playlists/:id
 * Alternative Flow 5a1, BR29.3, Exception 3a4
 */
export const updatePlaylist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const id = String(req.params.id);
    const { name, description, isPublic, courses } = req.body;

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy playlist' });
      return;
    }

    // BR29.3 & Exception 3a4: Chỉ chủ sở hữu mới có quyền chỉnh sửa
    if (!playlist.userId.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message:
          'Bạn không có quyền chỉnh sửa playlist của người khác. Bạn chỉ được phép theo dõi playlist này.',
      });
      return;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Tên playlist không được để trống',
        });
        return;
      }
      if (name.trim().length > 100) {
        res.status(400).json({
          success: false,
          message: 'Tên playlist không được vượt quá 100 ký tự',
        });
        return;
      }
      playlist.name = name.trim();
    }

    if (description !== undefined) {
      playlist.description =
        typeof description === 'string' ? description.trim() : '';
    }

    if (isPublic !== undefined) {
      playlist.isPublic = Boolean(isPublic);
    }

    // Cập nhật sắp xếp thứ tự khóa học trong playlist (Basic Flow bước 5)
    if (courses !== undefined && Array.isArray(courses)) {
      if (courses.length > MAX_COURSES_PER_PLAYLIST) {
        res.status(400).json({
          success: false,
          message: `Playlist không thể chứa quá ${MAX_COURSES_PER_PLAYLIST} khóa học.`,
        });
        return;
      }
      playlist.courses = courses
        .filter((cid) => mongoose.Types.ObjectId.isValid(cid))
        .map((cid) => new mongoose.Types.ObjectId(cid));
    }

    await playlist.save();
    await playlist.populate('userId', 'fullName email role avatarUrl');
    await playlist.populate({
      path: 'courses',
      select:
        'title slug thumbnailUrl price discountPrice durationHours averageRating totalStudents level categoryId',
    });

    res.json({
      success: true,
      message: 'Cập nhật playlist thành công!',
      playlist,
    });
  } catch (error) {
    console.error('Lỗi cập nhật playlist:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi máy chủ khi cập nhật playlist' });
  }
};

/**
 * 6. Xóa toàn bộ playlist
 * DELETE /api/playlists/:id
 * Alternative Flow 5a2
 */
export const deletePlaylist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const id = String(req.params.id);
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy playlist' });
      return;
    }

    // BR29.3 & Exception 3a4: Chỉ chủ sở hữu mới có quyền xóa
    if (!playlist.userId.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa playlist của người khác.',
      });
      return;
    }

    await Playlist.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Đã xóa playlist thành công!',
    });
  } catch (error) {
    console.error('Lỗi xóa playlist:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi máy chủ khi xóa playlist' });
  }
};

/**
 * 7. Thêm khóa học vào playlist
 * POST /api/playlists/:id/courses
 * Basic Flow bước 3 & 4
 * BR29.2 & Exception 4b: Tránh thêm trùng lặp
 * BR29.1 & Exception 3b: Giới hạn số khóa học tối đa trong 1 playlist
 * BR29.3 & Exception 3a4: Chỉ chủ sở hữu mới được thêm khóa học
 */
export const addCourseToPlaylist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const id = String(req.params.id);
    const { courseId } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      res
        .status(400)
        .json({ success: false, message: 'ID khóa học không hợp lệ' });
      return;
    }

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy playlist' });
      return;
    }

    // BR29.3 & Exception 3a4
    if (!playlist.userId.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message:
          'Bạn không có quyền chỉnh sửa nội dung của playlist này. Bạn chỉ được phép theo dõi.',
      });
      return;
    }

    // Kiểm tra khóa học có tồn tại trên hệ thống không
    const courseExists = await Course.findById(courseId);
    if (!courseExists || courseExists.isDeleted) {
      res.status(404).json({
        success: false,
        message: 'Khóa học không tồn tại hoặc đã bị gỡ bỏ',
      });
      return;
    }

    // BR29.2 & Exception 4b: Kiểm tra khóa học đã có trong playlist chưa
    const alreadyExists = playlist.courses.some(
      (cId) => cId.toString() === courseId.toString(),
    );
    if (alreadyExists) {
      res.status(400).json({
        success: false,
        message: 'Khóa học này đã có sẵn trong danh sách phát này.',
      });
      return;
    }

    // BR29.1 & Exception 3b: Kiểm tra số lượng khóa học tối đa trong 1 playlist
    if (playlist.courses.length >= MAX_COURSES_PER_PLAYLIST) {
      res.status(400).json({
        success: false,
        message: `Playlist đã đạt số lượng tối đa (${MAX_COURSES_PER_PLAYLIST} khóa học). Vui lòng dọn dẹp trước khi tiếp tục.`,
      });
      return;
    }

    playlist.courses.push(new mongoose.Types.ObjectId(courseId));
    await playlist.save();

    await playlist.populate({
      path: 'courses',
      select:
        'title slug thumbnailUrl price discountPrice durationHours averageRating totalStudents level categoryId',
    });

    res.json({
      success: true,
      message: `Đã thêm khóa học "${courseExists.title}" vào playlist "${playlist.name}" thành công!`,
      playlist,
    });
  } catch (error) {
    console.error('Lỗi thêm khóa học vào playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thêm khóa học vào playlist',
    });
  }
};

/**
 * 8. Gỡ khóa học khỏi playlist
 * DELETE /api/playlists/:id/courses/:courseId
 * Alternative Flow 5a1
 */
export const removeCourseFromPlaylist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const id = String(req.params.id);
    const courseId = String(req.params.courseId);
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy playlist' });
      return;
    }

    // BR29.3 & Exception 3a4
    if (!playlist.userId.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền chỉnh sửa playlist này.',
      });
      return;
    }

    playlist.courses = playlist.courses.filter(
      (cId) => cId.toString() !== courseId.toString(),
    );
    await playlist.save();

    res.json({
      success: true,
      message: 'Đã gỡ khóa học khỏi playlist thành công!',
      playlist,
    });
  } catch (error) {
    console.error('Lỗi gỡ khóa học khỏi playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi gỡ khóa học khỏi playlist',
    });
  }
};

/**
 * 9. Theo dõi / Bỏ theo dõi Playlist công khai
 * POST /api/playlists/:id/follow
 * Alternative Flow 3a2, 3a3, BR29.3
 */
export const toggleFollowPlaylist = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const id = String(req.params.id);
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy playlist' });
      return;
    }

    // Không cho theo dõi playlist riêng tư của người khác
    if (!playlist.isPublic && !playlist.userId.equals(req.user._id)) {
      res.status(403).json({
        success: false,
        message: 'Không thể theo dõi playlist riêng tư này.',
      });
      return;
    }

    // Không cần theo dõi playlist của chính mình
    if (playlist.userId.equals(req.user._id)) {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể theo dõi playlist do chính mình tạo.',
      });
      return;
    }

    const currentUserIdStr = req.user._id.toString();
    const isCurrentlyFollowing = playlist.followers.some(
      (fId) => fId.toString() === currentUserIdStr,
    );

    if (isCurrentlyFollowing) {
      // Bỏ theo dõi
      playlist.followers = playlist.followers.filter(
        (fId) => fId.toString() !== currentUserIdStr,
      );
      await playlist.save();

      res.json({
        success: true,
        isFollowed: false,
        followerCount: playlist.followers.length,
        message: `Đã bỏ theo dõi playlist "${playlist.name}"`,
      });
    } else {
      // Theo dõi playlist công khai (Alternative Flow 3a2 & 3a3)
      playlist.followers.push(req.user._id);
      await playlist.save();

      res.json({
        success: true,
        isFollowed: true,
        followerCount: playlist.followers.length,
        message: `Đã theo dõi playlist "${playlist.name}" thành công! Playlist sẽ xuất hiện trong danh sách theo dõi của bạn.`,
      });
    }
  } catch (error) {
    console.error('Lỗi theo dõi playlist:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi máy chủ khi theo dõi playlist' });
  }
};
