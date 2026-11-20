import { useState, useEffect, type FC } from 'react';
import type { DiscussionQuestion } from '../../types/discussion';
import { discussionApi } from '../../services/discussionApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';
import { formatTimeAgo } from '../../utils/format';
import {
  IconlyChat,
  IconlySend,
  IconlyDelete,
  IconlyRefresh,
  IconlyLock,
  IconlyStar,
  IconlyBulb,
  IconlySearch,
} from '../Onboarding/IconlyIcons';
import './LectureDiscussionPanel.css';

interface LectureDiscussionPanelProps {
  lectureId: string;
  courseId: string;
  lectureTitle: string;
  courseTitle: string;
  isEnrolled: boolean;
  isCourseInstructor: boolean;
  isAdmin: boolean;
  onEnrollClick?: () => void;
  onDiscussionCountChange?: (count: number) => void;
}

export const LectureDiscussionPanel: FC<LectureDiscussionPanelProps> = ({
  lectureId,
  courseId,
  lectureTitle,
  isEnrolled,
  isCourseInstructor,
  isAdmin,
  onEnrollClick,
  onDiscussionCountChange,
}) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<DiscussionQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

  // Form states
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<
    'all' | 'has_instructor_reply' | 'unanswered'
  >('all');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshDiscussions = async () => {
    if (!lectureId) return;
    try {
      setLoading(true);
      const res = await discussionApi.getLectureDiscussions(
        lectureId,
        courseId,
      );
      if (res.success) {
        setQuestions(res.data || []);
        setAccessDenied(false);
        if (onDiscussionCountChange) {
          onDiscussionCountChange(
            res.meta?.totalQuestions || res.data?.length || 0,
          );
        }
      }
    } catch {
      // Bỏ qua lỗi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const fetchDiscussions = async () => {
      try {
        const res = await discussionApi.getLectureDiscussions(
          lectureId,
          courseId,
        );
        if (!ignore) {
          if (res.success) {
            setQuestions(res.data || []);
            setAccessDenied(false);
            if (onDiscussionCountChange) {
              onDiscussionCountChange(
                res.meta?.totalQuestions || res.data?.length || 0,
              );
            }
          } else {
            if (
              res.isEnrolled === false ||
              (!isEnrolled && !isCourseInstructor && !isAdmin)
            ) {
              setAccessDenied(true);
            }
          }
          setLoading(false);
        }
      } catch {
        if (!ignore) setLoading(false);
      }
    };

    fetchDiscussions();

    return () => {
      ignore = true;
    };
  }, [
    lectureId,
    courseId,
    isEnrolled,
    isCourseInstructor,
    isAdmin,
    onDiscussionCountChange,
  ]);

  // 1. Đăng câu hỏi mới (POST /api/v1/lectures/:id/discussions)
  const handlePostQuestion = async () => {
    const trimmed = newQuestionText.trim();
    if (!trimmed || submittingQuestion) return;

    try {
      setSubmittingQuestion(true);
      const res = await discussionApi.createQuestion(
        lectureId,
        trimmed,
        courseId,
      );
      if (res.success && res.data) {
        setNewQuestionText('');
        showToast('Đã đăng câu hỏi thảo luận thành công!');
        await refreshDiscussions();
      } else {
        showToast(res.message || 'Không thể đăng câu hỏi. Vui lòng thử lại.');
      }
    } catch {
      showToast('Đã xảy ra lỗi khi gửi câu hỏi.');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // 2. Trả lời thảo luận (POST /api/v1/discussions/:id/replies)
  const handlePostReply = async (parentQuestionId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed || submittingReply) return;

    try {
      setSubmittingReply(true);
      const res = await discussionApi.createReply(parentQuestionId, trimmed);
      if (res.success && res.data) {
        setReplyText('');
        setActiveReplyId(null);
        showToast('Đã đăng phản hồi thành công!');
        await refreshDiscussions();
      } else {
        showToast(res.message || 'Không thể gửi phản hồi.');
      }
    } catch {
      showToast('Đã xảy ra lỗi khi gửi phản hồi.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // 3. Giảng viên ghim / bỏ ghim câu trả lời (PATCH /api/v1/discussions/:replyId/pin)
  const handleTogglePin = async (
    replyId: string,
    currentPinStatus: boolean,
  ) => {
    try {
      const res = await discussionApi.togglePin(replyId, !currentPinStatus);
      if (res.success) {
        showToast(
          !currentPinStatus
            ? 'Đã ghim câu trả lời chính thức của Giảng viên ⭐'
            : 'Đã bỏ ghim câu trả lời.',
        );
        await refreshDiscussions();
      } else {
        showToast(res.message || 'Không thể cập nhật trạng thái ghim.');
      }
    } catch {
      showToast('Lỗi cập nhật trạng thái ghim.');
    }
  };

  // 4. Thích thảo luận (PATCH /api/v1/discussions/:id/upvote)
  const handleToggleUpvote = async (discussionId: string) => {
    try {
      const res = await discussionApi.toggleUpvote(discussionId);
      if (res.success && res.data) {
        // Cập nhật optimistic local state
        setQuestions((prevQuestions) =>
          prevQuestions.map((q) => {
            if (q._id === discussionId) {
              return {
                ...q,
                upvoteCount: res.data!.upvoteCount,
                isUpvoted: res.data!.isUpvoted,
              };
            }
            return {
              ...q,
              replies: q.replies.map((r) =>
                r._id === discussionId
                  ? {
                      ...r,
                      upvoteCount: res.data!.upvoteCount,
                      isUpvoted: res.data!.isUpvoted,
                    }
                  : r,
              ),
            };
          }),
        );
      }
    } catch {
      showToast('Không thể cập nhật lượt thích.');
    }
  };

  // 5. Xóa thảo luận (DELETE /api/v1/discussions/:id)
  const handleDeleteDiscussion = async (
    discussionId: string,
    isReply = false,
  ) => {
    const confirmed = await toast.confirm({
      title: isReply
        ? 'Xác nhận xóa phản hồi'
        : 'Xác nhận xóa câu hỏi thảo luận',
      message: isReply
        ? 'Bạn có chắc chắn muốn xóa phản hồi này?'
        : 'Bạn có chắc chắn muốn xóa câu hỏi này cùng toàn bộ phản hồi liên quan?',
      confirmText: 'Xóa',
      cancelText: 'Hủy bỏ',
      confirmVariant: 'danger',
      type: 'error',
    });

    if (!confirmed) return;

    try {
      const res = await discussionApi.deleteDiscussion(discussionId);
      if (res.success) {
        showToast('Đã xóa thảo luận thành công.');
        await refreshDiscussions();
      } else {
        showToast(res.message || 'Không thể xóa thảo luận.');
      }
    } catch {
      showToast('Lỗi khi xóa thảo luận.');
    }
  };

  // Lọc câu hỏi theo tìm kiếm và filter chips
  const filteredQuestions = questions.filter((q) => {
    // Tìm kiếm nội dung hoặc tên người hỏi
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const matchQuestion =
        q.content.toLowerCase().includes(qLower) ||
        (q.userId.fullName && q.userId.fullName.toLowerCase().includes(qLower));
      const matchReplies = q.replies.some(
        (r) =>
          r.content.toLowerCase().includes(qLower) ||
          (r.userId.fullName &&
            r.userId.fullName.toLowerCase().includes(qLower)),
      );
      if (!matchQuestion && !matchReplies) return false;
    }

    if (filterType === 'has_instructor_reply') {
      return q.replies.some((r) => r.isInstructor || r.isPinned);
    }
    if (filterType === 'unanswered') {
      return q.repliesCount === 0;
    }
    return true;
  });

  // Chế độ xem trước (Preview) cho học viên chưa ghi danh
  if (accessDenied || (!isEnrolled && !isCourseInstructor && !isAdmin)) {
    return (
      <div className="discussion-locked-banner">
        <div className="discussion-locked-icon">
          <IconlyLock size={28} />
        </div>
        <h3 className="discussion-locked-title">
          Khu vực Thảo luận dành riêng cho Học viên chính thức
        </h3>
        <p className="discussion-locked-desc">
          Bạn đang xem bài giảng ở chế độ Xem trước (Preview). Chỉ học viên đã
          ghi danh khóa học mới có quyền xem các câu hỏi và nhận giải đáp trực
          tiếp từ Giảng viên.
        </p>
        {onEnrollClick && (
          <button
            type="button"
            className="btn-enroll-to-discuss"
            onClick={onEnrollClick}
          >
            Đăng ký học ngay để tham gia thảo luận
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="lecture-discussion-panel">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* 1. Header panel */}
      <div className="discussion-header">
        <div className="discussion-header-title">
          <IconlyChat size={20} color="#4f46e5" />
          <span className="discussion-title-text">
            Hỏi đáp & Thảo luận: {lectureTitle}
          </span>
          <span className="discussion-count-badge">
            {questions.length} câu hỏi
          </span>
        </div>
        <div className="discussion-header-actions">
          <button
            type="button"
            className="btn-discussion-refresh"
            onClick={refreshDiscussions}
            disabled={loading}
          >
            <IconlyRefresh size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* 2. Khung nhập câu hỏi mới */}
      <div className="discussion-input-card">
        <div className="discussion-input-header">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || 'User'}
              className="user-avatar-circle"
            />
          ) : (
            <div className="user-avatar-placeholder">
              {(user?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="discussion-input-meta">
            <span className="discussion-input-name">
              {user?.fullName || 'Học viên'}
            </span>
            <span className="discussion-input-tip">
              Đặt câu hỏi gắn liền với bài giảng này
            </span>
          </div>
        </div>

        <textarea
          className="discussion-textarea"
          placeholder="Bạn có câu hỏi hoặc cần Giảng viên giải thích phần nào trong bài học này? Hãy nhập tại đây..."
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          rows={3}
          disabled={submittingQuestion}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handlePostQuestion();
            }
          }}
        />

        <div className="discussion-input-footer">
          <span className="discussion-hint">
            <IconlyBulb size={15} color="#eab308" />
            Nhấn <strong>Ctrl + Enter</strong> để gửi nhanh
          </span>

          <button
            type="button"
            className="btn-post-question"
            onClick={handlePostQuestion}
            disabled={!newQuestionText.trim() || submittingQuestion}
          >
            <IconlySend size={15} />
            {submittingQuestion ? 'Đang gửi...' : 'Đăng câu hỏi'}
          </button>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm & Lọc câu hỏi */}
      {questions.length > 0 && (
        <div className="discussion-filter-bar">
          <div className="discussion-search-box">
            <span className="discussion-search-icon">
              <IconlySearch size={15} />
            </span>
            <input
              type="text"
              className="discussion-search-input"
              placeholder="Tìm kiếm nội dung câu hỏi hoặc học viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="discussion-filter-chips">
            <button
              type="button"
              className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Tất cả ({questions.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${filterType === 'has_instructor_reply' ? 'active' : ''}`}
              onClick={() => setFilterType('has_instructor_reply')}
            >
              ⭐ Có phản hồi Giảng viên
            </button>
            <button
              type="button"
              className={`filter-chip ${filterType === 'unanswered' ? 'active' : ''}`}
              onClick={() => setFilterType('unanswered')}
            >
              Chưa trả lời
            </button>
          </div>
        </div>
      )}

      {/* 4. Danh sách câu hỏi */}
      {loading ? (
        <div
          style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}
        >
          Đang tải danh sách câu hỏi thảo luận...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="discussion-empty">
          <div className="discussion-empty-icon">💬</div>
          <div className="discussion-empty-title">
            {searchQuery
              ? 'Không tìm thấy câu hỏi phù hợp với từ khóa'
              : 'Chưa có câu hỏi nào cho bài học này'}
          </div>
          <div className="discussion-empty-desc">
            {searchQuery
              ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
              : 'Hãy là người đầu tiên đặt câu hỏi để Giảng viên và các học viên khác cùng trao đổi!'}
          </div>
        </div>
      ) : (
        <div className="discussion-list">
          {filteredQuestions.map((q) => (
            <div
              key={q._id}
              className={`question-card ${q.isPinned ? 'pinned' : ''}`}
            >
              {/* Header câu hỏi */}
              <div className="question-card-header">
                <div className="question-author-meta">
                  {q.userId.avatarUrl ? (
                    <img
                      src={q.userId.avatarUrl}
                      alt={q.userId.fullName}
                      className="user-avatar-circle"
                    />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {(q.userId.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="author-info-col">
                    <div className="author-name-row">
                      <span className="author-name">
                        {q.userId.fullName || 'Học viên'}
                      </span>
                      {q.isInstructor && (
                        <span className="badge-role instructor">
                          🎓 Giảng viên
                        </span>
                      )}
                      {q.isPinned && (
                        <span className="badge-role pinned">📌 Đã ghim</span>
                      )}
                    </div>
                    <span className="comment-time">
                      {formatTimeAgo(q.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <div className="question-content">{q.content}</div>

              {/* Actions row */}
              <div className="question-actions-row">
                {/* Upvote button */}
                <button
                  type="button"
                  className={`btn-action-disc ${q.isUpvoted ? 'upvoted' : ''}`}
                  onClick={() => handleToggleUpvote(q._id)}
                  title="Thích câu hỏi này"
                >
                  👍 {q.upvoteCount > 0 ? q.upvoteCount : 'Thích'}
                </button>

                {/* Reply button */}
                <button
                  type="button"
                  className="btn-action-disc"
                  onClick={() => {
                    setActiveReplyId(activeReplyId === q._id ? null : q._id);
                    setReplyText('');
                  }}
                >
                  💬{' '}
                  {q.repliesCount > 0 ? `${q.repliesCount} trả lời` : 'Trả lời'}
                </button>

                {/* Delete button (Author or Instructor/Admin) */}
                {(q.isAuthor || isCourseInstructor || isAdmin) && (
                  <button
                    type="button"
                    className="btn-action-disc danger"
                    onClick={() => handleDeleteDiscussion(q._id, false)}
                    title="Xóa câu hỏi này"
                  >
                    <IconlyDelete size={14} /> Xóa
                  </button>
                )}
              </div>

              {/* Form trả lời nhanh */}
              {activeReplyId === q._id && (
                <div className="quick-reply-box">
                  <textarea
                    className="quick-reply-textarea"
                    placeholder={`Trả lời câu hỏi của ${q.userId.fullName || 'học viên'}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoFocus
                    disabled={submittingReply}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handlePostReply(q._id);
                      }
                    }}
                  />
                  <div className="quick-reply-actions">
                    <button
                      type="button"
                      className="btn-cancel-reply"
                      onClick={() => setActiveReplyId(null)}
                      disabled={submittingReply}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="btn-submit-reply"
                      onClick={() => handlePostReply(q._id)}
                      disabled={!replyText.trim() || submittingReply}
                    >
                      {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách phản hồi (Threaded replies) */}
              {q.replies && q.replies.length > 0 && (
                <div className="replies-container">
                  {q.replies.map((reply) => (
                    <div
                      key={reply._id}
                      className={`reply-card ${reply.isPinned ? 'official-pinned' : ''}`}
                    >
                      {reply.isPinned && (
                        <div className="official-answer-tag">
                          <IconlyStar size={13} color="#7c3aed" />
                          <span>Câu trả lời chính thức từ Giảng viên</span>
                        </div>
                      )}

                      <div className="question-author-meta">
                        {reply.userId.avatarUrl ? (
                          <img
                            src={reply.userId.avatarUrl}
                            alt={reply.userId.fullName}
                            className="user-avatar-circle"
                            style={{ width: '30px', height: '30px' }}
                          />
                        ) : (
                          <div
                            className="user-avatar-placeholder"
                            style={{
                              width: '30px',
                              height: '30px',
                              fontSize: '0.8rem',
                            }}
                          >
                            {(reply.userId.fullName || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div className="author-info-col">
                          <div className="author-name-row">
                            <span
                              className="author-name"
                              style={{ fontSize: '0.86rem' }}
                            >
                              {reply.userId.fullName || 'Học viên'}
                            </span>
                            {reply.isInstructor && (
                              <span className="badge-role instructor">
                                🎓 Giảng viên
                              </span>
                            )}
                            {reply.isAuthor && (
                              <span className="badge-role author">Tác giả</span>
                            )}
                          </div>
                          <span className="comment-time">
                            {formatTimeAgo(reply.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="reply-content">{reply.content}</div>

                      <div
                        className="question-actions-row"
                        style={{ paddingTop: '4px' }}
                      >
                        <button
                          type="button"
                          className={`btn-action-disc ${reply.isUpvoted ? 'upvoted' : ''}`}
                          onClick={() => handleToggleUpvote(reply._id)}
                          style={{ fontSize: '0.78rem' }}
                        >
                          👍{' '}
                          {reply.upvoteCount > 0 ? reply.upvoteCount : 'Thích'}
                        </button>

                        {/* Ghim câu trả lời chính thức (Chỉ Giảng viên sở hữu khóa học hoặc Admin) */}
                        {(isCourseInstructor || isAdmin) && (
                          <button
                            type="button"
                            className="btn-action-disc pin-btn"
                            onClick={() =>
                              handleTogglePin(reply._id, reply.isPinned)
                            }
                            style={{ fontSize: '0.78rem' }}
                            title={
                              reply.isPinned
                                ? 'Bỏ ghim câu trả lời'
                                : 'Ghim làm câu trả lời chính thức'
                            }
                          >
                            📌 {reply.isPinned ? 'Bỏ ghim' : 'Ghim câu trả lời'}
                          </button>
                        )}

                        {/* Xóa phản hồi (Author hoặc Instructor/Admin) */}
                        {(reply.isAuthor || isCourseInstructor || isAdmin) && (
                          <button
                            type="button"
                            className="btn-action-disc danger"
                            onClick={() =>
                              handleDeleteDiscussion(reply._id, true)
                            }
                            style={{ fontSize: '0.78rem' }}
                            title="Xóa phản hồi này"
                          >
                            <IconlyDelete size={13} /> Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
