import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { CourseDiscussion } from '../models/CourseDiscussion';
import { Notification } from '../models/Notification';
import { Course, ICourse } from '../models/Course';
import Order from '../models/Order';

export interface FormattedUser {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export interface FormattedDiscussionReply {
  _id: string;
  courseId: string;
  lectureId: string;
  userId: FormattedUser;
  parentId?: string | null;
  content: string;
  upvoteCount: number;
  isPinned: boolean;
  isAuthor: boolean;
  isInstructor: boolean;
  isUpvoted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FormattedDiscussionQuestion {
  _id: string;
  courseId: string;
  lectureId: string;
  userId: FormattedUser;
  parentId?: string | null;
  content: string;
  upvoteCount: number;
  isPinned: boolean;
  isAuthor: boolean;
  isInstructor: boolean;
  isUpvoted: boolean;
  replies: FormattedDiscussionReply[];
  repliesCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Tìm khóa học chứa lectureId hoặc theo courseId truyền kèm
 */
async function findCourseByLectureOrId(
  lectureId: string,
  courseIdQuery?: string,
): Promise<{ course: ICourse | null; lectureTitle: string }> {
  let course: ICourse | null = null;
  let lectureTitle = 'Bài giảng';

  if (mongoose.Types.ObjectId.isValid(lectureId)) {
    course = await Course.findOne({
      'sections.lectures._id': lectureId,
      isDeleted: false,
    });
  }

  if (
    !course &&
    courseIdQuery &&
    mongoose.Types.ObjectId.isValid(courseIdQuery)
  ) {
    course = await Course.findById(courseIdQuery);
  }

  if (course && course.sections) {
    for (const section of course.sections) {
      const found = section.lectures?.find(
        (l) => l._id && l._id.toString() === lectureId,
      );
      if (found) {
        lectureTitle = found.title;
        break;
      }
    }
  }

  return { course, lectureTitle };
}

/**
 * Kiểm tra quyền hạn truy cập thảo luận:
 * - Học viên đã ghi danh (Order PAID)
 * - Giảng viên sở hữu khóa học
 * - Quản trị viên (ADMIN)
 */
async function checkDiscussionAccess(
  userId: string,
  userRole: string,
  course: ICourse,
): Promise<{
  hasAccess: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  isEnrolled: boolean;
}> {
  const isAdmin = userRole === 'ADMIN';
  const isInstructor = Boolean(
    course.instructorId && course.instructorId.toString() === userId.toString(),
  );

  let isEnrolled = false;
  if (!isAdmin && !isInstructor) {
    const paidOrder = await Order.findOne({
      userId,
      courseId: course._id,
      status: 'PAID',
    });
    isEnrolled = Boolean(paidOrder);
  }

  return {
    hasAccess: isAdmin || isInstructor || isEnrolled,
    isInstructor,
    isAdmin,
    isEnrolled,
  };
}

/**
 * POST /api/v1/lectures/:id/discussions hoặc POST /api/lectures/:id/discussions
 * Khớp Lược đồ tuần tự 3.2.22:
 * Student -> POST /api/v1/lectures/:id/discussions (content)
 * -> [Content Empty]: 400 Bad Request (Content is required)
 * -> [Valid Input]: createComment(userId, courseId, lectureId, content, parentId = null)
 *    -> Send notification (New question in lecture) to Instructor
 *    -> 201 Created (newDiscussion)
 */
export const createLectureDiscussion = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để gửi câu hỏi thảo luận.',
      });
      return;
    }

    const lectureId = String(req.params.id);
    const content = (req.body.content || '').toString().trim();
    const courseIdBody = req.body.courseId || req.query.courseId;

    // alt: [Content Empty] -> 400 Bad Request (Content is required)
    if (!content) {
      res.status(400).json({
        success: false,
        message: 'Content is required',
      });
      return;
    }

    const { course, lectureTitle } = await findCourseByLectureOrId(
      lectureId,
      courseIdBody ? String(courseIdBody) : undefined,
    );

    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài giảng hoặc khóa học tương ứng.',
      });
      return;
    }

    const userId = String(req.user._id);
    const { hasAccess } = await checkDiscussionAccess(
      userId,
      req.user.role,
      course,
    );

    // PreCondition 1: Chỉ những người có trong khóa học này mới được xem/gửi
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message:
          'Chỉ học viên đã ghi danh hoặc giảng viên của khóa học mới có quyền tham gia thảo luận.',
      });
      return;
    }

    // alt: [Valid Input] -> createComment(userId, courseId, lectureId, content, parentId = null)
    const newDiscussion = await CourseDiscussion.createComment(
      userId,
      course._id,
      lectureId,
      content,
      null,
    );

    // Send notification (New question in lecture) đến giảng viên
    if (course.instructorId && course.instructorId.toString() !== userId) {
      await Notification.create({
        recipientId: course.instructorId,
        senderId: userId,
        courseId: course._id,
        lectureId: new mongoose.Types.ObjectId(lectureId),
        discussionId: newDiscussion._id,
        type: 'NEW_QUESTION',
        title: 'Câu hỏi mới trong bài giảng',
        message: `${req.user.fullName || 'Một học viên'} đã đặt câu hỏi thảo luận trong bài "${lectureTitle}" của khóa học "${course.title}".`,
      });
    }

    const populatedDiscussion = await CourseDiscussion.findById(
      newDiscussion._id,
    ).populate('userId', 'fullName email avatarUrl role');

    // 201 Created (newDiscussion)
    res.status(201).json({
      success: true,
      message: 'Gửi câu hỏi thảo luận thành công.',
      data: populatedDiscussion,
    });
  } catch (error) {
    console.error('[DiscussionController] Error creating discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thảo luận. Vui lòng thử lại sau.',
    });
  }
};

/**
 * POST /api/v1/discussions/:id/replies hoặc POST /api/discussions/:id/replies
 * Khớp Lược đồ tuần tự 3.2.22:
 * Instructor / Student -> POST /api/v1/discussions/:id/replies (content)
 * -> [Empty or Discussion Not Found]: 400 Bad Request (Invalid reply or discussion not found)
 * -> [Valid Reply]: createReply(instructorId, courseId, lectureId, content, parentId = id)
 *    -> Send notification (New reply to your question) to Student
 *    -> 201 Created (replyObject)
 */
export const createDiscussionReply = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để phản hồi thảo luận.',
      });
      return;
    }

    const parentDiscussionId = String(req.params.id);
    const content = (req.body.content || '').toString().trim();

    // alt: [Empty or Discussion Not Found] -> 400 Bad Request (Invalid reply or discussion not found)
    if (!content || !mongoose.Types.ObjectId.isValid(parentDiscussionId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid reply or discussion not found',
      });
      return;
    }

    const parentDiscussion =
      await CourseDiscussion.findById(parentDiscussionId);
    if (!parentDiscussion) {
      res.status(400).json({
        success: false,
        message: 'Invalid reply or discussion not found',
      });
      return;
    }

    const course = await Course.findById(parentDiscussion.courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học tương ứng.',
      });
      return;
    }

    const userId = String(req.user._id);
    const { hasAccess, isInstructor } = await checkDiscussionAccess(
      userId,
      req.user.role,
      course,
    );

    // PreCondition 1: Chỉ những người trong khóa học mới có quyền phản hồi
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message:
          'Chỉ học viên đã ghi danh hoặc giảng viên của khóa học mới có quyền phản hồi thảo luận.',
      });
      return;
    }

    // alt: [Valid Reply] -> createReply(instructorId, courseId, lectureId, content, parentId = id)
    const replyObject = await CourseDiscussion.createReply(
      userId,
      course._id,
      parentDiscussion.lectureId,
      content,
      parentDiscussion._id,
    );

    // Send notification (New reply to your question) cho người đặt câu hỏi gốc
    const recipientId = parentDiscussion.userId.toString();
    if (recipientId !== userId) {
      await Notification.create({
        recipientId: parentDiscussion.userId,
        senderId: userId,
        courseId: course._id,
        lectureId: parentDiscussion.lectureId,
        discussionId: replyObject._id,
        type: 'NEW_REPLY',
        title: 'Phản hồi mới cho câu hỏi của bạn',
        message: `${isInstructor ? 'Giảng viên' : req.user.fullName || 'Một học viên'} đã trả lời câu hỏi của bạn trong khóa học "${course.title}".`,
      });
    }

    const populatedReply = await CourseDiscussion.findById(
      replyObject._id,
    ).populate('userId', 'fullName email avatarUrl role');

    // 201 Created (replyObject)
    res.status(201).json({
      success: true,
      message: 'Gửi phản hồi thành công.',
      data: populatedReply,
    });
  } catch (error) {
    console.error('[DiscussionController] Error creating reply:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi phản hồi. Vui lòng thử lại sau.',
    });
  }
};

/**
 * PATCH /api/v1/discussions/:replyId/pin hoặc PATCH /api/discussions/:replyId/pin
 * Khớp Lược đồ tuần tự 3.2.22:
 * Instructor -> PATCH /api/v1/discussions/:replyId/pin ()
 * -> updatePinStatus(replyId, isPinned = true)
 * -> 200 OK (Pinned as official answer)
 */
export const pinOfficialAnswer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thực hiện hành động này.',
      });
      return;
    }

    const replyId = String(req.params.replyId);
    if (!mongoose.Types.ObjectId.isValid(replyId)) {
      res.status(400).json({
        success: false,
        message: 'Mã phản hồi không hợp lệ.',
      });
      return;
    }

    const discussion = await CourseDiscussion.findById(replyId);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi hoặc câu trả lời.',
      });
      return;
    }

    const course = await Course.findById(discussion.courseId);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy khóa học.',
      });
      return;
    }

    const userId = String(req.user._id);
    const { isInstructor, isAdmin } = await checkDiscussionAccess(
      userId,
      req.user.role,
      course,
    );

    // PreCondition 2: Chỉ Giảng viên chủ sở hữu khóa học (hoặc Admin) mới có quyền ghim câu trả lời chính thức
    if (!isInstructor && !isAdmin) {
      res.status(403).json({
        success: false,
        message:
          'Chỉ giảng viên sở hữu khóa học mới có quyền ghim câu trả lời chính thức.',
      });
      return;
    }

    // Toggle hoặc set isPinned
    const targetPin =
      req.body.isPinned !== undefined
        ? Boolean(req.body.isPinned)
        : !discussion.isPinned;

    // updatePinStatus(replyId, isPinned = true)
    const pinnedDiscussion = await CourseDiscussion.updatePinStatus(
      replyId,
      targetPin,
    );

    // Thông báo cho tác giả của câu trả lời nếu được giảng viên ghim
    if (targetPin && discussion.userId.toString() !== userId) {
      await Notification.create({
        recipientId: discussion.userId,
        senderId: userId,
        courseId: course._id,
        lectureId: discussion.lectureId,
        discussionId: discussion._id,
        type: 'OFFICIAL_ANSWER_PINNED',
        title: 'Câu trả lời của bạn đã được ghim!',
        message: `Giảng viên đã ghim câu trả lời của bạn làm câu trả lời chính thức trong khóa học "${course.title}".`,
      });
    }

    // 200 OK (Pinned as official answer)
    res.json({
      success: true,
      message: targetPin
        ? 'Pinned as official answer'
        : 'Đã bỏ ghim câu trả lời',
      data: pinnedDiscussion,
    });
  } catch (error) {
    console.error('[DiscussionController] Error pinning answer:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái ghim.',
    });
  }
};

/**
 * GET /api/v1/lectures/:id/discussions hoặc GET /api/lectures/:id/discussions
 * Lấy danh sách câu hỏi thảo luận kèm các phản hồi lồng nhau của một bài giảng
 * PreCondition: Học viên đã ghi danh, Giảng viên khóa học, hoặc Admin
 */
export const getLectureDiscussions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        isEnrolled: false,
        message: 'Vui lòng đăng nhập để xem thảo luận.',
      });
      return;
    }

    const lectureId = String(req.params.id);
    const courseIdQuery = req.query.courseId
      ? String(req.query.courseId)
      : undefined;

    const { course } = await findCourseByLectureOrId(lectureId, courseIdQuery);
    if (!course) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài giảng hoặc khóa học.',
      });
      return;
    }

    const userId = String(req.user._id);
    const { hasAccess, isInstructor, isAdmin, isEnrolled } =
      await checkDiscussionAccess(userId, req.user.role, course);

    // PreCondition 3: Từng khóa học sẽ có mục này và chỉ những người có trong khóa học này mới xem được
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        isEnrolled: false,
        message:
          'Chỉ học viên đã ghi danh hoặc giảng viên của khóa học mới có quyền truy cập thảo luận.',
      });
      return;
    }

    // Lấy tất cả câu hỏi gốc (parentId: null) của bài giảng (lọc bỏ nội dung vi phạm bị ẩn/xóa -
    const questions = await CourseDiscussion.find({
      lectureId,
      parentId: null,
      status: { $nin: ['HIDDEN', 'DELETED'] },
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate('userId', 'fullName email avatarUrl role')
      .lean();

    const questionIds = questions.map((q) => q._id);

    // Lấy toàn bộ phản hồi của các câu hỏi trên (lọc bỏ nội dung vi phạm bị ẩn/xóa -
    const replies = await CourseDiscussion.find({
      parentId: { $in: questionIds },
      status: { $nin: ['HIDDEN', 'DELETED'] },
    })
      .sort({ isPinned: -1, createdAt: 1 })
      .populate('userId', 'fullName email avatarUrl role')
      .lean();

    // Nhóm phản hồi theo parentId
    const repliesByParent = new Map<string, FormattedDiscussionReply[]>();
    replies.forEach((rep) => {
      const pId = rep.parentId ? rep.parentId.toString() : '';
      if (!repliesByParent.has(pId)) {
        repliesByParent.set(pId, []);
      }

      const repUser = rep.userId as unknown as FormattedUser;
      const repUserIdStr = repUser?._id ? repUser._id.toString() : '';

      repliesByParent.get(pId)!.push({
        _id: rep._id.toString(),
        courseId: rep.courseId.toString(),
        lectureId: rep.lectureId.toString(),
        userId: repUser,
        parentId: rep.parentId ? rep.parentId.toString() : null,
        content: rep.content,
        upvoteCount: rep.upvoteCount || 0,
        isPinned: rep.isPinned || false,
        isAuthor: repUserIdStr === userId,
        isInstructor:
          Boolean(course.instructorId) &&
          repUserIdStr === course.instructorId?.toString(),
        isUpvoted:
          rep.upvotedUsers?.some((u) => u.toString() === userId) || false,
        createdAt: rep.createdAt,
        updatedAt: rep.updatedAt,
      });
    });

    // Kết hợp cấu trúc lồng nhau (nested threaded discussions)
    const formattedQuestions: FormattedDiscussionQuestion[] = questions.map(
      (q) => {
        const qId = q._id.toString();
        const qReplies = repliesByParent.get(qId) || [];
        const qUser = q.userId as unknown as FormattedUser;
        const qUserIdStr = qUser?._id ? qUser._id.toString() : '';

        return {
          _id: qId,
          courseId: q.courseId.toString(),
          lectureId: q.lectureId.toString(),
          userId: qUser,
          parentId: null,
          content: q.content,
          upvoteCount: q.upvoteCount || 0,
          isPinned: q.isPinned || false,
          isAuthor: qUserIdStr === userId,
          isInstructor:
            Boolean(course.instructorId) &&
            qUserIdStr === course.instructorId?.toString(),
          isUpvoted:
            q.upvotedUsers?.some((u) => u.toString() === userId) || false,
          replies: qReplies,
          repliesCount: qReplies.length,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        };
      },
    );

    res.json({
      success: true,
      data: formattedQuestions,
      meta: {
        totalQuestions: questions.length,
        totalReplies: replies.length,
        isCourseInstructor: isInstructor,
        isAdmin,
        isEnrolled,
      },
    });
  } catch (error) {
    console.error('[DiscussionController] Error fetching discussions:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách thảo luận.',
    });
  }
};

/**
 * PATCH /api/v1/discussions/:id/upvote hoặc POST /api/discussions/:id/upvote
 * Thích hoặc bỏ thích một bình luận / câu hỏi
 */
export const toggleUpvoteDiscussion = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thích thảo luận.',
      });
      return;
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Mã thảo luận không hợp lệ.',
      });
      return;
    }

    const discussion = await CourseDiscussion.findById(id);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận.',
      });
      return;
    }

    const userId = req.user._id as mongoose.Types.ObjectId;
    const hasUpvoted = discussion.upvotedUsers.some(
      (u) => u.toString() === userId.toString(),
    );

    if (hasUpvoted) {
      discussion.upvotedUsers = discussion.upvotedUsers.filter(
        (u) => u.toString() !== userId.toString(),
      );
      discussion.upvoteCount = Math.max(0, discussion.upvoteCount - 1);
    } else {
      discussion.upvotedUsers.push(userId);
      discussion.upvoteCount += 1;
    }

    await discussion.save();

    res.json({
      success: true,
      data: {
        upvoteCount: discussion.upvoteCount,
        isUpvoted: !hasUpvoted,
      },
    });
  } catch (error) {
    console.error('[DiscussionController] Error upvoting discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật lượt thích.',
    });
  }
};

/**
 * DELETE /api/v1/discussions/:id hoặc DELETE /api/discussions/:id
 * Xóa câu hỏi hoặc câu trả lời (Chỉ tác giả, Giảng viên sở hữu, hoặc Admin)
 */
export const deleteDiscussion = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xóa thảo luận.',
      });
      return;
    }

    const id = String(req.params.id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Mã thảo luận không hợp lệ.',
      });
      return;
    }

    const discussion = await CourseDiscussion.findById(id);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thảo luận cần xóa.',
      });
      return;
    }

    const course = await Course.findById(discussion.courseId);
    const userId = String(req.user._id);

    const isAuthor = discussion.userId.toString() === userId;
    const isInstructor = Boolean(
      course &&
      course.instructorId &&
      course.instructorId.toString() === userId,
    );
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAuthor && !isInstructor && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa thảo luận này.',
      });
      return;
    }

    // Nếu xóa câu hỏi gốc, xóa luôn các câu trả lời kèm theo
    if (!discussion.parentId) {
      await CourseDiscussion.deleteMany({ parentId: discussion._id });
    }

    await CourseDiscussion.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Đã xóa thảo luận thành công.',
    });
  } catch (error) {
    console.error('[DiscussionController] Error deleting discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa thảo luận.',
    });
  }
};

/**
 * GET /api/v1/notifications
 * Lấy danh sách thông báo của người dùng hiện tại (Giảng viên / Học viên)
 */
export const getUserNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xem thông báo.',
      });
      return;
    }

    const userId = req.user._id;
    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('senderId', 'fullName avatarUrl role')
      .populate('courseId', 'title slug thumbnailUrl')
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('[DiscussionController] Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách thông báo.',
    });
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Đánh dấu một thông báo đã đọc
 */
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const id = String(req.params.id);
    await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { $set: { isRead: true } },
    );

    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error(
      '[DiscussionController] Error mark notification as read:',
      error,
    );
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { $set: { isRead: true } },
    );

    res.json({ success: true, message: 'Đã đánh dấu đọc tất cả thông báo' });
  } catch (error) {
    console.error(
      '[DiscussionController] Error mark all notifications as read:',
      error,
    );
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
  }
};
