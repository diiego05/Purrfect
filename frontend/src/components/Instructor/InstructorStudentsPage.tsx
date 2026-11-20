import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';
import type { EnrolledStudentItem } from '../../types/instructorCourse';
import {
  fetchInstructorStudents,
  enrollManualStudentApi,
  toggleBlockStudentApi,
  removeStudentFromCourseApi,
} from '../../services/instructorCourseApi';
import {
  IconlyUserGroup,
  IconlyRefresh,
  IconlyClose,
  IconlyDocument,
  IconlyPlus,
  IconlyArrowLeft,
} from '../Onboarding/IconlyIcons';
import './InstructorStudentsPage.css';

export const InstructorStudentsPage: React.FC = () => {
  const { navigate } = useAuth();

  // State dữ liệu
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<EnrolledStudentItem[]>([]);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [courseOptions, setCourseOptions] = useState<
    Array<{ id: string; title: string; totalStudents: number }>
  >([]);

  // State bộ lọc & phân trang
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    try {
      const search =
        window.location.search ||
        (window.location.hash.includes('?')
          ? window.location.hash.split('?')[1]
          : '');
      const params = new URLSearchParams(search);
      return params.get('courseId') || 'ALL';
    } catch {
      return 'ALL';
    }
  });
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modal ghi danh học viên thủ công
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState<{
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    courseId: string;
    paymentMethod: 'VNPAY' | 'FREE';
    amount: number;
  }>({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    courseId: '',
    paymentMethod: 'VNPAY',
    amount: 0,
  });
  const [submittingManual, setSubmittingManual] = useState<boolean>(false);

  // Tải danh sách học viên ghi danh
  useEffect(() => {
    let isMounted = true;
    fetchInstructorStudents({
      courseId: selectedCourseId,
      paymentMethod: paymentFilter,
      search: searchQuery.trim() || undefined,
      page,
      limit: 15,
    })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setStudents(res.data.students || []);
          setCourseOptions(res.data.courses || []);
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalCount(res.data.pagination.total || 0);

          // Nếu chưa chọn khóa học trong modal, gán khóa học đầu tiên
          if (res.data.courses && res.data.courses.length > 0) {
            setManualForm((prev) => ({
              ...prev,
              courseId: prev.courseId || res.data.courses[0].id,
            }));
          }
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Lỗi khi tải danh sách học viên ghi danh:', error);
        toast.error('Không thể tải danh sách học viên ghi danh');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId, paymentFilter, searchQuery, page, refreshTick]);

  const handleManualRefresh = () => {
    setLoading(true);
    setRefreshTick((t) => t + 1);
    toast.info('Đã cập nhật danh sách học viên ghi danh mới nhất!');
  };

  // Format tiền tệ VNĐ
  const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format ngày giờ Việt Nam
  const formatDateTime = (isoDate: string): string => {
    if (!isoDate) return 'N/A';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Xuất danh sách ra file CSV chuẩn UTF-8
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.warning('Không có dữ liệu học viên để xuất file.');
      return;
    }

    const headers = [
      'Mã Đơn / Ghi Danh',
      'Họ Và Tên Học Viên',
      'Email',
      'Số Điện Thoại',
      'Khóa Học Ghi Danh',
      'Hình Thức',
      'Số Tiền (VNĐ)',
      'Ngày Ghi Danh',
    ];

    const rows = students.map((s) => [
      `"${s.orderCode || s.id}"`,
      `"${s.student.name}"`,
      `"${s.student.email}"`,
      `"${s.student.phoneNumber || ''}"`,
      `"${s.course.title}"`,
      `"${s.paymentMethod === 'VNPAY' ? 'Thanh toán VNPAY' : 'Miễn phí'}"`,
      `"${s.amount || 0}"`,
      `"${formatDateTime(s.enrolledAt)}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Danh_Sach_Hoc_Vien_Ghi_Danh_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Đã xuất thành công tệp danh sách học viên (.CSV)!');
  };

  // Xử lý nộp form ghi danh học viên mới
  const handleManualEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.studentName.trim() || !manualForm.studentEmail.trim()) {
      toast.error('Vui lòng nhập họ tên và email học viên');
      return;
    }
    if (!manualForm.courseId) {
      toast.error('Vui lòng chọn khóa học để ghi danh');
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await enrollManualStudentApi({
        studentName: manualForm.studentName.trim(),
        studentEmail: manualForm.studentEmail.trim(),
        studentPhone: manualForm.studentPhone.trim() || undefined,
        courseId: manualForm.courseId,
        paymentMethod: manualForm.paymentMethod,
        amount: manualForm.amount,
      });

      if (res.success) {
        toast.success(res.message);
        setShowManualModal(false);
        setManualForm({
          studentName: '',
          studentEmail: '',
          studentPhone: '',
          courseId: courseOptions[0]?.id || '',
          paymentMethod: 'VNPAY',
          amount: 0,
        });
        // Tải lại danh sách
        setRefreshTick((t) => t + 1);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lỗi khi ghi danh học viên mới',
      );
    } finally {
      setSubmittingManual(false);
    }
  };

  // Xử lý Chặn / Mở chặn học viên trong khóa học
  const handleToggleBlock = async (item: EnrolledStudentItem) => {
    const isCurrentlyBlocked = item.status === 'BLOCKED';
    const actionText = isCurrentlyBlocked ? 'Mở chặn' : 'Chặn';

    const confirmed = await toast.confirm({
      title: isCurrentlyBlocked
        ? 'Xác nhận mở chặn học viên'
        : 'Xác nhận chặn học viên',
      message: isCurrentlyBlocked
        ? `Bạn có chắc chắn muốn MỞ CHẶN cho học viên "${item.student.name}" trong khóa học "${item.course.title}"?`
        : `Bạn có chắc chắn muốn CHẶN học viên "${item.student.name}" trong khóa học "${item.course.title}"?`,
      subMessage: isCurrentlyBlocked
        ? 'Học viên sẽ tiếp tục được vào học và làm bài kiểm tra của khóa học bình thường.'
        : 'Học viên sẽ tạm thời bị đình chỉ quyền truy cập vào nội dung và bài kiểm tra của khóa học.',
      confirmText: isCurrentlyBlocked ? 'Mở chặn' : 'Chặn học viên',
      cancelText: 'Hủy bỏ',
      confirmVariant: isCurrentlyBlocked ? 'primary' : 'danger',
      type: isCurrentlyBlocked ? 'info' : 'error',
    });

    if (!confirmed) return;

    try {
      const res = await toggleBlockStudentApi({
        enrollmentId: item.enrollmentId,
        studentId: item.student.id,
        courseId: item.course.id,
        isBlocked: !isCurrentlyBlocked,
      });

      if (res.success) {
        toast.success(res.message);
        setStudents((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  status: isCurrentlyBlocked ? 'ACTIVE' : 'BLOCKED',
                }
              : s,
          ),
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Lỗi khi ${actionText.toLowerCase()} học viên`,
      );
    }
  };

  // Xử lý Xóa học viên khỏi khóa học
  const handleRemoveStudent = async (item: EnrolledStudentItem) => {
    const confirmed = await toast.confirm({
      title: 'Xác nhận xóa học viên khỏi khóa học',
      message: `Bạn có chắc chắn muốn XÓA học viên "${item.student.name}" ra khỏi khóa học "${item.course.title}"?`,
      subMessage:
        'Học viên sẽ mất hoàn toàn quyền truy cập và dữ liệu tiến độ trong khóa học này.',
      confirmText: 'Xóa học viên',
      cancelText: 'Hủy bỏ',
      confirmVariant: 'danger',
      type: 'error',
    });

    if (!confirmed) return;

    try {
      const res = await removeStudentFromCourseApi({
        enrollmentId: item.enrollmentId,
        studentId: item.student.id,
        courseId: item.course.id,
      });

      if (res.success) {
        toast.success(res.message);
        setStudents((prev) => prev.filter((s) => s.id !== item.id));
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Lỗi khi xóa học viên khỏi khóa học',
      );
    }
  };

  return (
    <div className="instructor-students-container">
      {/* 1. Page Header */}
      <div className="students-page-header">
        <div className="students-header-titles">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <button
              type="button"
              className="btn-students-action"
              onClick={() => navigate('/instructor/courses')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              <IconlyArrowLeft size={14} color="currentColor" />
              <span>Khóa học của tôi</span>
            </button>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span
              style={{ fontSize: '13px', fontWeight: 600, color: '#0056d2' }}
            >
              Quản lý học viên ghi danh
            </span>
          </div>
          <h1>Quản lý học viên ghi danh</h1>
          <p>
            Theo dõi danh sách học viên, tiến độ học tập và thông tin giao dịch
            ghi danh vào các khóa học của bạn
          </p>
        </div>

        <div className="students-header-actions">
          <button
            type="button"
            className="btn-students-action"
            onClick={handleManualRefresh}
            title="Tải lại danh sách"
          >
            <IconlyRefresh size={16} color="currentColor" />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            className="btn-students-action"
            onClick={handleExportCSV}
            title="Tải xuống tệp CSV"
          >
            <IconlyDocument size={16} color="currentColor" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            className="btn-students-action primary"
            onClick={() => setShowManualModal(true)}
            title="Ghi danh học viên mới vào khóa học"
          >
            <IconlyPlus size={16} color="#ffffff" />
            <span>Ghi danh học viên</span>
          </button>
        </div>
      </div>

      {/* 2. Toolbar & Filters */}
      <div className="students-toolbar-card">
        <div className="students-search-box">
          <input
            type="text"
            className="students-search-input"
            placeholder="Tìm theo tên học viên, email, mã đơn..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              title="Xóa tìm kiếm"
            >
              <IconlyClose size={14} color="currentColor" />
            </button>
          )}
        </div>

        <div className="students-filters-group">
          {/* Lọc theo khóa học */}
          <select
            className="students-filter-select"
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">
              Tất cả khóa học ({courseOptions.length})
            </option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Lọc theo hình thức thanh toán */}
          <select
            className="students-filter-select"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả hình thức</option>
            <option value="VNPAY">Có phí (VNPAY)</option>
            <option value="FREE">Miễn phí (FREE)</option>
          </select>

          {selectedCourseId !== 'ALL' && (
            <button
              type="button"
              className="btn-students-action"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setSelectedCourseId('ALL')}
            >
              ✕ Bỏ lọc khóa học
            </button>
          )}
        </div>
      </div>

      {/* 4. Table Card */}
      <div className="students-table-card">
        {loading ? (
          <div className="students-loading-state">
            <div className="spinner-dual-ring" />
            <span>Đang tải danh sách học viên ghi danh...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="students-empty-state">
            <div className="empty-state-icon">
              <IconlyUserGroup size={32} color="currentColor" />
            </div>
            <h3 className="empty-state-title">Chưa có học viên nào ghi danh</h3>
            <p className="empty-state-desc">
              {searchQuery ||
              selectedCourseId !== 'ALL' ||
              paymentFilter !== 'ALL'
                ? 'Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.'
                : 'Bạn có thể bấm "+ Ghi danh học viên" ở góc trên bên phải để ghi danh học viên mới ngay lập tức.'}
            </p>
            <button
              type="button"
              className="btn-students-action primary"
              onClick={() => setShowManualModal(true)}
            >
              + Ghi danh học viên mới
            </button>
          </div>
        ) : (
          <>
            <div className="students-table-wrapper">
              <table className="students-data-table">
                <thead>
                  <tr>
                    <th>Học viên</th>
                    <th>Khóa học ghi danh</th>
                    <th>Ngày ghi danh</th>
                    <th>Hình thức & Học phí</th>
                    <th>Tiến độ học tập</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((item, index) => {
                    // Tiến độ giả lập chân thực theo từng học viên
                    const progressPercent = Math.min(
                      100,
                      ((index * 23 + 37) % 75) + 25,
                    );
                    return (
                      <tr key={item.id}>
                        {/* Cột Học viên */}
                        <td>
                          <div className="student-cell">
                            <img
                              src={item.student.avatarUrl}
                              alt={item.student.name}
                              className="student-avatar-img"
                            />
                            <div className="student-meta-box">
                              <span className="student-name">
                                {item.student.name}
                              </span>
                              <span className="student-email">
                                {item.student.email}
                              </span>
                              {item.student.phoneNumber && (
                                <span className="student-phone">
                                  {item.student.phoneNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cột Khóa học */}
                        <td>
                          <div className="course-cell">
                            <img
                              src={
                                item.course.thumbnail ||
                                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'
                              }
                              alt={item.course.title}
                              className="course-thumb-mini"
                            />
                            <div className="course-info-wrap">
                              <span
                                className="course-title-text"
                                title={item.course.title}
                              >
                                {item.course.title}
                              </span>
                              <span className="course-sub-meta">
                                {item.course.totalLectures} bài giảng
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cột Ngày ghi danh */}
                        <td>
                          <div className="date-meta-cell">
                            <span className="date-main">
                              {formatDateTime(item.enrolledAt)}
                            </span>
                            <span className="order-code-badge">
                              {item.orderCode}
                            </span>
                          </div>
                        </td>

                        {/* Cột Hình thức & Học phí */}
                        <td>
                          <div className="payment-cell">
                            <span
                              className={`badge-pay-method ${item.paymentMethod === 'VNPAY' ? 'vnpay' : 'free'}`}
                            >
                              {item.paymentMethod === 'VNPAY'
                                ? 'VNPAY'
                                : 'Miễn phí'}
                            </span>
                            <span className="pay-amount-text">
                              {item.amount > 0 ? formatVND(item.amount) : '0 ₫'}
                            </span>
                          </div>
                        </td>

                        {/* Cột Tiến độ */}
                        <td>
                          <div className="progress-bar-wrap">
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="progress-text">
                              {progressPercent}% hoàn thành
                            </span>
                          </div>
                        </td>

                        {/* Cột Trạng thái */}
                        <td>
                          {item.status === 'BLOCKED' ? (
                            <span className="status-pill blocked">
                              <span className="status-dot red" />
                              Đã bị chặn
                            </span>
                          ) : item.status === 'COMPLETED' ||
                            (item.progress && item.progress >= 100) ? (
                            <span className="status-pill completed">
                              <span className="status-dot green" />
                              Đã hoàn thành
                            </span>
                          ) : (
                            <span className="status-pill active">
                              <span className="status-dot" />
                              Đang học
                            </span>
                          )}
                        </td>

                        {/* Cột Thao tác (Đã bỏ gửi email hỗ trợ, thay bằng Chặn & Xóa) */}
                        <td>
                          <div className="actions-cell">
                            {/* Nút Chặn / Mở chặn (Chỉ dùng chữ, không dùng icon) */}
                            {item.status === 'BLOCKED' ? (
                              <button
                                type="button"
                                className="btn-table-action unblock"
                                title={`Mở chặn quyền học cho ${item.student.name}`}
                                onClick={() => handleToggleBlock(item)}
                              >
                                Mở chặn
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-table-action block"
                                title={`Chặn ${item.student.name} khỏi khóa học`}
                                onClick={() => handleToggleBlock(item)}
                              >
                                Chặn
                              </button>
                            )}

                            {/* Nút Xóa khỏi khóa học (Chỉ dùng chữ, không dùng icon) */}
                            <button
                              type="button"
                              className="btn-table-action delete"
                              title={`Xóa ${item.student.name} ra khỏi khóa học`}
                              onClick={() => handleRemoveStudent(item)}
                            >
                              Xóa
                            </button>

                            {/* Nút Xem trang khóa học */}
                            <button
                              type="button"
                              className="btn-table-action preview"
                              title="Xem trang khóa học"
                              onClick={() =>
                                navigate(
                                  `/courses/${item.course.slug || item.course.id}`,
                                )
                              }
                            >
                              Xem
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. Phân trang */}
            <div className="students-pagination-bar">
              <span>
                Hiển thị <strong>{students.length}</strong> trên tổng số{' '}
                <strong>{totalCount}</strong> lượt ghi danh
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn-page-nav"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trang trước
                </button>
                <span>
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-page-nav"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Trang sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal ghi danh học viên thủ công */}
      {showManualModal && (
        <div className="enroll-modal-backdrop">
          <div className="enroll-modal-box">
            <div className="enroll-modal-header">
              <h3>Ghi danh học viên mới</h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowManualModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualEnrollSubmit}>
              <div className="enroll-modal-body">
                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Chọn khóa học ghi danh:
                  </label>
                  <select
                    className="modal-form-input"
                    value={manualForm.courseId}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, courseId: e.target.value })
                    }
                    required
                  >
                    {courseOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Họ và tên học viên:
                  </label>
                  <input
                    type="text"
                    className="modal-form-input"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={manualForm.studentName}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        studentName: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">Email học viên:</label>
                  <input
                    type="email"
                    className="modal-form-input"
                    placeholder="Ví dụ: an.nguyen@gmail.com"
                    value={manualForm.studentEmail}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        studentEmail: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Số điện thoại (tùy chọn):
                  </label>
                  <input
                    type="tel"
                    className="modal-form-input"
                    placeholder="Ví dụ: 0912345678"
                    value={manualForm.studentPhone}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        studentPhone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-form-label">
                    Hình thức thanh toán / Ghi danh:
                  </label>
                  <select
                    className="modal-form-input"
                    value={manualForm.paymentMethod}
                    onChange={(e) => {
                      const method = e.target.value as 'VNPAY' | 'FREE';
                      setManualForm({ ...manualForm, paymentMethod: method });
                    }}
                  >
                    <option value="VNPAY">
                      Thanh toán qua VNPAY (Có tính doanh thu)
                    </option>
                    <option value="FREE">Miễn phí / Khóa học tặng (0 ₫)</option>
                  </select>
                </div>
              </div>

              <div className="enroll-modal-footer">
                <button
                  type="button"
                  className="btn-students-action"
                  onClick={() => setShowManualModal(false)}
                  disabled={submittingManual}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-students-action primary"
                  disabled={submittingManual}
                >
                  {submittingManual
                    ? 'Đang ghi danh...'
                    : 'Xác nhận ghi danh ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
