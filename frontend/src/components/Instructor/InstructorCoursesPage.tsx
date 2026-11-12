import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import type {
  InstructorCourse,
  InstructorStats,
} from '../../types/instructorCourse';
import type { Category } from '../../types/course';
import {
  fetchInstructorCourses,
  submitCourseForApproval,
  deleteOrDisableCourse,
  toggleCourseStatus,
  approveInstructorCourse,
  rejectInstructorCourse,
} from '../../services/instructorCourseApi';
import { fetchCategories } from '../../services/courseApi';
import { CourseEditorView } from './CourseEditorView';
import {
  IconlyFolder,
  IconlyPlus,
  IconlyTick,
  IconlyEdit,
  IconlyDelete,
  IconlySearch,
  IconlyStar,
  IconlyUserGroup,
  IconlyAward,
  IconlyDiscovery,
  IconlyBookmark,
  IconlyClose,
  IconlyShow,
  IconlyShield,
  IconlyDanger,
} from '../Onboarding/IconlyIcons';
import { formatVND } from '../../utils/format';
import './InstructorCoursesPage.css';

export const InstructorCoursesPage: React.FC = () => {
  const { user, isAuthenticated, navigate } = useAuth();

  // Dữ liệu
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<InstructorStats>({
    total: 0,
    published: 0,
    pendingApproval: 0,
    draft: 0,
    rejected: 0,
    disabled: 0,
    totalStudents: 0,
    totalRevenue: 0,
  });

  // Bộ lọc
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Chế độ Soạn thảo / Tạo mới khóa học (Hiển thị dạng trang View, không Popup)
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(
    null,
  );
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Modal Xác nhận xóa / ngừng kinh doanh
  const [deleteConfirmCourse, setDeleteConfirmCourse] =
    useState<InstructorCourse | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Tải danh mục ngành học
  useEffect(() => {
    fetchCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error('Lỗi khi tải danh mục:', err));
  }, []);

  // Tải danh sách khóa học của giảng viên
  // Tải danh sách khóa học của giảng viên khi mount hoặc khi bộ lọc thay đổi
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    fetchInstructorCourses({
      status: activeStatusTab,
      search: searchKeyword,
    })
      .then((res) => {
        if (!isMounted) return;
        setCourses(res.data.courses || []);
        setStats(res.data.stats);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Lỗi khi tải danh sách khóa học giảng viên',
        );
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, activeStatusTab, searchKeyword]);

  // Hàm reload khi hoàn thành thao tác
  const reloadCourses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetchInstructorCourses({
        status: activeStatusTab,
        search: searchKeyword,
      });
      setCourses(res.data.courses || []);
      setStats(res.data.stats);
    } catch {
      // Bỏ qua lỗi ngầm khi reload
    }
  }, [isAuthenticated, activeStatusTab, searchKeyword]);

  // Tự tắt Toast
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Gửi phê duyệt trực tiếp từ danh sách
  const handleSubmitApprovalDirect = async (courseId: string) => {
    try {
      const res = await submitCourseForApproval(courseId);
      setToastMsg(res.message);
      reloadCourses();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể gửi duyệt');
    }
  };

  // Chuyển đổi trạng thái Ngừng kinh doanh / Mở bán lại (BR06.4)
  const handleToggleStatus = async (courseId: string) => {
    try {
      const res = await toggleCourseStatus(courseId);
      setToastMsg(res.message);
      reloadCourses();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi đổi trạng thái',
      );
    }
  };

  // Quản trị viên duyệt xuất bản khóa học (BR06.1)
  const handleApproveCourse = async (courseId: string) => {
    try {
      const res = await approveInstructorCourse(courseId);
      setToastMsg(res.message);
      reloadCourses();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi phê duyệt khóa học',
      );
    }
  };

  // Quản trị viên từ chối phê duyệt khóa học
  const handleRejectCourse = async (courseId: string) => {
    const reason = window.prompt(
      'Nhập lý do từ chối khóa học (tùy chọn):',
      'Nội dung khóa học chưa đạt chuẩn kiểm duyệt.',
    );
    if (reason === null) return;
    try {
      const res = await rejectInstructorCourse(courseId, reason);
      setToastMsg(res.message);
      reloadCourses();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi từ chối khóa học',
      );
    }
  };

  // Xác nhận xóa hoặc ngừng kinh doanh (BR06.4)
  const handleConfirmDelete = async () => {
    if (!deleteConfirmCourse) return;
    setDeleting(true);
    try {
      const res = await deleteOrDisableCourse(deleteConfirmCourse._id);
      setToastMsg(res.message);
      setDeleteConfirmCourse(null);
      reloadCourses();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi xóa khóa học');
    } finally {
      setDeleting(false);
    }
  };

  // Nếu người dùng chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="instructor-page">
        <div className="instructor-container">
          <div
            className="instructor-stat-card"
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              maxWidth: '480px',
              margin: '40px auto',
            }}
          >
            <IconlyFolder size={48} color="#0056d2" />
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                margin: '16px 0 8px',
                color: '#f8fafc',
              }}
            >
              Yêu cầu đăng nhập Giảng viên
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              Vui lòng đăng nhập với tài khoản có vai trò{' '}
              <strong>Giảng viên (Instructor)</strong> để sử dụng bảng quản lý
              khóa học.
            </p>
            <button
              type="button"
              className="btn-create-course"
              style={{ margin: '0 auto' }}
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu vai trò không phải INSTRUCTOR hoặc ADMIN
  if (user && user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
    return (
      <div className="instructor-page">
        <div className="instructor-container">
          <div
            className="instructor-stat-card"
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              maxWidth: '540px',
              margin: '40px auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <IconlyAward size={44} color="#34d399" />
            </div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 800,
                margin: '0 0 10px',
                color: '#f8fafc',
              }}
            >
              Khu vực dành cho Giảng viên (Instructor)
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              Tài khoản hiện tại của bạn có vai trò{' '}
              <strong>Học viên ({user.role})</strong>. Tính năng quản lý khóa
              học, tổ chức chương học và tải video/tài liệu chỉ dành cho tài
              khoản có vai trò <strong>Giảng viên</strong>.
            </p>
            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
            >
              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </button>
              <button
                type="button"
                className="btn-create-course"
                onClick={() => navigate('/profile')}
              >
                Cập nhật hồ sơ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu người dùng đang trong chế độ Tạo mới hoặc Soạn thảo khóa học -> Hiển thị dạng trang View (Không popup)
  if (isCreatingNew || editingCourse) {
    return (
      <CourseEditorView
        course={editingCourse}
        categories={categories}
        onClose={() => {
          setIsCreatingNew(false);
          setEditingCourse(null);
          reloadCourses();
        }}
        onSuccess={(_updated, msg) => {
          setToastMsg(msg);
          setIsCreatingNew(false);
          setEditingCourse(null);
          reloadCourses();
        }}
      />
    );
  }

  return (
    <div className="instructor-page">
      <div className="instructor-container">
        {/* =========================================================================
            1. HEADER KHU VỰC GIẢNG VIÊN
           ========================================================================= */}
        <div className="instructor-header">
          <div className="instructor-header-left">
            <span className="instructor-badge">
              <IconlyAward size={15} color="#34d399" />
              <span>Khu vực Giảng viên (Instructor Workspace)</span>
            </span>
            <h1 className="instructor-title">Quản lý khóa học giảng dạy</h1>
            <p className="instructor-subtitle">
              Khởi tạo mới, tổ chức danh sách chương học, tải lên video nén
              chuẩn hóa & trích xuất transcript tự động phục vụ trợ lý RAG AI.
            </p>
          </div>

          <button
            type="button"
            className="btn-create-course"
            onClick={() => {
              setIsCreatingNew(true);
              setEditingCourse(null);
            }}
          >
            <IconlyPlus size={18} color="#ffffff" />
            <span>Tạo khóa học mới</span>
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div
            className="playlist-alert playlist-alert-error"
            style={{ marginBottom: '20px' }}
          >
            <span>{errorMsg}</span>
          </div>
        )}

        {/* =========================================================================
            2. CHỈ SỐ KPI GIẢNG VIÊN (STATS GRID)
           ========================================================================= */}
        <div className="instructor-stats-grid">
          <div className="instructor-stat-card">
            <span className="stat-label">Tổng khóa học</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-sub">Tất cả trạng thái</span>
          </div>

          <div className="instructor-stat-card stat-card-published">
            <span className="stat-label">Đang phát hành</span>
            <span className="stat-value">{stats.published}</span>
            <span className="stat-sub">Học viên đang học</span>
          </div>

          <div className="instructor-stat-card stat-card-pending">
            <span className="stat-label">Chờ phê duyệt</span>
            <span className="stat-value">{stats.pendingApproval}</span>
            <span className="stat-sub">Đang chờ Admin duyệt</span>
          </div>

          <div className="instructor-stat-card stat-card-draft">
            <span className="stat-label">Bản nháp (Draft)</span>
            <span className="stat-value">{stats.draft}</span>
            <span className="stat-sub">Đang soạn thảo</span>
          </div>

          <div className="instructor-stat-card stat-card-revenue">
            <span className="stat-label">Tổng học viên</span>
            <span className="stat-value">
              {stats.totalStudents.toLocaleString('vi-VN')}
            </span>
            <span className="stat-sub">Đã ghi danh</span>
          </div>
        </div>

        {/* =========================================================================
            3. THANH CÔNG CỤ & BỘ LỌC TRẠNG THÁI
           ========================================================================= */}
        <div className="instructor-toolbar">
          <div className="instructor-filter-tabs">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PUBLISHED', label: 'Đang phát hành' },
              { id: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
              { id: 'DRAFT', label: 'Bản nháp' },
              { id: 'REJECTED', label: 'Bị từ chối' },
              { id: 'DISABLED', label: 'Ngừng kinh doanh' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab-btn ${activeStatusTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveStatusTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="instructor-search-box">
            <IconlySearch size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>

        {/* =========================================================================
            4. DANH SÁCH KHÓA HỌC
           ========================================================================= */}
        {loading ? (
          <div
            style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}
          >
            <div
              className="playlist-spinner"
              style={{ margin: '0 auto 12px' }}
            />
            <p>Đang tải danh sách khóa học giảng viên...</p>
          </div>
        ) : courses.length === 0 ? (
          <div
            className="instructor-stat-card"
            style={{ textAlign: 'center', padding: '60px 20px' }}
          >
            <IconlyFolder size={44} color="#94a3b8" />
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '14px 0 6px',
                color: '#f8fafc',
              }}
            >
              Chưa có khóa học nào phù hợp
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              Bắt đầu tạo bài giảng đầu tiên của bạn để chia sẻ kiến thức tới
              hàng ngàn học viên.
            </p>
            <button
              type="button"
              className="btn-create-course"
              style={{ margin: '0 auto' }}
              onClick={() => {
                setIsCreatingNew(true);
                setEditingCourse(null);
              }}
            >
              <IconlyPlus size={16} color="#ffffff" />
              <span>Tạo khóa học ngay</span>
            </button>
          </div>
        ) : (
          <div className="instructor-courses-grid">
            {courses.map((c) => {
              const categoryName =
                typeof c.categoryId === 'object' && c.categoryId?.name
                  ? c.categoryId.name
                  : 'Chưa phân loại';

              const totalLectures = (c.sections || []).reduce(
                (acc, sec) => acc + (sec.lectures?.length || 0),
                0,
              );

              return (
                <div key={c._id} className="instructor-course-row">
                  {/* Thumbnail & Badge */}
                  <div className="instructor-course-thumb">
                    <img src={c.thumbnailUrl} alt={c.title} />
                    <span
                      className={`course-status-badge ${
                        c.status === 'PUBLISHED'
                          ? 'badge-published'
                          : c.status === 'PENDING_APPROVAL'
                            ? 'badge-pending'
                            : c.status === 'REJECTED'
                              ? 'badge-rejected'
                              : c.status === 'DISABLED'
                                ? 'badge-disabled'
                                : 'badge-draft'
                      }`}
                    >
                      {c.status === 'PUBLISHED'
                        ? 'Đang phát hành'
                        : c.status === 'PENDING_APPROVAL'
                          ? 'Chờ duyệt'
                          : c.status === 'REJECTED'
                            ? 'Từ chối'
                            : c.status === 'DISABLED'
                              ? 'Ngừng bán'
                              : 'Bản nháp'}
                    </span>
                  </div>

                  {/* Thông tin khóa học */}
                  <div className="instructor-course-info">
                    <h3
                      className="instructor-course-title"
                      onClick={() => setEditingCourse(c)}
                      title="Nhấn để mở trình soạn thảo"
                    >
                      {c.title}
                    </h3>

                    <div className="instructor-course-meta">
                      <span>
                        <IconlyFolder size={14} color="#94a3b8" />
                        <span>{categoryName}</span>
                      </span>
                      <span>
                        <IconlyDiscovery size={14} color="#38bdf8" />
                        <span>Trình độ: {c.level}</span>
                      </span>
                      <span>
                        <IconlyBookmark size={14} color="#34d399" />
                        <span>
                          <strong>{(c.sections || []).length}</strong> chương •{' '}
                          <strong>{totalLectures}</strong> bài giảng
                        </span>
                      </span>
                      <span>
                        <IconlyUserGroup size={14} color="#64748b" />
                        <span>
                          {(c.totalStudents || 0).toLocaleString('vi-VN')} học
                          viên
                        </span>
                      </span>
                      <span>
                        <IconlyStar size={14} color="#f59e0b" />
                        <span>{(c.averageRating || 5).toFixed(1)}</span>
                      </span>
                    </div>

                    <div className="instructor-course-pricing">
                      <span>
                        {c.price <= 0 ? 'Miễn phí' : formatVND(c.price)}
                      </span>
                      {c.discountPrice && c.discountPrice > 0 && (
                        <span className="original">
                          {formatVND(c.discountPrice)}
                        </span>
                      )}
                      {c.badge && (
                        <span
                          style={{
                            fontSize: '11px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {c.badge}
                        </span>
                      )}
                    </div>

                    {/* Lý do từ chối nếu có */}
                    {c.status === 'REJECTED' && c.rejectionReason && (
                      <div
                        style={{
                          marginTop: '8px',
                          background: '#fef2f2',
                          color: '#b91c1c',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                        }}
                      >
                        <strong>Lý do từ chối:</strong> {c.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Nhóm nút hành động */}
                  <div className="instructor-course-actions">
                    <button
                      type="button"
                      className="btn-action-edit"
                      onClick={() => setEditingCourse(c)}
                    >
                      <IconlyEdit size={15} color="#ffffff" />
                      <span>Soạn thảo</span>
                    </button>

                    {/* Nút gửi phê duyệt nếu đang là DRAFT hoặc REJECTED */}
                    {(c.status === 'DRAFT' || c.status === 'REJECTED') && (
                      <button
                        type="button"
                        className="btn-action-submit"
                        onClick={() => handleSubmitApprovalDirect(c._id)}
                      >
                        <span>Gửi duyệt</span>
                      </button>
                    )}

                    {/* Admin: Phê duyệt hoặc từ chối khóa học đang chờ duyệt */}
                    {user?.role === 'ADMIN' &&
                      c.status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            type="button"
                            className="btn-action-submit"
                            style={{
                              background:
                                'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                            }}
                            onClick={() => handleApproveCourse(c._id)}
                            title="Phê duyệt xuất bản khóa học"
                          >
                            <IconlyTick size={14} color="#ffffff" />
                            <span>Duyệt</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-danger"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handleRejectCourse(c._id)}
                            title="Từ chối phê duyệt"
                          >
                            <IconlyClose size={14} color="#f87171" />
                            <span>Từ chối</span>
                          </button>
                        </>
                      )}

                    {/* Xem trực tiếp trang khóa học */}
                    <button
                      type="button"
                      className="btn-action-secondary"
                      onClick={() => navigate(`/courses/${c.slug || c._id}`)}
                    >
                      <IconlyShow size={14} color="currentColor" />
                      <span>Xem</span>
                    </button>

                    {/* Tạm dừng kinh doanh / Mở bán lại */}
                    {(c.status === 'PUBLISHED' || c.status === 'DISABLED') && (
                      <button
                        type="button"
                        className="btn-action-secondary"
                        onClick={() => handleToggleStatus(c._id)}
                        title={
                          c.status === 'PUBLISHED'
                            ? 'Ngừng bán khóa học'
                            : 'Mở bán lại khóa học'
                        }
                      >
                        <span>
                          {c.status === 'PUBLISHED'
                            ? 'Tạm ngừng bán'
                            : 'Mở bán lại'}
                        </span>
                      </button>
                    )}

                    {/* Xóa khóa học (BR06.4) */}
                    <button
                      type="button"
                      className="btn-action-danger"
                      onClick={() => setDeleteConfirmCourse(c)}
                      title="Xóa khóa học"
                    >
                      <IconlyDelete size={15} color="#dc2626" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL XÁC NHẬN XÓA / NGỪNG KINH DOANH (BR06.4)
         ========================================================================= */}
      {deleteConfirmCourse && (
        <div
          className="editor-modal-backdrop"
          onClick={() => setDeleteConfirmCourse(null)}
        >
          <div
            className="playlist-modal-dialog"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="playlist-modal-header">
              <h3
                className="playlist-modal-title"
                style={{
                  color: '#f87171',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconlyDanger size={20} color="#f87171" />
                <span>Xác nhận thao tác xóa</span>
              </h3>
              <button
                type="button"
                className="playlist-modal-close-btn"
                onClick={() => setDeleteConfirmCourse(null)}
              >
                <IconlyClose size={16} color="currentColor" />
              </button>
            </div>

            <div className="playlist-modal-body">
              {deleteConfirmCourse.status === 'PUBLISHED' &&
              (deleteConfirmCourse.totalStudents || 0) > 0 ? (
                <div
                  style={{
                    fontSize: '13.5px',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: '0 0 12px 0' }}>
                    Khóa học{' '}
                    <strong style={{ color: '#ffffff' }}>
                      "{deleteConfirmCourse.title}"
                    </strong>{' '}
                    đã xuất bản và hiện có{' '}
                    <strong style={{ color: '#ffffff' }}>
                      {deleteConfirmCourse.totalStudents}
                    </strong>{' '}
                    học viên đã đăng ký học.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fde68a',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <IconlyShield size={18} color="#fcd34d" />
                    <div>
                      <strong>Lưu ý:</strong> Để bảo toàn quyền lợi học tập của
                      học viên cũ, hệ thống sẽ chuyển khóa học sang trạng thái{' '}
                      <strong>"Ngừng kinh doanh" (DISABLED)</strong> thay vì xóa
                      vĩnh viễn.
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#e2e8f0',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Bạn có chắc chắn muốn xóa khóa học{' '}
                  <strong style={{ color: '#ffffff' }}>
                    "{deleteConfirmCourse.title}"
                  </strong>{' '}
                  không? Thao tác này sẽ gỡ bỏ dữ liệu bài giảng.
                </p>
              )}
            </div>

            <div className="playlist-modal-footer">
              <button
                type="button"
                className="playlist-btn-secondary"
                onClick={() => setDeleteConfirmCourse(null)}
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className={
                  deleteConfirmCourse.status === 'PUBLISHED' &&
                  (deleteConfirmCourse.totalStudents || 0) > 0
                    ? 'playlist-btn-warning'
                    : 'playlist-btn-danger'
                }
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? 'Đang xử lý...'
                  : deleteConfirmCourse.status === 'PUBLISHED' &&
                      (deleteConfirmCourse.totalStudents || 0) > 0
                    ? 'Chuyển sang Ngừng bán'
                    : 'Xóa khóa học'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="playlist-toast">
          <IconlyTick size={18} color="#22c55e" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
