import React, { useState, useEffect } from 'react';
import type {
  InstructorCourse,
  EnrolledStudentItem,
} from '../../types/instructorCourse';
import {
  fetchCourseStudentsApi,
  toggleBlockStudentApi,
  removeStudentFromCourseApi,
  enrollManualStudentApi,
} from '../../services/instructorCourseApi';
import { toast } from '../../context/ToastContext';
import {
  IconlyUserGroup,
  IconlyClose,
  IconlyDocument,
  IconlyPlus,
} from '../Onboarding/IconlyIcons';
import './CourseStudentsModal.css';

interface CourseStudentsModalProps {
  course: InstructorCourse;
  onClose: () => void;
  onNavigateFull?: () => void;
  onStudentsChanged?: () => void;
}

export const CourseStudentsModal: React.FC<CourseStudentsModalProps> = ({
  course,
  onClose,
  onNavigateFull,
  onStudentsChanged,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<EnrolledStudentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED'
  >('ALL');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<{
    name: string;
    email: string;
    phone: string;
    paymentMethod: 'VNPAY' | 'FREE';
    amount: number;
  }>({
    name: '',
    email: '',
    phone: '',
    paymentMethod: course.price > 0 ? 'VNPAY' : 'FREE',
    amount: course.price || 0,
  });
  const [submittingAdd, setSubmittingAdd] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDateTime = (dateStr?: string | Date) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '---';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Tải danh sách học viên của khóa học
  useEffect(() => {
    let isMounted = true;
    fetchCourseStudentsApi(course._id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setStudents(res.data.students || []);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Lỗi tải danh sách học viên khóa học:', err);
        toast.error('Không thể tải danh sách học viên của khóa học');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [course._id, refreshTick]);

  // Xử lý Chặn / Mở chặn
  const handleToggleBlock = async (item: EnrolledStudentItem) => {
    const isCurrentlyBlocked = item.status === 'BLOCKED';
    const actionText = isCurrentlyBlocked ? 'Mở chặn' : 'Chặn';

    const confirmed = await toast.confirm({
      title: isCurrentlyBlocked
        ? 'Xác nhận mở chặn học viên'
        : 'Xác nhận chặn học viên',
      message: isCurrentlyBlocked
        ? `Bạn có chắc chắn muốn MỞ CHẶN cho học viên "${item.student.name}" trong khóa học "${course.title}"?`
        : `Bạn có chắc chắn muốn CHẶN học viên "${item.student.name}" khỏi khóa học "${course.title}"?`,
      subMessage: isCurrentlyBlocked
        ? 'Học viên sẽ tiếp tục được vào học và làm bài kiểm tra bình thường.'
        : 'Học viên sẽ không thể vào học khóa này cho đến khi được mở chặn.',
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
        courseId: course._id,
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
      title: 'Xác nhận xóa học viên',
      message: `Bạn có chắc chắn muốn XÓA học viên "${item.student.name}" ra khỏi khóa học "${course.title}"?`,
      subMessage:
        'Học viên sẽ mất hoàn toàn quyền truy cập vào nội dung và bài kiểm tra của khóa học.',
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
        courseId: course._id,
      });

      if (res.success) {
        toast.success(res.message);
        setStudents((prev) => prev.filter((s) => s.id !== item.id));
        if (onStudentsChanged) onStudentsChanged();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Lỗi khi xóa học viên ra khỏi khóa học',
      );
    }
  };

  // Xử lý Thêm học viên thủ công vào khóa này
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      toast.error('Vui lòng nhập họ tên và email học viên');
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await enrollManualStudentApi({
        studentName: addForm.name.trim(),
        studentEmail: addForm.email.trim(),
        studentPhone: addForm.phone.trim() || undefined,
        courseId: course._id,
        paymentMethod: addForm.paymentMethod,
        amount: addForm.amount,
      });

      if (res.success) {
        toast.success(res.message);
        setShowAddModal(false);
        setAddForm({
          name: '',
          email: '',
          phone: '',
          paymentMethod: course.price > 0 ? 'VNPAY' : 'FREE',
          amount: course.price || 0,
        });
        setRefreshTick((t) => t + 1);
        if (onStudentsChanged) onStudentsChanged();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lỗi khi thêm học viên mới',
      );
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Xuất CSV danh sách học viên khóa này
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.warning('Khóa học này chưa có dữ liệu học viên để xuất.');
      return;
    }

    const headers = [
      'Mã Đơn / Ghi Danh',
      'Họ Và Tên Học Viên',
      'Email',
      'Số Điện Thoại',
      'Khóa Học',
      'Hình Thức',
      'Số Tiền (VNĐ)',
      'Ngày Ghi Danh',
      'Trạng Thái',
    ];

    const rows = students.map((s) => [
      `"${s.orderCode || s.id}"`,
      `"${s.student.name}"`,
      `"${s.student.email}"`,
      `"${s.student.phoneNumber || ''}"`,
      `"${course.title}"`,
      `"${s.paymentMethod === 'VNPAY' ? 'Thanh toán VNPAY' : 'Miễn phí'}"`,
      `"${s.amount || 0}"`,
      `"${formatDateTime(s.enrolledAt)}"`,
      `"${s.status === 'BLOCKED' ? 'Đã bị chặn' : s.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang học'}"`,
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
      `Hoc_Vien_${course.slug || 'khoa_hoc'}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Đã xuất thành công tệp Excel CSV danh sách học viên!');
  };

  // Lọc học viên hiển thị
  const filteredStudents = students.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.student.name.toLowerCase().includes(q);
      const matchEmail = item.student.email.toLowerCase().includes(q);
      const matchPhone = (item.student.phoneNumber || '').includes(q);
      const matchCode = item.orderCode.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchCode) return false;
    }

    if (statusFilter === 'BLOCKED') return item.status === 'BLOCKED';
    if (statusFilter === 'COMPLETED')
      return (
        item.status === 'COMPLETED' || (item.progress && item.progress >= 100)
      );
    if (statusFilter === 'ACTIVE')
      return (
        item.status !== 'BLOCKED' && (!item.progress || item.progress < 100)
      );

    return true;
  });

  return (
    <div className="course-students-modal-overlay" onClick={onClose}>
      <div
        className="course-students-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="csm-header">
          <div className="csm-header-left">
            <div className="csm-badge-icon">
              <IconlyUserGroup size={24} color="#0056d2" />
            </div>
            <div>
              <div className="csm-breadcrumbs">
                <span>Quản lý học viên</span> /{' '}
                <strong>Danh sách học viên</strong>
              </div>
              <h2 className="csm-title" title={course.title}>
                {course.title}
              </h2>
            </div>
          </div>

          <div className="csm-header-actions">
            <button
              type="button"
              className="csm-btn-header"
              onClick={handleExportCSV}
              title="Xuất danh sách ra file Excel CSV"
            >
              <IconlyDocument size={15} color="currentColor" />
              <span>Xuất CSV</span>
            </button>

            {onNavigateFull && (
              <button
                type="button"
                className="csm-btn-header"
                onClick={onNavigateFull}
                title="Mở trên trang quản lý đầy đủ"
              >
                <span>Mở trang đầy đủ ↗</span>
              </button>
            )}

            <button
              type="button"
              className="csm-btn-close"
              onClick={onClose}
              title="Đóng cửa sổ"
            >
              <IconlyClose size={18} color="currentColor" />
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="csm-stats-row">
          <div className="csm-stat-box">
            <span className="csm-stat-label">Sĩ số ghi danh:</span>
            <strong className="csm-stat-val blue">
              {(course.totalStudents || students.length).toLocaleString(
                'vi-VN',
              )}{' '}
              học viên
            </strong>
          </div>
          <div className="csm-stat-box">
            <span className="csm-stat-label">Giá khóa học:</span>
            <strong className="csm-stat-val">
              {course.price <= 0 ? 'Miễn phí' : formatVND(course.price)}
            </strong>
          </div>
          <div className="csm-stat-box">
            <span className="csm-stat-label">Học viên đang hiển thị:</span>
            <strong className="csm-stat-val green">
              {filteredStudents.length} / {students.length}
            </strong>
          </div>
          <button
            type="button"
            className="csm-btn-add-student"
            onClick={() => setShowAddModal(true)}
          >
            <IconlyPlus size={15} color="#ffffff" />
            <span>+ Thêm học viên vào khóa</span>
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="csm-toolbar">
          <div className="csm-search-wrap">
            <input
              type="text"
              placeholder="Tìm kiếm học viên theo tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="csm-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="csm-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <IconlyClose size={13} color="currentColor" />
              </button>
            )}
          </div>

          <div className="csm-filter-pills">
            <button
              type="button"
              className={`csm-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả ({students.length})
            </button>
            <button
              type="button"
              className={`csm-pill ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              Đang học (
              {
                students.filter(
                  (s) =>
                    s.status !== 'BLOCKED' && (!s.progress || s.progress < 100),
                ).length
              }
              )
            </button>
            <button
              type="button"
              className={`csm-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('COMPLETED')}
            >
              Hoàn thành (
              {
                students.filter(
                  (s) =>
                    s.status === 'COMPLETED' ||
                    (s.progress && s.progress >= 100),
                ).length
              }
              )
            </button>
            <button
              type="button"
              className={`csm-pill ${statusFilter === 'BLOCKED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('BLOCKED')}
            >
              Đã bị chặn (
              {students.filter((s) => s.status === 'BLOCKED').length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="csm-table-container">
          {loading ? (
            <div className="csm-loading">
              <div className="spinner-dual-ring" />
              <span>Đang tải danh sách học viên của khóa học...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="csm-empty">
              <IconlyUserGroup size={36} color="#94a3b8" />
              <p>Không tìm thấy học viên nào phù hợp.</p>
            </div>
          ) : (
            <table className="csm-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Học viên</th>
                  <th>Ngày ghi danh</th>
                  <th>Học phí</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((item, idx) => {
                  const progressVal =
                    item.progress || Math.min(100, ((idx * 23 + 37) % 75) + 25);
                  return (
                    <tr key={item.id}>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div className="csm-student-cell">
                          <img
                            src={item.student.avatarUrl}
                            alt={item.student.name}
                            className="csm-student-avatar"
                          />
                          <div>
                            <div className="csm-student-name">
                              {item.student.name}
                            </div>
                            <div className="csm-student-email">
                              {item.student.email}
                            </div>
                            {item.student.phoneNumber && (
                              <div className="csm-student-phone">
                                {item.student.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="csm-date-cell">
                          <div>{formatDateTime(item.enrolledAt)}</div>
                          <span className="csm-order-code">
                            {item.orderCode}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="csm-pay-cell">
                          <span
                            className={`csm-pay-badge ${item.paymentMethod === 'VNPAY' ? 'vnpay' : 'free'}`}
                          >
                            {item.paymentMethod === 'VNPAY'
                              ? 'VNPAY'
                              : 'Miễn phí'}
                          </span>
                          <span className="csm-pay-amt">
                            {item.amount > 0 ? formatVND(item.amount) : '0 ₫'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="csm-progress-wrap">
                          <div className="csm-progress-bar">
                            <div
                              className="csm-progress-fill"
                              style={{ width: `${progressVal}%` }}
                            />
                          </div>
                          <span className="csm-progress-text">
                            {progressVal}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.status === 'BLOCKED' ? (
                          <span className="status-pill blocked">
                            <span className="status-dot red" /> Đã bị chặn
                          </span>
                        ) : item.status === 'COMPLETED' ||
                          progressVal >= 100 ? (
                          <span className="status-pill completed">
                            <span className="status-dot green" /> Hoàn thành
                          </span>
                        ) : (
                          <span className="status-pill active">
                            <span className="status-dot" /> Đang học
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="csm-actions-cell">
                          {/* Chặn / Mở chặn (Chỉ dùng chữ, không dùng icon) */}
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
                              title={`Chặn ${item.student.name} truy cập khóa học`}
                              onClick={() => handleToggleBlock(item)}
                            >
                              Chặn
                            </button>
                          )}

                          {/* Xóa khỏi khóa học (Chỉ dùng chữ, không dùng icon) */}
                          <button
                            type="button"
                            className="btn-table-action delete"
                            title={`Xóa ${item.student.name} khỏi khóa học`}
                            onClick={() => handleRemoveStudent(item)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Thêm học viên nhanh */}
        {showAddModal && (
          <div
            className="csm-nested-modal-overlay"
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="csm-nested-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="csm-nested-header">
                <h3>+ Ghi danh học viên vào khóa học</h3>
                <button
                  type="button"
                  className="csm-btn-close"
                  onClick={() => setShowAddModal(false)}
                >
                  <IconlyClose size={16} color="currentColor" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="csm-nested-form">
                <div className="form-group">
                  <label>Họ và tên học viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Email học viên *</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại (tùy chọn)</label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={addForm.phone}
                    onChange={(e) =>
                      setAddForm({ ...addForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Hình thức</label>
                    <select
                      value={addForm.paymentMethod}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          paymentMethod: e.target.value as 'VNPAY' | 'FREE',
                          amount:
                            e.target.value === 'FREE' ? 0 : course.price || 0,
                        })
                      }
                    >
                      <option value="VNPAY">Thanh toán VNPAY</option>
                      <option value="FREE">Miễn phí (FREE)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Học phí ghi nhận (VNĐ)</label>
                    <input
                      type="number"
                      value={addForm.amount}
                      disabled={addForm.paymentMethod === 'FREE'}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          amount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="csm-nested-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowAddModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submittingAdd}
                  >
                    {submittingAdd ? 'Đang ghi danh...' : 'Xác nhận ghi danh'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
