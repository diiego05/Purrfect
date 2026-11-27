import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Certificate, ICertificate } from '../models/Certificate';
import { Course } from '../models/Course';
import { User } from '../models/User';
import type { AuthRequest } from '../middlewares/auth';
import {
  computeCourseProgress,
  hasValidCourseEnrollment,
} from '../utils/courseProgress';

const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Tạo mã chứng chỉ duy nhất định dạng CERT-XXXXXXXXXXXX
 */
const generateCertificateCode = (): string => {
  const raw = crypto.randomUUID().replace(/-/g, '').toUpperCase();
  return `CERT-${raw.substring(0, 12)}`;
};

/**
 * Trích xuất tên giảng viên từ document Course đã populate instructorId
 */
const extractInstructorName = (courseDoc: unknown): string => {
  if (!courseDoc || typeof courseDoc !== 'object') return 'Giảng viên Purrfect';
  const instructor = (courseDoc as { instructorId?: unknown }).instructorId;
  if (instructor && typeof instructor === 'object') {
    const instObj = instructor as { fullName?: string; email?: string };
    return instObj.fullName || instObj.email || 'Giảng viên Purrfect';
  }
  return 'Giảng viên Purrfect';
};

/**
 * Chuẩn hóa payload chứng chỉ trả về cho client
 */
const formatCertificateResponse = (
  cert: ICertificate | Record<string, unknown>,
  instructorName?: string,
) => {
  const plain =
    typeof (cert as ICertificate).toObject === 'function'
      ? (cert as ICertificate).toObject()
      : (cert as Record<string, unknown>);

  const populatedCourse =
    plain.courseId &&
    typeof plain.courseId === 'object' &&
    'title' in plain.courseId
      ? plain.courseId
      : null;

  const resolvedCourseId = populatedCourse
    ? String((populatedCourse as { _id?: unknown })._id || '')
    : String(plain.courseId || '');

  const resolvedInstructorName =
    instructorName ||
    (populatedCourse
      ? extractInstructorName(populatedCourse)
      : 'Giảng viên Purrfect');

  const code = String(plain.certificateCode || '');

  return {
    ...plain,
    courseId: resolvedCourseId,
    instructorName: resolvedInstructorName,
    verifyPath: `/certificates/verify/${code}`,
    verifyUrl: `${FRONTEND_URL}/certificates/verify/${code}`,
  };
};

/**
 * Helper nội bộ: Phát hành chứng chỉ khi học viên hoàn thành 100% khóa học.
 * BR16.1: Mỗi (userId, courseId) chỉ phát hành 1 chứng chỉ khi đủ 100% tiến độ.
 * BR16.2: Mỗi chứng chỉ có mã định danh duy nhất và URL xác thực công khai.
 */
export const issueCertificate = async (
  userId: string,
  courseId: string,
): Promise<ICertificate | null> => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return null;
    }

    // BR16.1: Nếu chứng chỉ đã tồn tại -> trả về bản ghi hiện có (không cấp trùng)
    const existing = await Certificate.findOne({ userId, courseId });
    if (existing) return existing;

    const [course, student, enrolled] = await Promise.all([
      Course.findById(courseId).select('title sections instructorId').lean(),
      User.findById(userId).select('fullName email').lean(),
      hasValidCourseEnrollment(userId, courseId),
    ]);

    if (!course || !student || !enrolled) return null;

    // BR16.1: Xác minh học viên đã hoàn thành đủ 100% bài giảng
    const progress = await computeCourseProgress(userId, course);
    if (!progress.isCompleted100) {
      return null;
    }

    // BR16.2: Tạo mã định danh duy nhất toàn hệ thống
    let certificateCode = generateCertificateCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const dup = await Certificate.exists({ certificateCode });
      if (!dup) break;
      certificateCode = generateCertificateCode();
    }

    const cert = await Certificate.create({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId),
      certificateCode,
      studentName: student.fullName || student.email,
      courseTitle: course.title,
      issueDate: new Date(),
    });

    return cert;
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr?.code === 11000) {
      return Certificate.findOne({ userId, courseId });
    }
    console.error('[issueCertificate] Lỗi khi phát hành chứng chỉ:', err);
    return null;
  }
};

/**
 * GET /my-certificates
 * Lấy danh sách chứng chỉ của học viên đang đăng nhập.
 */
export const getMyCertificates = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const certs = await Certificate.find({ userId })
      .populate({
        path: 'courseId',
        select: 'title slug instructorId',
        populate: { path: 'instructorId', select: 'fullName email' },
      })
      .sort({ issueDate: -1 })
      .lean();

    const result = certs.map((c) => formatCertificateResponse(c));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[getMyCertificates]', err);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi lấy danh sách chứng chỉ' });
  }
};

/**
 * GET /my-certificates/:id
 * Lấy chi tiết 1 chứng chỉ (chỉ chủ sở hữu mới xem được).
 */
export const getCertificateById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const id = String(req.params.id || '');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res
        .status(400)
        .json({ success: false, message: 'ID chứng chỉ không hợp lệ' });
      return;
    }

    const cert = await Certificate.findById(id)
      .populate({
        path: 'courseId',
        select: 'title slug instructorId',
        populate: { path: 'instructorId', select: 'fullName email' },
      })
      .lean();

    if (!cert) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy chứng chỉ' });
      return;
    }

    if (cert.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem chứng chỉ này',
      });
      return;
    }

    res.json({
      success: true,
      data: formatCertificateResponse(cert),
    });
  } catch (err) {
    console.error('[getCertificateById]', err);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi lấy thông tin chứng chỉ' });
  }
};

/**
 * GET /certificates/verify/:code
 * Alternative Flow 6a: Xác thực chứng chỉ công khai theo mã certificateCode.
 * Không yêu cầu đăng nhập.
 */
export const verifyCertificate = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawCode = req.params.code;
    const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
    if (!code || typeof code !== 'string') {
      res
        .status(400)
        .json({ success: false, message: 'Mã chứng chỉ không hợp lệ' });
      return;
    }

    const cert = await Certificate.findOne({
      certificateCode: code.trim().toUpperCase(),
    }).lean();

    if (!cert) {
      res.status(404).json({
        success: false,
        message:
          'Không tìm thấy chứng chỉ với mã này. Có thể mã không hợp lệ hoặc chứng chỉ không tồn tại.',
      });
      return;
    }

    const course = await Course.findById(cert.courseId)
      .populate('instructorId', 'fullName email')
      .select('title instructorId')
      .lean();

    const instructorName = extractInstructorName(course);

    res.json({
      success: true,
      data: {
        certificateCode: cert.certificateCode,
        studentName: cert.studentName,
        courseTitle: cert.courseTitle,
        instructorName,
        issueDate: cert.issueDate,
        isValid: true,
        verifyPath: `/certificates/verify/${cert.certificateCode}`,
        verifyUrl: `${FRONTEND_URL}/certificates/verify/${cert.certificateCode}`,
      },
    });
  } catch (err) {
    console.error('[verifyCertificate]', err);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi xác thực chứng chỉ' });
  }
};

/**
 * GET /my-certificates/progress/:courseId
 * Lấy tiến độ bài giảng đã hoàn thành & chứng chỉ hiện có (nếu có) của học viên cho 1 khóa học.
 */
export const getCourseLearningProgress = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const courseId = String(req.params.courseId || '');
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ success: false, message: 'courseId không hợp lệ' });
      return;
    }

    const [course, existingCert] = await Promise.all([
      Course.findById(courseId)
        .populate('instructorId', 'fullName email')
        .select('title sections instructorId')
        .lean(),
      Certificate.findOne({ userId, courseId }).lean(),
    ]);

    if (!course) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
      return;
    }

    const progress = await computeCourseProgress(userId, course);
    let certDoc = existingCert;

    if (progress.isCompleted100 && !certDoc) {
      const issued = await issueCertificate(userId, courseId);
      if (issued) {
        certDoc = issued.toObject();
      }
    }

    res.json({
      success: true,
      data: {
        ...progress,
        certificate: certDoc
          ? formatCertificateResponse(certDoc, extractInstructorName(course))
          : null,
      },
    });
  } catch (err) {
    console.error('[getCourseLearningProgress]', err);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi tải tiến độ học tập' });
  }
};

/**
 * POST /my-certificates/issue
 * Phát hành chứng chỉ cho học viên khi hoàn thành 100% khóa học.
 */
export const issueCertificateForStudent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    const { courseId } = req.body as { courseId?: string };
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      res
        .status(400)
        .json({ success: false, message: 'courseId không hợp lệ' });
      return;
    }

    const cert = await issueCertificate(userId, courseId);
    if (!cert) {
      res.status(400).json({
        success: false,
        message:
          'Không thể phát hành chứng chỉ. Hãy đảm bảo bạn đã đăng ký và hoàn thành 100% khóa học.',
      });
      return;
    }

    const course = await Course.findById(courseId)
      .populate('instructorId', 'fullName email')
      .select('instructorId')
      .lean();

    res.json({
      success: true,
      message: 'Chứng chỉ đã được phát hành thành công!',
      data: formatCertificateResponse(cert, extractInstructorName(course)),
    });
  } catch (err) {
    console.error('[issueCertificateForStudent]', err);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi khi phát hành chứng chỉ' });
  }
};
