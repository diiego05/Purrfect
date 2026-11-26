import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import { Course } from '../models/Course';
import Order from '../models/Order';
import { LectureNote } from '../models/LectureNote';

const getLecture = async (courseId: string, lectureId: string) => {
  if (
    !mongoose.Types.ObjectId.isValid(courseId) ||
    !mongoose.Types.ObjectId.isValid(lectureId)
  )
    return null;
  const course = await Course.findOne({
    _id: courseId,
    'sections.lectures._id': lectureId,
    isDeleted: false,
  });
  if (!course) return null;
  const lecture = course.sections
    .flatMap((section) => section.lectures || [])
    .find((item) => String(item._id) === lectureId);
  return lecture ? { course, lecture } : null;
};

const canManageNotes = async (req: AuthRequest, courseId: string) => {
  const user = req.user;
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return Boolean(
    await Order.findOne({ userId: user._id, courseId, status: 'PAID' }),
  );
};

export const getLectureNotes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const courseId = String(req.params.courseId);
  const lectureId = String(req.params.lectureId);
  if (!userId) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    return;
  }
  if (!(await canManageNotes(req, courseId))) {
    res
      .status(403)
      .json({ success: false, message: 'Bạn không có quyền xem ghi chú này.' });
    return;
  }
  const notes = await LectureNote.find({ userId, courseId, lectureId })
    .sort({ timestampSeconds: 1, createdAt: 1 })
    .lean();
  res.json({ success: true, data: notes });
};

export const createLectureNote = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const courseId = String(req.params.courseId);
  const lectureId = String(req.params.lectureId);
  const content = String(req.body.content || '').trim();
  const timestampSeconds = Number(req.body.timestampSeconds);
  if (!userId) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    return;
  }
  if (!content) {
    res
      .status(400)
      .json({
        success: false,
        message: 'Vui lòng nhập nội dung ghi chú trước khi lưu.',
      });
    return;
  }
  const found = await getLecture(courseId, lectureId);
  if (!found) {
    res
      .status(404)
      .json({ success: false, message: 'Không tìm thấy bài giảng.' });
    return;
  }
  if (!(await canManageNotes(req, courseId))) {
    res
      .status(403)
      .json({ success: false, message: 'Bạn không có quyền tạo ghi chú.' });
    return;
  }
  const maxSeconds = Math.max(0, (found.lecture.durationMinutes || 0) * 60);
  if (
    !Number.isFinite(timestampSeconds) ||
    timestampSeconds < 0 ||
    (maxSeconds > 0 && timestampSeconds > maxSeconds)
  ) {
    res
      .status(400)
      .json({ success: false, message: 'Mốc thời gian ghi chú không hợp lệ.' });
    return;
  }
  const note = await LectureNote.create({
    userId,
    courseId,
    lectureId,
    content,
    timestampSeconds: Math.floor(timestampSeconds),
  });
  res.status(201).json({ success: true, data: note });
};

export const updateLectureNote = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const content = String(req.body.content || '').trim();
  if (!content) {
    res
      .status(400)
      .json({
        success: false,
        message: 'Vui lòng nhập nội dung ghi chú trước khi lưu.',
      });
    return;
  }
  const note = await LectureNote.findOneAndUpdate(
    { _id: String(req.params.noteId), userId: req.user?._id },
    { content },
    { new: true },
  );
  if (!note) {
    res
      .status(404)
      .json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không có quyền sửa.',
      });
    return;
  }
  res.json({ success: true, data: note });
};

export const deleteLectureNote = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const note = await LectureNote.findOneAndDelete({
    _id: String(req.params.noteId),
    userId: req.user?._id,
  });
  if (!note) {
    res
      .status(404)
      .json({
        success: false,
        message: 'Không tìm thấy ghi chú hoặc bạn không có quyền xóa.',
      });
    return;
  }
  res.json({ success: true, message: 'Đã xóa ghi chú.' });
};
