import { Router } from 'express';
import multer from 'multer';
import {
  authenticateToken,
  requireInstructor,
  requireAdmin,
} from '../middlewares/auth';
import {
  getInstructorCourses,
  getInstructorCourseById,
  createCourseDraft,
  updateCourse,
  uploadLectureMedia,
  uploadCourseThumbnail,
  submitCourseForApproval,
  deleteOrDisableCourse,
  toggleCourseStatus,
  approveCourse,
  rejectCourse,
} from '../controllers/instructorCourseController';

const router = Router();

// Multer memory storage cho tải ảnh thumbnail lên Cloudinary (tối đa 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'file', maxCount: 1 },
]);

// Multer memory storage cho tệp bài giảng (video/pdf)
const uploadLecture = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

const lectureFields = uploadLecture.fields([
  { name: 'file', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 1 },
  { name: 'media', maxCount: 1 },
]);

// Toàn bộ các API đều yêu cầu quyền Giảng viên (INSTRUCTOR hoặc ADMIN)
router.use(authenticateToken, requireInstructor);

// Tải ảnh đại diện khóa học lên Cloudinary (Trước khi tạo khóa học hoặc theo ID)
router.post('/upload-thumbnail', uploadFields, uploadCourseThumbnail);
router.post('/:id/upload-thumbnail', uploadFields, uploadCourseThumbnail);

// 5. Tải lên tệp bài giảng (Nén video & trích xuất transcript cho AI RAG - BR06.2, BR06.5)
// Hỗ trợ cả route không cần id và route có id
router.post('/upload-lecture', lectureFields, uploadLectureMedia);
router.post('/:id/upload-lecture', lectureFields, uploadLectureMedia);

// 1. Danh sách khóa học và chỉ số KPI
router.get('/', getInstructorCourses);

// 2. Chi tiết khóa học để soạn thảo
router.get('/:id', getInstructorCourseById);

// 3. Khởi tạo khóa học mới (Bản nháp - DRAFT)
router.post('/', createCourseDraft);

// 4. Cập nhật thông tin chung, đề cương bài giảng và học phí
router.put('/:id', updateCourse);

// 6. Gửi yêu cầu phê duyệt lên Admin (BR06.1, Exception 8a)
router.post('/:id/submit-approval', submitCourseForApproval);

// Phê duyệt hoặc từ chối khóa học (Chỉ dành cho Admin - BR06.1)
router.post('/:id/approve', requireAdmin, approveCourse);
router.post('/:id/reject', requireAdmin, rejectCourse);

// 7. Xóa hoặc chuyển trạng thái ngừng kinh doanh (BR06.4)
router.delete('/:id', deleteOrDisableCourse);

// 8. Tạm dừng kinh doanh hoặc mở bán lại
router.patch('/:id/toggle-status', toggleCourseStatus);

export default router;
