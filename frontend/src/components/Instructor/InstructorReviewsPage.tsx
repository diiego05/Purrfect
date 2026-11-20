import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reviewApi } from '../../services/reviewApi';
import type {
  CourseReviewItem,
  InstructorReviewsSummary,
} from '../../types/review';
import {
  IconlyStar,
  IconlyChat,
  IconlyEdit,
  IconlyDelete,
  IconlySearch,
  IconlyTick,
  IconlyAward,
  IconlyPlay,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import './InstructorReviewsPage.css';

export const InstructorReviewsPage: React.FC = () => {
  const { user, isAuthenticated, navigate } = useAuth();

  // Dữ liệu đánh giá
  const [reviews, setReviews] = useState<CourseReviewItem[]>([]);
  const [courses, setCourses] = useState<
    Array<{ _id: string; title: string; slug: string; thumbnailUrl?: string }>
  >([]);
  const [summary, setSummary] = useState<InstructorReviewsSummary>({
    totalReviews: 0,
    unrepliedCount: 0,
    repliedCount: 0,
    responseRate: 100,
  });

  // Bộ lọc & tìm kiếm
  const [statusFilter, setStatusFilter] = useState<'all' | 'unreplied' | 'replied'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Thông báo toast & lỗi
  const [toastMsg, setToastMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Trạng thái nhập phản hồi mới
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [replyInputError, setReplyInputError] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // Trạng thái chỉnh sửa phản hồi (Alternative Flow 4a1)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editInputError, setEditInputError] = useState<string>('');
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);

  // Tải danh sách đánh giá từ API
  const loadReviews = useCallback(() => {
    if (!isAuthenticated) return;
    reviewApi
      .getInstructorReviews({
        status: statusFilter,
        courseId: selectedCourseId || undefined,
      })
      .then((res) => {
        if (res.success && res.data) {
          setReviews(res.data.reviews || []);
          if (res.data.courses) setCourses(res.data.courses);
          if (res.data.summary) setSummary(res.data.summary);
        } else {
          setErrorMsg(res.message || 'Không thể tải danh sách đánh giá.');
        }
      })
      .catch((err) => {
        console.error('[InstructorReviewsPage] Error loading reviews:', err);
        setErrorMsg('Đã xảy ra lỗi khi kết nối máy chủ.');
      });
  }, [isAuthenticated, statusFilter, selectedCourseId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    reviewApi
      .getInstructorReviews({
        status: statusFilter,
        courseId: selectedCourseId || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setReviews(res.data.reviews || []);
          if (res.data.courses) setCourses(res.data.courses);
          if (res.data.summary) setSummary(res.data.summary);
        } else {
          setErrorMsg(res.message || 'Không thể tải danh sách đánh giá.');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[InstructorReviewsPage] Error loading reviews:', err);
        setErrorMsg('Đã xảy ra lỗi khi kết nối máy chủ.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, statusFilter, selectedCourseId]);

  // Xử lý gửi phản hồi mới (Basic Flow 4 & Exception Flow 4b)
  const handleSendReply = async (reviewId: string) => {
    setReplyInputError('');
    const trimmed = replyContent.trim();

    // Exception Flow 4b: Nhập rỗng -> Báo lỗi "Nội dung phản hồi không được để trống"
    if (!trimmed) {
      setReplyInputError('Nội dung phản hồi không được để trống');
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await reviewApi.replyToReview(reviewId, trimmed);
      if (res.success) {
        setToastMsg('Phản hồi đánh giá thành công!');
        setReplyingReviewId(null);
        setReplyContent('');
        loadReviews();
      } else {
        setReplyInputError(res.message || 'Không thể gửi phản hồi.');
      }
    } catch (err) {
      console.error('[InstructorReviewsPage] Error replying:', err);
      setReplyInputError('Lỗi kết nối khi gửi phản hồi.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Mở trình soạn phản hồi
  const handleOpenReplyBox = (review: CourseReviewItem) => {
    setReplyingReviewId(review._id);
    setReplyContent('');
    setReplyInputError('');
    setEditingReviewId(null);
  };

  // Mở trình sửa phản hồi (Alternative Flow 4a1)
  const handleOpenEditBox = (review: CourseReviewItem) => {
    setEditingReviewId(review._id);
    setEditContent(review.instructorReply || '');
    setEditInputError('');
    setReplyingReviewId(null);
  };

  // Lưu chỉnh sửa phản hồi (Alternative Flow 4a1)
  const handleSaveEdit = async (reviewId: string) => {
    setEditInputError('');
    const trimmed = editContent.trim();

    if (!trimmed) {
      setEditInputError('Nội dung phản hồi không được để trống');
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await reviewApi.updateReviewReply(reviewId, trimmed);
      if (res.success) {
        setToastMsg('Cập nhật phản hồi thành công!');
        setEditingReviewId(null);
        setEditContent('');
        loadReviews();
      } else {
        setEditInputError(res.message || 'Không thể cập nhật phản hồi.');
      }
    } catch (err) {
      console.error('[InstructorReviewsPage] Error updating reply:', err);
      setEditInputError('Lỗi kết nối khi cập nhật phản hồi.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Xóa phản hồi (Alternative Flow 4a2)
  const handleDeleteReply = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này không?')) {
      return;
    }

    try {
      const res = await reviewApi.deleteReviewReply(reviewId);
      if (res.success) {
        setToastMsg('Đã xóa phản hồi đánh giá.');
        loadReviews();
      } else {
        setErrorMsg(res.message || 'Không thể xóa phản hồi.');
      }
    } catch (err) {
      console.error('[InstructorReviewsPage] Error deleting reply:', err);
      setErrorMsg('Lỗi kết nối khi xóa phản hồi.');
    }
  };

  // Lọc đánh giá theo ô tìm kiếm
  const filteredReviews = reviews.filter((rev) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    const studentName = rev.userId?.fullName?.toLowerCase() || '';
    const studentEmail = rev.userId?.email?.toLowerCase() || '';
    const comment = rev.comment?.toLowerCase() || '';
    const reply = rev.instructorReply?.toLowerCase() || '';
    return (
      studentName.includes(kw) ||
      studentEmail.includes(kw) ||
      comment.includes(kw) ||
      reply.includes(kw)
    );
  });

  const getCourseTitle = (courseId: CourseReviewItem['courseId']): string => {
    if (typeof courseId === 'object' && courseId !== null) {
      return courseId.title;
    }
    const found = courses.find((c) => c._id === courseId);
    return found ? found.title : 'Khóa học';
  };

  const getCourseSlug = (courseId: CourseReviewItem['courseId']): string => {
    if (typeof courseId === 'object' && courseId !== null) {
      return courseId.slug || courseId._id;
    }
    const found = courses.find((c) => c._id === courseId);
    return found ? found.slug || found._id : '';
  };

  const formatDate = (dateVal: string | Date | undefined | null) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="instructor-reviews-page">
      {/* Tiêu đề trang */}
      <div className="reviews-page-header">
        <div className="reviews-header-titles">
          <h1>Đánh giá & Phản hồi từ học viên</h1>
          <p className="reviews-header-subtitle">
            Trực tiếp giải đáp thắc mắc và cảm ơn học viên để nâng cao uy tín và trải nghiệm khóa học
          </p>
        </div>
      </div>

      {/* Thông báo thành công */}
      {toastMsg && (
        <div className="reviews-toast-notice">
          <span>{toastMsg}</span>
          <button
            type="button"
            className="btn-reply-action"
            onClick={() => setToastMsg('')}
            aria-label="Đóng"
          >
            <IconlyClose size={14} color="currentColor" />
          </button>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMsg && (
        <div className="reviews-toast-error">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="reviews-kpi-grid">
        <div className="reviews-kpi-card">
          <div className="kpi-icon-box total">
            <IconlyChat size={24} color="currentColor" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tổng nhận xét</span>
            <span className="kpi-value">{summary.totalReviews}</span>
          </div>
        </div>

        <div className="reviews-kpi-card">
          <div className="kpi-icon-box unreplied">
            <IconlyStar size={24} color="currentColor" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">
              Chưa phản hồi
              {summary.unrepliedCount > 0 && (
                <span className="kpi-badge alert">{summary.unrepliedCount} cần xử lý</span>
              )}
            </span>
            <span className="kpi-value">{summary.unrepliedCount}</span>
          </div>
        </div>

        <div className="reviews-kpi-card">
          <div className="kpi-icon-box replied">
            <IconlyTick size={24} color="currentColor" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Đã phản hồi</span>
            <span className="kpi-value">{summary.repliedCount}</span>
          </div>
        </div>

        <div className="reviews-kpi-card">
          <div className="kpi-icon-box rate">
            <IconlyAward size={24} color="currentColor" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Tỷ lệ phản hồi</span>
            <span className="kpi-value">{summary.responseRate}%</span>
          </div>
        </div>
      </div>

      {/* Toolbar bộ lọc */}
      <div className="reviews-filter-toolbar">
        <div className="filter-tabs-group">
          <button
            type="button"
            className={`filter-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>Tất cả</span>
            <span className="tab-count-pill">{summary.totalReviews}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${statusFilter === 'unreplied' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unreplied')}
          >
            <span>Chưa phản hồi</span>
            {summary.unrepliedCount > 0 && (
              <span className="tab-count-pill alert">{summary.unrepliedCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${statusFilter === 'replied' ? 'active' : ''}`}
            onClick={() => setStatusFilter('replied')}
          >
            <span>Đã phản hồi</span>
            <span className="tab-count-pill">{summary.repliedCount}</span>
          </button>
        </div>

        <div className="filter-actions-group">
          {/* Lọc theo khóa học */}
          <select
            className="course-select-filter"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">Tất cả các khóa học</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Ô tìm kiếm */}
          <div className="reviews-search-box">
            <span className="search-icon-inside">
              <IconlySearch size={16} color="currentColor" />
            </span>
            <input
              type="text"
              className="search-input-field"
              placeholder="Tìm theo học viên, nội dung..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Danh sách đánh giá */}
      {loading ? (
        <div className="reviews-empty-state">
          <p className="empty-state-title">Đang tải danh sách đánh giá...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="reviews-empty-state">
          <div className="empty-state-icon">★</div>
          <p className="empty-state-title">Chưa có đánh giá nào phù hợp</p>
          <p className="empty-state-desc">
            Khi học viên hoàn thành khóa học và gửi nhận xét, các đánh giá sẽ hiển thị tại đây để bạn phản hồi.
          </p>
        </div>
      ) : (
        <div className="reviews-list-container">
          {filteredReviews.map((review) => {
            const hasReply = Boolean(review.instructorReply);
            const courseTitle = getCourseTitle(review.courseId);
            const courseSlug = getCourseSlug(review.courseId);
            const studentAvatar =
              review.userId?.avatarUrl ||
              review.userId?.avatar ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                review.userId?.email || review.userId?.fullName || 'student',
              )}`;
            const studentName =
              review.userId?.fullName || review.userId?.name || review.userId?.email || 'Học viên';

            return (
              <div
                key={review._id}
                className={`review-item-card ${hasReply ? 'has-reply' : 'no-reply'}`}
              >
                {/* Header: Tên khóa học & Ngày đánh giá */}
                <div className="review-card-top">
                  <div
                    className="review-course-badge"
                    onClick={() => courseSlug && navigate(`/courses/${courseSlug}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <IconlyPlay size={14} color="currentColor" />
                    <span>{courseTitle}</span>
                  </div>
                  <span className="review-date-text">{formatDate(review.createdAt)}</span>
                </div>

                {/* Thông tin học viên */}
                <div className="student-info-row">
                  <img
                    src={studentAvatar}
                    alt={studentName}
                    className="student-avatar-img"
                  />
                  <div className="student-name-box">
                    <span className="student-name-title">{studentName}</span>
                    <span className="student-email-sub">{review.userId?.email || ''}</span>
                  </div>
                </div>

                {/* Điểm số sao */}
                <div className="review-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <IconlyStar
                      key={star}
                      size={18}
                      color={star <= review.rating ? '#f59e0b' : '#cbd5e1'}
                    />
                  ))}
                  <span className="stars-score-label">{review.rating}.0 / 5 sao</span>
                </div>

                {/* Nhận xét của học viên */}
                <p className="review-comment-body">{review.comment}</p>

                {/* Khu vực phản hồi chính thức (Nếu đã có phản hồi) */}
                {hasReply && (
                  <div
                    className={`official-reply-box ${
                      review.replyRole === 'ADMIN' ? 'admin-role' : 'instructor-role'
                    }`}
                  >
                    <div className="reply-header-row">
                      <div className="replier-meta-left">
                        <img
                          src={
                            review.repliedBy?.avatarUrl ||
                            review.repliedBy?.avatar ||
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                              review.repliedBy?.email || 'instructor',
                            )}`
                          }
                          alt="Replier Avatar"
                          className="replier-avatar-img"
                        />
                        <span className="replier-name-text">
                          {review.repliedBy?.fullName ||
                            review.repliedBy?.email ||
                            (review.replyRole === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên')}
                        </span>
                        {/* ROLE BADGE THEO YÊU CẦU: Rõ vai trò Giảng viên hoặc Quản trị viên */}
                        <span
                          className={`review-role-badge ${
                            review.replyRole === 'ADMIN' ? 'admin' : 'instructor'
                          }`}
                        >
                          {review.replyRole === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}
                        </span>
                      </div>

                      <div className="reply-actions-right">
                        <span className="reply-time-text">
                          {formatDate(review.repliedAt || review.updatedAt)}
                        </span>
                        {/* Alternative Flow 4a1 & 4a2: Sửa và Xóa phản hồi */}
                        <button
                          type="button"
                          className="btn-reply-action"
                          onClick={() => handleOpenEditBox(review)}
                          title="Chỉnh sửa câu trả lời"
                        >
                          <IconlyEdit size={14} color="currentColor" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          className="btn-reply-action danger"
                          onClick={() => handleDeleteReply(review._id)}
                          title="Xóa câu trả lời"
                        >
                          <IconlyDelete size={14} color="currentColor" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>

                    {/* Hiển thị nội dung hoặc ô chỉnh sửa */}
                    {editingReviewId === review._id ? (
                      <div className="reply-composer-section">
                        <textarea
                          className="reply-textarea-field"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="Chỉnh sửa nội dung phản hồi..."
                        />
                        {editInputError && (
                          <div className="reply-error-msg">{editInputError}</div>
                        )}
                        <div className="reply-composer-footer">
                          <button
                            type="button"
                            className="btn-cancel-reply"
                            onClick={() => {
                              setEditingReviewId(null);
                              setEditInputError('');
                            }}
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="btn-send-reply"
                            disabled={submittingEdit}
                            onClick={() => handleSaveEdit(review._id)}
                          >
                            {submittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="reply-content-text">{review.instructorReply}</p>
                    )}
                  </div>
                )}

                {/* Nếu chưa phản hồi -> Nút hoặc ô nhập phản hồi (Basic Flow 2, 3, 4) */}
                {!hasReply && (
                  <div>
                    {replyingReviewId === review._id ? (
                      <div className="reply-composer-section">
                        <div className="reply-composer-title">
                          <span>
                            Phản hồi nhận xét của <strong>{studentName}</strong>:
                          </span>
                          <span className={`review-role-badge ${user?.role === 'ADMIN' ? 'admin' : 'instructor'}`}>
                            {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}
                          </span>
                        </div>

                        {/* Mẫu gợi ý nhanh */}
                        <div className="reply-quick-templates">
                          <button
                            type="button"
                            className="quick-template-chip"
                            onClick={() =>
                              setReplyContent(
                                'Cảm ơn bạn đã tham gia khóa học và để lại nhận xét tích cực! Chúc bạn học tập tốt và gặt hái nhiều thành công.',
                              )
                            }
                          >
                            💡 Lời cảm ơn chuẩn
                          </button>
                          <button
                            type="button"
                            className="quick-template-chip"
                            onClick={() =>
                              setReplyContent(
                                'Chào bạn, cảm ơn bạn đã góp ý. Mình sẽ cập nhật thêm tài liệu và ví dụ thực tế trong các bài học tiếp theo nhé!',
                              )
                            }
                          >
                            💡 Tiếp thu góp ý
                          </button>
                        </div>

                        <textarea
                          className="reply-textarea-field"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Nhập nội dung phản hồi, lời cảm ơn hoặc giải đáp thắc mắc..."
                          autoFocus
                        />
                        {/* Exception Flow 4b: Hiển thị lỗi rỗng */}
                        {replyInputError && (
                          <div className="reply-error-msg">{replyInputError}</div>
                        )}

                        <div className="reply-composer-footer">
                          <button
                            type="button"
                            className="btn-cancel-reply"
                            onClick={() => {
                              setReplyingReviewId(null);
                              setReplyInputError('');
                            }}
                          >
                            Hủy bỏ
                          </button>
                          <button
                            type="button"
                            className="btn-send-reply"
                            disabled={submittingReply}
                            onClick={() => handleSendReply(review._id)}
                          >
                            <IconlyTick size={16} color="currentColor" />
                            <span>{submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          className="btn-open-reply"
                          onClick={() => handleOpenReplyBox(review)}
                        >
                          <IconlyChat size={16} color="currentColor" />
                          <span>Phản hồi nhận xét này</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorReviewsPage;
