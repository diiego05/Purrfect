import React, { useState, useEffect, useCallback } from 'react';
import type {
  InstructorCourse,
  InstructorUserSummary,
} from '../../../types/instructorCourse';
import {
  fetchInstructorCourses,
  approveInstructorCourse,
  rejectInstructorCourse,
  toggleCourseStatus,
} from '../../../services/instructorCourseApi';
import {
  IconlySearch,
  IconlyTick,
  IconlyClose,
  IconlyDanger,
  IconlyPlay,
  IconlyAiChip,
  IconlyShow,
  IconlyRefresh,
  IconlyAward,
  IconlyInfoCircle,
} from '../../Onboarding/IconlyIcons';
import { formatVND } from '../../../utils/format';
import './CourseApprovalManagement.css';

const REJECTION_SUGGESTIONS = [
  'Khóa học chưa đủ số lượng bài giảng và bài tập thực hành theo chuẩn.',
  'Chất lượng âm thanh hoặc hình ảnh video bài giảng chưa đạt chuẩn yêu cầu.',
  'Mô tả khóa học và mục tiêu đầu ra chưa chi tiết hoặc thiếu rõ ràng.',
  'Nội dung bài giảng chưa hoàn thiện hoặc thiếu tài liệu đính kèm.',
  'Nội dung có dấu hiệu vi phạm bản quyền hoặc tiêu chuẩn cộng đồng.',
];

export const CourseApprovalManagement: React.FC = () => {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStatus, setActiveStatus] = useState<string>('PENDING_APPROVAL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals state
  const [inspectingCourse, setInspectingCourse] =
    useState<InstructorCourse | null>(null);
  const [inspectingTab, setInspectingTab] = useState<
    'overview' | 'syllabus' | 'instructor'
  >('syllabus');
  const [rejectingCourse, setRejectingCourse] =
    useState<InstructorCourse | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [approvingCourse, setApprovingCourse] =
    useState<InstructorCourse | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Toast alert
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchCoursesList = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const res = await fetchInstructorCourses({
          status: activeStatus,
          search: searchKeyword.trim(),
          all: true,
          adminView: true,
        });

        if (res.success && res.data) {
          setCourses(res.data.courses || []);
        }
      } catch (err) {
        showToast(
          'error',
          err instanceof Error
            ? err.message
            : 'Lỗi khi tải danh sách khóa học cần duyệt',
        );
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [activeStatus, searchKeyword],
  );

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      try {
        const res = await fetchInstructorCourses({
          status: activeStatus,
          search: searchKeyword.trim(),
          all: true,
          adminView: true,
        });

        if (!ignore && res.success && res.data) {
          setCourses(res.data.courses || []);
        }
      } catch (err) {
        if (!ignore) {
          showToast(
            'error',
            err instanceof Error
              ? err.message
              : 'Lỗi khi tải danh sách khóa học cần duyệt',
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [activeStatus, searchKeyword]);

  // Kiểm tra điều kiện phê duyệt   (Tối thiểu 1 chương và 3 bài học)
  const checkCompliance = (course: InstructorCourse) => {
    const secCount = course.sections?.length || 0;
    const lecCount = (course.sections || []).reduce(
      (sum, s) => sum + (s.lectures?.length || 0),
      0,
    );
    const passed = secCount >= 1 && lecCount >= 3;
    return {
      passed,
      secCount,
      lecCount,
    };
  };

  // Xác nhận Phê duyệt khóa học
  const handleConfirmApprove = async () => {
    if (!approvingCourse) return;
    setActionLoading(true);
    try {
      const res = await approveInstructorCourse(approvingCourse._id);
      showToast(
        'success',
        res.message ||
          `Đã phê duyệt và xuất bản khóa học "${approvingCourse.title}" thành công!`,
      );
      setApprovingCourse(null);
      if (inspectingCourse?._id === approvingCourse._id) {
        setInspectingCourse(null);
      }
      await fetchCoursesList(false);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Lỗi khi phê duyệt khóa học',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Xác nhận Từ chối phê duyệt khóa học
  const handleConfirmReject = async () => {
    if (!rejectingCourse) return;
    const reason =
      rejectionReason.trim() ||
      'Nội dung khóa học chưa đạt tiêu chuẩn phê duyệt.';
    setActionLoading(true);
    try {
      const res = await rejectInstructorCourse(rejectingCourse._id, reason);
      showToast(
        'success',
        res.message ||
          `Đã từ chối phê duyệt khóa học "${rejectingCourse.title}".`,
      );
      setRejectingCourse(null);
      setRejectionReason('');
      if (inspectingCourse?._id === rejectingCourse._id) {
        setInspectingCourse(null);
      }
      await fetchCoursesList(false);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Lỗi khi từ chối phê duyệt khóa học',
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Thay đổi trạng thái Ẩn / Bỏ ẩn khóa học
  const handleToggleHideCourse = async (course: InstructorCourse) => {
    setActionLoading(true);
    try {
      const res = await toggleCourseStatus(course._id);
      showToast(
        'success',
        res.message ||
          (course.status === 'PUBLISHED'
            ? `Đã ẩn khóa học "${course.title}".`
            : `Đã bỏ ẩn khóa học "${course.title}".`),
      );
      if (inspectingCourse?._id === course._id) {
        setInspectingCourse(null);
      }
      await fetchCoursesList(false);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error
          ? err.message
          : 'Lỗi khi thay đổi trạng thái ẩn/hiện khóa học',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getInstructorInfo = (
    instructorId?: InstructorUserSummary | string,
  ): { name: string; email: string; avatar: string; headline?: string } => {
    if (instructorId && typeof instructorId === 'object') {
      return {
        name:
          instructorId.fullName || instructorId.name || 'Giảng viên Purrfect',
        email: instructorId.email || 'giangvien@purrfect.edu.vn',
        avatar:
          instructorId.avatarUrl ||
          instructorId.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        headline: instructorId.headline,
      };
    }
    return {
      name: 'Giảng viên Purrfect',
      email: 'giangvien@purrfect.edu.vn',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    };
  };

  return (
    <div className="course-approval-container">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '10px',
            background:
              toast.type === 'success'
                ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border:
              toast.type === 'success'
                ? '1px solid #10b981'
                : '1px solid #ef4444',
            fontSize: '13.5px',
            fontWeight: 500,
          }}
        >
          {toast.type === 'success' ? (
            <IconlyTick size={18} color="#ffffff" />
          ) : (
            <IconlyDanger size={18} color="#ffffff" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="course-approval-header">
        <div className="course-approval-title-group">
          <h1>Kiểm duyệt & Phê duyệt Khóa học</h1>
          <p>
            Kiểm tra nội dung bài giảng, video clip, phụ đề transcript AI và xác
            nhận xuất bản lên nền tảng.
          </p>
        </div>

        <div className="course-approval-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fetchCoursesList(true)}
            title="Làm mới danh sách"
          >
            <IconlyRefresh size={16} color="currentColor" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="approval-filter-bar">
        <div className="approval-tabs">
          <button
            type="button"
            className={`approval-tab-btn ${activeStatus === 'PENDING_APPROVAL' ? 'active' : ''}`}
            onClick={() => setActiveStatus('PENDING_APPROVAL')}
          >
            <span>Chờ phê duyệt</span>
          </button>

          <button
            type="button"
            className={`approval-tab-btn ${activeStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveStatus('ALL')}
          >
            <span>Tất cả</span>
          </button>

          <button
            type="button"
            className={`approval-tab-btn ${activeStatus === 'PUBLISHED' ? 'active' : ''}`}
            onClick={() => setActiveStatus('PUBLISHED')}
          >
            <span>Đã xuất bản</span>
          </button>

          <button
            type="button"
            className={`approval-tab-btn ${activeStatus === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setActiveStatus('REJECTED')}
          >
            <span>Bị từ chối</span>
          </button>

          <button
            type="button"
            className={`approval-tab-btn ${activeStatus === 'DRAFT' ? 'active' : ''}`}
            onClick={() => setActiveStatus('DRAFT')}
          >
            <span>Bản nháp</span>
          </button>
        </div>

        <div className="approval-search-box">
          <IconlySearch size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Tìm theo tên khóa học hoặc giảng viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
      </div>

      {/* Main Course Table */}
      <div className="approval-table-card">
        {loading ? (
          <div className="approval-empty-state">
            <div className="approval-empty-icon">
              <IconlyRefresh size={28} color="currentColor" />
            </div>
            <p style={{ margin: 0 }}>Đang tải danh sách khóa học...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="approval-empty-state">
            <div className="approval-empty-icon">
              <IconlyInfoCircle size={28} color="currentColor" />
            </div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem' }}>
              Không có khóa học nào
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {activeStatus === 'PENDING_APPROVAL'
                ? 'Tuyệt vời! Hiện tại không có khóa học nào đang chờ phê duyệt.'
                : 'Không tìm thấy khóa học nào phù hợp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <div className="approval-table-wrapper">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giảng viên</th>
                  <th>Danh mục / Cấp độ</th>
                  <th>Đề cương</th>
                  <th>Học phí</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const compliance = checkCompliance(course);
                  const instructor = getInstructorInfo(course.instructorId);
                  const categoryName =
                    typeof course.categoryId === 'object' && course.categoryId
                      ? course.categoryId.name
                      : 'Kỹ năng số';

                  return (
                    <tr key={course._id}>
                      {/* Cột Khóa học */}
                      <td>
                        <div className="approval-course-cell">
                          <img
                            src={
                              course.thumbnailUrl ||
                              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80'
                            }
                            alt={course.title}
                            className="approval-course-thumb"
                          />
                          <div className="approval-course-meta">
                            <span
                              className="approval-course-title"
                              onClick={() => {
                                setInspectingCourse(course);
                                setInspectingTab('syllabus');
                              }}
                            >
                              {course.title}
                            </span>
                            <div className="approval-course-sub">
                              {course.badge && (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    color: '#0056d2',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {course.badge}
                                </span>
                              )}
                              <span style={{ color: '#64748b' }}>
                                /{course.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột Giảng viên */}
                      <td>
                        <div className="approval-instructor-cell">
                          <img
                            src={instructor.avatar}
                            alt={instructor.name}
                            className="approval-instructor-avatar"
                          />
                          <div className="approval-instructor-info">
                            <span className="approval-instructor-name">
                              {instructor.name}
                            </span>
                            <span className="approval-instructor-email">
                              {instructor.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột Danh mục & Cấp độ */}
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                          }}
                        >
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>
                            {categoryName}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              color: '#475569',
                              fontWeight: 500,
                            }}
                          >
                            {course.level === 'Beginner'
                              ? 'Cơ bản'
                              : course.level === 'Intermediate'
                                ? 'Trung cấp'
                                : 'Nâng cao'}
                          </span>
                        </div>
                      </td>

                      {/* Cột Đề cương */}
                      <td>
                        <div className="approval-compliance-box">
                          <span
                            style={{
                              fontSize: '12.5px',
                              color: '#334155',
                              fontWeight: 500,
                            }}
                          >
                            {compliance.secCount} chương • {compliance.lecCount}{' '}
                            bài học
                          </span>
                          {compliance.passed ? (
                            <span
                              className="compliance-badge-pass"
                              title="Đạt chuẩn xuất bản: tối thiểu 1 chương và 3 bài học"
                            >
                              <IconlyTick size={12} color="currentColor" />
                              <span>Đạt chuẩn</span>
                            </span>
                          ) : (
                            <span
                              className="compliance-badge-fail"
                              title="Chưa đạt chuẩn xuất bản: Khóa học phải có ít nhất 1 chương và 3 bài giảng có nội dung"
                            >
                              <IconlyDanger size={12} color="currentColor" />
                              <span>Thiếu bài học</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột Học phí */}
                      <td>
                        <div
                          style={{ display: 'flex', flexDirection: 'column' }}
                        >
                          {course.discountPrice &&
                          course.discountPrice > 0 &&
                          course.discountPrice < course.price ? (
                            <>
                              <span
                                style={{ color: '#059669', fontWeight: 700 }}
                              >
                                {formatVND(course.discountPrice)}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#64748b',
                                  textDecoration: 'line-through',
                                }}
                              >
                                {formatVND(course.price)}
                              </span>
                            </>
                          ) : course.price === 0 ? (
                            <span style={{ color: '#0056d2', fontWeight: 700 }}>
                              Miễn phí
                            </span>
                          ) : (
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>
                              {formatVND(course.price)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột Trạng thái */}
                      <td>
                        <span
                          className={`status-pill status-${course.status.toLowerCase()}`}
                        >
                          {course.status === 'PENDING_APPROVAL' && (
                            <span className="status-pulse-dot" />
                          )}
                          <span>
                            {course.status === 'PENDING_APPROVAL'
                              ? 'Chờ phê duyệt'
                              : course.status === 'PUBLISHED'
                                ? 'Đã xuất bản'
                                : course.status === 'REJECTED'
                                  ? 'Bị từ chối'
                                  : course.status === 'DISABLED'
                                    ? 'Đã vô hiệu hóa'
                                    : 'Bản nháp'}
                          </span>
                        </span>
                        {course.status === 'REJECTED' &&
                          course.rejectionReason && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#dc2626',
                                marginTop: '4px',
                                maxWidth: '180px',
                                lineHeight: 1.3,
                              }}
                            >
                              Lý do: {course.rejectionReason}
                            </div>
                          )}
                      </td>

                      {/* Cột Thao tác */}
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="approval-row-actions"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          {/* Xem & Kiểm tra */}
                          <button
                            type="button"
                            className="btn-action-inspect"
                            onClick={() => {
                              setInspectingCourse(course);
                              setInspectingTab('syllabus');
                            }}
                            title="Xem chi tiết nội dung khóa học và bài giảng"
                          >
                            <IconlyShow size={14} color="currentColor" />
                            <span>Kiểm tra</span>
                          </button>

                          {/* Nút Ẩn (khi đã xuất bản) */}
                          {course.status === 'PUBLISHED' && (
                            <button
                              type="button"
                              className="btn-action-hide"
                              disabled={actionLoading}
                              onClick={() => handleToggleHideCourse(course)}
                              title="Ẩn khóa học khỏi nền tảng"
                            >
                              <IconlyDanger size={13} color="currentColor" />
                              <span>Ẩn</span>
                            </button>
                          )}

                          {/* Nút Bỏ ẩn (khi đang bị ẩn/vô hiệu hóa) */}
                          {course.status === 'DISABLED' && (
                            <button
                              type="button"
                              className="btn-action-unhide"
                              disabled={actionLoading}
                              onClick={() => handleToggleHideCourse(course)}
                              title="Bỏ ẩn và mở lại khóa học"
                            >
                              <IconlyTick size={13} color="currentColor" />
                              <span>Bỏ ẩn</span>
                            </button>
                          )}

                          {/* Nút Phê duyệt (cho PENDING_APPROVAL, DRAFT, REJECTED) */}
                          {course.status !== 'PUBLISHED' &&
                            course.status !== 'DISABLED' && (
                              <button
                                type="button"
                                className="btn-action-approve"
                                disabled={!compliance.passed || actionLoading}
                                onClick={() => setApprovingCourse(course)}
                                title={
                                  compliance.passed
                                    ? 'Phê duyệt và xuất bản khóa học'
                                    : 'Chưa đủ điều kiện xuất bản (Cần tối thiểu 1 chương và 3 bài học)'
                                }
                              >
                                <IconlyTick size={14} color="#ffffff" />
                                <span>Duyệt</span>
                              </button>
                            )}

                          {/* Nút Từ chối (chỉ cho PENDING_APPROVAL) */}
                          {course.status === 'PENDING_APPROVAL' && (
                            <button
                              type="button"
                              className="btn-action-reject"
                              disabled={actionLoading}
                              onClick={() => {
                                setRejectingCourse(course);
                                setRejectionReason('');
                              }}
                              title="Từ chối phê duyệt khóa học kèm lý do phản hồi"
                            >
                              <IconlyClose size={13} color="currentColor" />
                              <span>Từ chối</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Kiểm tra chi tiết Khóa học & Bài giảng */}
      {inspectingCourse && (
        <div
          className="approval-modal-backdrop"
          onClick={() => setInspectingCourse(null)}
        >
          <div
            className="approval-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="approval-modal-header">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <IconlyAward size={22} color="#0056d2" />
                <div>
                  <h3 className="approval-modal-title">
                    Kiểm duyệt Khóa học: {inspectingCourse.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Mã khóa học: {inspectingCourse._id} • Đường dẫn: /
                    {inspectingCourse.slug}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px' }}
                onClick={() => setInspectingCourse(null)}
              >
                <IconlyClose size={16} color="currentColor" />
              </button>
            </div>

            <div className="approval-modal-body">
              {/* Inspection Tabs */}
              <div className="inspection-tabs">
                <button
                  type="button"
                  className={`inspection-tab-btn ${inspectingTab === 'syllabus' ? 'active' : ''}`}
                  onClick={() => setInspectingTab('syllabus')}
                >
                  Đề cương & Bài giảng (
                  {(inspectingCourse.sections || []).reduce(
                    (sum, s) => sum + (s.lectures?.length || 0),
                    0,
                  )}{' '}
                  bài)
                </button>
                <button
                  type="button"
                  className={`inspection-tab-btn ${inspectingTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setInspectingTab('overview')}
                >
                  Thông tin chung & Học phí
                </button>
                <button
                  type="button"
                  className={`inspection-tab-btn ${inspectingTab === 'instructor' ? 'active' : ''}`}
                  onClick={() => setInspectingTab('instructor')}
                >
                  Thông tin Giảng viên
                </button>
              </div>

              {/* Tab Đề cương & Bài giảng */}
              {inspectingTab === 'syllabus' && (
                <div>
                  {/* Compliance notice */}
                  {(() => {
                    const c = checkCompliance(inspectingCourse);
                    return c.passed ? (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                          fontSize: '12.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '14px',
                        }}
                      >
                        <IconlyTick size={16} color="#059669" />
                        <span>
                          <strong>Đạt chuẩn xuất bản:</strong> Khóa học có{' '}
                          {c.secCount} chương và {c.lecCount} bài giảng (yêu cầu
                          tối thiểu 1 chương và 3 bài).
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#991b1b',
                          fontSize: '12.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '14px',
                        }}
                      >
                        <IconlyDanger size={16} color="#dc2626" />
                        <span>
                          <strong>Chưa đạt chuẩn xuất bản:</strong> Khóa học
                          hiện mới có {c.secCount} chương và {c.lecCount} bài
                          giảng. Cần ít nhất 1 chương và 3 bài để phê duyệt xuất
                          bản.
                        </span>
                      </div>
                    );
                  })()}

                  {/* Sections list */}
                  {inspectingCourse.sections &&
                  inspectingCourse.sections.length > 0 ? (
                    inspectingCourse.sections.map((sec, secIdx) => (
                      <div
                        key={sec._id || secIdx}
                        className="inspect-section-item"
                      >
                        <div className="inspect-section-header">
                          <span>
                            Chương {secIdx + 1}: {sec.title}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {sec.lectures?.length || 0} bài giảng
                          </span>
                        </div>

                        <div>
                          {sec.lectures && sec.lectures.length > 0 ? (
                            sec.lectures.map((lec, lecIdx) => (
                              <div key={lec._id || lecIdx}>
                                <div className="inspect-lecture-item">
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <IconlyPlay size={14} color="#0056d2" />
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: '#0f172a',
                                      }}
                                    >
                                      {lecIdx + 1}. {lec.title}
                                    </span>
                                    {lec.isPreview && (
                                      <span
                                        style={{
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          background: '#eff6ff',
                                          color: '#0056d2',
                                          border: '1px solid #bfdbfe',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        Xem thử (Preview)
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      fontSize: '12px',
                                      color: '#64748b',
                                    }}
                                  >
                                    <span>
                                      {lec.durationMinutes || 10} phút
                                    </span>
                                    {lec.transcript ? (
                                      <span
                                        style={{
                                          color: '#7c3aed',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}
                                      >
                                        <IconlyAiChip
                                          size={12}
                                          color="#7c3aed"
                                        />
                                        <span>Có AI Transcript</span>
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>
                                        Chưa có transcript
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Hiển thị transcript nếu có */}
                                {lec.transcript && (
                                  <div className="inspect-transcript-box">
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#7c3aed',
                                        marginBottom: '4px',
                                      }}
                                    >
                                      Transcript phụ đề AI RAG:
                                    </div>
                                    {lec.transcript}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                padding: '12px 1rem',
                                fontSize: '12.5px',
                                color: '#64748b',
                                fontStyle: 'italic',
                              }}
                            >
                              Chương này chưa có bài học nào.
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#64748b',
                        padding: '20px',
                      }}
                    >
                      Khóa học chưa tạo chương mục nào.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Thông tin chung */}
              {inspectingTab === 'overview' && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
                  >
                    <img
                      src={
                        inspectingCourse.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={inspectingCourse.title}
                      style={{
                        width: '200px',
                        height: '120px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <h4
                        style={{
                          margin: '0 0 6px 0',
                          color: '#0f172a',
                          fontSize: '1.05rem',
                        }}
                      >
                        {inspectingCourse.title}
                      </h4>
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '13px',
                          color: '#475569',
                          lineHeight: 1.5,
                        }}
                      >
                        {inspectingCourse.shortDescription ||
                          'Chưa có mô tả ngắn.'}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '12.5px',
                          color: '#334155',
                        }}
                      >
                        <div>
                          Giá gốc:{' '}
                          <strong style={{ color: '#0f172a' }}>
                            {formatVND(inspectingCourse.price)}
                          </strong>
                        </div>
                        {inspectingCourse.discountPrice &&
                          inspectingCourse.discountPrice > 0 && (
                            <div>
                              Giá khuyến mãi:{' '}
                              <strong style={{ color: '#059669' }}>
                                {formatVND(inspectingCourse.discountPrice)}
                              </strong>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {inspectingCourse.description && (
                    <div>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '13px',
                          color: '#334155',
                          marginBottom: '6px',
                        }}
                      >
                        Mô tả chi tiết:
                      </strong>
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          color: '#334155',
                          lineHeight: 1.6,
                          maxHeight: '180px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {inspectingCourse.description}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Giảng viên */}
              {inspectingTab === 'instructor' && (
                <div>
                  {(() => {
                    const inst = getInstructorInfo(
                      inspectingCourse.instructorId,
                    );
                    return (
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          background: '#f8fafc',
                          padding: '16px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          alignItems: 'center',
                        }}
                      >
                        <img
                          src={inst.avatar}
                          alt={inst.name}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #334155',
                          }}
                        />
                        <div>
                          <h4
                            style={{
                              margin: '0 0 4px 0',
                              color: '#0f172a',
                              fontSize: '1.05rem',
                            }}
                          >
                            {inst.name}
                          </h4>
                          <span
                            style={{
                              fontSize: '12.5px',
                              color: '#0056d2',
                              display: 'block',
                              marginBottom: '6px',
                            }}
                          >
                            {inst.email}
                          </span>
                          {inst.headline && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: '13px',
                                color: '#475569',
                              }}
                            >
                              {inst.headline}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="approval-modal-footer">
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                Trạng thái hiện tại: <strong>{inspectingCourse.status}</strong>
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {inspectingCourse.status === 'PUBLISHED' ? (
                  <button
                    type="button"
                    className="btn-action-hide"
                    disabled={actionLoading}
                    onClick={() => handleToggleHideCourse(inspectingCourse)}
                  >
                    <IconlyDanger size={14} color="currentColor" />
                    <span>Ẩn khóa học</span>
                  </button>
                ) : inspectingCourse.status === 'DISABLED' ? (
                  <button
                    type="button"
                    className="btn-action-unhide"
                    disabled={actionLoading}
                    onClick={() => handleToggleHideCourse(inspectingCourse)}
                  >
                    <IconlyTick size={14} color="currentColor" />
                    <span>Bỏ ẩn khóa học</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn-action-reject"
                      disabled={actionLoading}
                      onClick={() => {
                        setRejectingCourse(inspectingCourse);
                        setRejectionReason('');
                      }}
                    >
                      <IconlyClose size={14} color="currentColor" />
                      <span>Từ chối phê duyệt</span>
                    </button>

                    <button
                      type="button"
                      className="btn-action-approve"
                      disabled={
                        !checkCompliance(inspectingCourse).passed ||
                        actionLoading
                      }
                      onClick={() => setApprovingCourse(inspectingCourse)}
                    >
                      <IconlyTick size={14} color="#ffffff" />
                      <span>Phê duyệt xuất bản</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Xác nhận Phê duyệt */}
      {approvingCourse && (
        <div
          className="approval-modal-backdrop"
          onClick={() => !actionLoading && setApprovingCourse(null)}
        >
          <div
            className="approval-modal-dialog"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="approval-modal-header">
              <h3
                className="approval-modal-title"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <IconlyTick size={20} color="#10b981" />
                <span>Xác nhận Phê duyệt</span>
              </h3>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px' }}
                onClick={() => setApprovingCourse(null)}
                disabled={actionLoading}
              >
                <IconlyClose size={16} color="currentColor" />
              </button>
            </div>
            <div className="approval-modal-body">
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                Bạn có chắc chắn muốn phê duyệt và xuất bản khóa học{' '}
                <strong style={{ color: '#0f172a' }}>
                  "{approvingCourse.title}"
                </strong>{' '}
                lên hệ thống?
              </p>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '12.5px',
                  color: '#64748b',
                }}
              >
                Khóa học sẽ ngay lập tức hiển thị công khai trên trang chủ, danh
                mục tìm kiếm và học viên có thể đăng ký học.
              </p>
            </div>
            <div
              className="approval-modal-footer"
              style={{ justifyContent: 'flex-end', gap: '10px' }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setApprovingCourse(null)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-action-approve"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={handleConfirmApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang duyệt...' : 'Xác nhận Phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Từ chối Phê duyệt kèm Lý do */}
      {rejectingCourse && (
        <div
          className="approval-modal-backdrop"
          onClick={() => !actionLoading && setRejectingCourse(null)}
        >
          <div
            className="approval-modal-dialog"
            style={{ maxWidth: '560px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="approval-modal-header">
              <h3
                className="approval-modal-title"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <IconlyClose size={20} color="#ef4444" />
                <span>Từ chối Phê duyệt Khóa học</span>
              </h3>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px' }}
                onClick={() => setRejectingCourse(null)}
                disabled={actionLoading}
              >
                <IconlyClose size={16} color="currentColor" />
              </button>
            </div>

            <div className="approval-modal-body">
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                Khóa học:{' '}
                <strong style={{ color: '#0f172a' }}>
                  "{rejectingCourse.title}"
                </strong>
              </p>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12.5px',
                  color: '#64748b',
                }}
              >
                Vui lòng cung cấp lý do hoặc góp ý cụ thể để giảng viên chỉnh
                sửa và nộp lại yêu cầu phê duyệt:
              </p>

              <div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Nhập lý do từ chối cụ thể để giảng viên hoàn thiện..."
                  rows={4}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '13px',
                    padding: '10px 12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />

                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Gợi ý lý do nhanh:
                  </span>
                  <div className="rejection-preset-chips">
                    {REJECTION_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        className="rejection-chip"
                        onClick={() => setRejectionReason(sug)}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="approval-modal-footer"
              style={{ justifyContent: 'flex-end', gap: '10px' }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRejectingCourse(null)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-action-reject"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  background: '#ef4444',
                  borderColor: '#ef4444',
                  color: '#ffffff',
                }}
                onClick={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang gửi...' : 'Gửi Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
