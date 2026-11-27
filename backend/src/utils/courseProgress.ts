import mongoose from 'mongoose';
import { Course, ICourse } from '../models/Course';
import Order from '../models/Order';
import { UserInteraction } from '../models/UserInteraction';

export interface CourseProgressResult {
  totalLectures: number;
  completedCount: number;
  completedKeys: string[];
  progressPercent: number;
  isCompleted100: boolean;
}

/**
 * Kiểm tra học viên có quyền học hợp lệ (đã mua PAID hoặc ghi danh ENROLL miễn phí,
 * và không bị khóa do hoàn tiền REFUND_PENDING / REFUNDED).
 */
export const hasValidCourseEnrollment = async (
  userId: string,
  courseId: string,
): Promise<boolean> => {
  const blockedOrder = await Order.findOne({
    userId,
    courseId,
    status: { $in: ['REFUND_PENDING', 'REFUNDED'] },
  }).lean();

  const paidOrder = await Order.findOne({
    userId,
    courseId,
    status: 'PAID',
  }).lean();

  if (paidOrder) return true;
  if (blockedOrder) return false;

  const enrollInteraction = await UserInteraction.findOne({
    userId,
    courseId,
    actionType: 'ENROLL',
  }).lean();

  return Boolean(enrollInteraction);
};

/**
 * Tính toán tiến độ học tập thực tế của học viên cho 1 khóa học
 * dựa trên UserInteraction (actionType: 'PROGRESS').
 * Trả về danh sách key chuẩn hóa dạng `${sectionIndex}-${lectureIndex}`.
 */
export const computeCourseProgress = async (
  userId: string,
  courseInput: ICourse | Record<string, unknown> | string,
): Promise<CourseProgressResult> => {
  const course =
    typeof courseInput === 'string'
      ? await Course.findById(courseInput).select('sections').lean()
      : courseInput;

  if (!course || !Array.isArray((course as { sections?: unknown[] }).sections)) {
    return {
      totalLectures: 0,
      completedCount: 0,
      completedKeys: [],
      progressPercent: 0,
      isCompleted100: false,
    };
  }

  const sections = (
    course as {
      _id?: mongoose.Types.ObjectId;
      sections: Array<{
        lectures?: Array<{ _id?: mongoose.Types.ObjectId; title?: string }>;
      }>;
    }
  ).sections;

  const idToKeyMap = new Map<string, string>();
  const titleToKeyMap = new Map<string, string>();
  const validKeys = new Set<string>();

  sections.forEach((sec, sIdx) => {
    const lectures = Array.isArray(sec.lectures) ? sec.lectures : [];
    lectures.forEach((lec, lIdx) => {
      const key = `${sIdx}-${lIdx}`;
      validKeys.add(key);
      if (lec._id) {
        idToKeyMap.set(String(lec._id), key);
      }
      if (lec.title) {
        titleToKeyMap.set(lec.title.trim(), key);
      }
    });
  });

  const totalLectures = validKeys.size;
  const courseId = (course as { _id?: mongoose.Types.ObjectId })._id;

  if (totalLectures === 0 || !courseId) {
    return {
      totalLectures,
      completedCount: 0,
      completedKeys: [],
      progressPercent: 0,
      isCompleted100: false,
    };
  }

  const progressInteractions = await UserInteraction.find({
    userId,
    courseId,
    actionType: 'PROGRESS',
  })
    .sort({ createdAt: 1 })
    .lean();

  const completedSet = new Set<string>();

  for (const pi of progressInteractions) {
    const meta = (pi.metadata || {}) as Record<string, unknown>;
    if (
      meta.action === 'ENTER_LEARNING_ROOM' ||
      (meta.action === 'OPEN_LECTURE' && meta.isCompleted !== true)
    ) {
      continue;
    }

    let resolvedKey: string | undefined;
    if (meta.lectureId && idToKeyMap.has(String(meta.lectureId))) {
      resolvedKey = idToKeyMap.get(String(meta.lectureId));
    } else if (
      meta.sectionIndex !== undefined &&
      meta.lectureIndex !== undefined
    ) {
      const candidate = `${meta.sectionIndex}-${meta.lectureIndex}`;
      if (validKeys.has(candidate)) {
        resolvedKey = candidate;
      }
    } else if (
      typeof meta.lectureTitle === 'string' &&
      titleToKeyMap.has(meta.lectureTitle.trim())
    ) {
      resolvedKey = titleToKeyMap.get(meta.lectureTitle.trim());
    }

    if (!resolvedKey) continue;

    if (
      meta.action === 'UNCOMPLETED_LECTURE' ||
      meta.isCompleted === false ||
      meta.completed === false
    ) {
      completedSet.delete(resolvedKey);
      continue;
    }

    const isCompleted =
      meta.isCompleted === true ||
      meta.completed === true ||
      meta.action === 'COMPLETED_LECTURE' ||
      (typeof meta.watchPercent === 'number' && meta.watchPercent >= 80) ||
      (typeof meta.progressPercent === 'number' && meta.progressPercent >= 80);

    if (isCompleted) {
      completedSet.add(resolvedKey);
    }
  }

  const completedCount = completedSet.size;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / totalLectures) * 100),
  );

  return {
    totalLectures,
    completedCount,
    completedKeys: Array.from(completedSet),
    progressPercent,
    isCompleted100: totalLectures > 0 && completedCount >= totalLectures,
  };
};
