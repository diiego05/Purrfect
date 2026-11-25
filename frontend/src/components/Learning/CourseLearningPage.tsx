import { useState, useEffect, type FC } from 'react';
import type { Course, CourseSection, CourseLecture } from '../../types/course';
import {
  fetchCourseBySlug,
  recordCourseInteraction,
} from '../../services/courseApi';
import { paymentApi } from '../../services/paymentApi';
import { useAuth } from '../../context/AuthContext';
import {
  IconlyPlay,
  IconlyDocument,
  IconlyLock,
  IconlyArrowLeft,
  IconlyTick,
  IconlySparkles,
  IconlyClose,
  IconlyChevronDown,
  IconlyChevronUp,
} from '../Onboarding/IconlyIcons';
import { LectureDiscussionPanel } from './LectureDiscussionPanel';
import { QuizPlayer } from './QuizPlayer';
import { toast } from '../../context/ToastContext';
import { formatVND } from '../../utils/format';
import './CourseLearningPage.css';

interface CourseLearningPageProps {
  slug: string;
}

interface ActiveLectureState {
  sectionIndex: number;
  lectureIndex: number;
  lecture: CourseLecture;
}

export const CourseLearningPage: FC<CourseLearningPageProps> = ({ slug }) => {
  const { navigate, isAuthenticated, user, currentPath } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [refundStatus, setRefundStatus] = useState<string | null>(null);
  const [activeLecture, setActiveLecture] = useState<ActiveLectureState | null>(
    null,
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({ 0: true });
  const [completedLectures, setCompletedLectures] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState<
    'overview' | 'discussion' | 'transcript'
  >('overview');
  const [discussionCount, setDiscussionCount] = useState<number>(0);
  const [showLockedModal, setShowLockedModal] = useState<CourseLecture | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Lấy params s & l từ URL (hoặc currentPath)
    const getInitialIndices = (): {
      sectionIndex: number;
      lectureIndex: number;
    } => {
      try {
        const search =
          window.location.search ||
          (currentPath.includes('?') ? '?' + currentPath.split('?')[1] : '');
        const params = new URLSearchParams(search);
        const s = parseInt(params.get('s') || '0', 10);
        const l = parseInt(params.get('l') || '0', 10);
        return {
          sectionIndex: Number.isNaN(s) ? 0 : Math.max(0, s),
          lectureIndex: Number.isNaN(l) ? 0 : Math.max(0, l),
        };
      } catch {
        return { sectionIndex: 0, lectureIndex: 0 };
      }
    };

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchCourseBySlug(slug);
        if (!isMounted) return;

        if (data) {
          setCourse(data);

          // Ghi nhận tương tác học tập
          if (data._id) {
            recordCourseInteraction({
              actionType: 'PROGRESS',
              courseId: data._id,
              metadata: { action: 'ENTER_LEARNING_ROOM' },
            });
          }

          // Kiểm tra quyền học viên đã mua khóa học hay chưa
          let enrolled = false;
          if (isAuthenticated && data._id) {
            try {
              const res = await paymentApi.checkEnrollment(data._id);
              if (res && res.isEnrolled) {
                enrolled = true;
                setIsEnrolled(true);
              } else if (res && res.refundStatus) {
                setRefundStatus(res.refundStatus);
              }
            } catch {
              // Ignore enrollment check failure
            }
          }

          // Kiểm tra xem là giảng viên chủ khóa học hoặc Admin
          const instructorId =
            data.instructorId && typeof data.instructorId === 'object'
              ? data.instructorId._id ||
                (data.instructorId as { id?: string }).id ||
                ''
              : typeof data.instructorId === 'string'
                ? data.instructorId
                : '';
          const hasFullAccess =
            enrolled ||
            Boolean(
              user &&
              (user.role === 'ADMIN' ||
                (user.role === 'INSTRUCTOR' &&
                  (!instructorId || instructorId === user.id))),
            );

          // Chọn bài giảng ban đầu theo query params hoặc bài học đầu tiên có thể truy cập
          const { sectionIndex: targetS, lectureIndex: targetL } =
            getInitialIndices();
          const sections = data.sections || [];

          if (sections.length > 0) {
            const targetSection = sections[targetS] || sections[0];
            const lectures = targetSection?.lectures || [];

            if (lectures.length > 0) {
              const targetLecture = lectures[targetL] || lectures[0];
              // Nếu bài giảng này được phép truy cập
              if (hasFullAccess || targetLecture.isPreview) {
                setActiveLecture({
                  sectionIndex: sections[targetS] ? targetS : 0,
                  lectureIndex: lectures[targetL] ? targetL : 0,
                  lecture: targetLecture,
                });
                setExpandedSections((prev) => ({ ...prev, [targetS]: true }));
              } else {
                // Tìm bài preview đầu tiên
                let foundPreview: ActiveLectureState | null = null;
                for (let s = 0; s < sections.length; s += 1) {
                  const sLecs = sections[s].lectures || [];
                  for (let l = 0; l < sLecs.length; l += 1) {
                    if (sLecs[l].isPreview) {
                      foundPreview = {
                        sectionIndex: s,
                        lectureIndex: l,
                        lecture: sLecs[l],
                      };
                      break;
                    }
                  }
                  if (foundPreview) break;
                }

                if (foundPreview) {
                  setActiveLecture(foundPreview);
                  setExpandedSections((prev) => ({
                    ...prev,
                    [foundPreview.sectionIndex]: true,
                  }));
                } else {
                  // Mở bài đầu tiên nhưng hiển thị thông báo khóa
                  setActiveLecture({
                    sectionIndex: 0,
                    lectureIndex: 0,
                    lecture: lectures[0],
                  });
                }
              }
            }
          }
        }
      } catch {
        // Fallback handled
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated, user, currentPath]);

  // Chuẩn hóa Sections
  const normalizedSections: Array<{
    title: string;
    lessons: number;
    duration: string;
    lectures: CourseLecture[];
  }> =
    course?.sections && course.sections.length > 0
      ? course.sections.map((sec: CourseSection) => ({
          title: sec.title,
          lessons: sec.lectures ? sec.lectures.length : 0,
          duration: `${
            sec.lectures
              ? sec.lectures.reduce(
                  (sum: number, l: CourseLecture) =>
                    sum + (l.durationMinutes || 0),
                  0,
                )
              : 0
          }m`,
          lectures: sec.lectures || [],
        }))
      : [];

  const instructorObjId =
    course?.instructorId && typeof course.instructorId === 'object'
      ? course.instructorId._id ||
        (course.instructorId as { id?: string }).id ||
        ''
      : typeof course?.instructorId === 'string'
        ? course.instructorId
        : '';

  const isOwnerOrAdmin = Boolean(
    user &&
    (user.role === 'ADMIN' ||
      (user.role === 'INSTRUCTOR' &&
        (!instructorObjId || instructorObjId === user.id))),
  );

  const isCourseInstructor = Boolean(
    user &&
    user.role === 'INSTRUCTOR' &&
    (!instructorObjId || instructorObjId === user.id),
  );
  const isAdmin = Boolean(user && user.role === 'ADMIN');

  const canAccessLecture = (lecture: CourseLecture) =>
    Boolean(isEnrolled || isOwnerOrAdmin || lecture.isPreview);

  // Danh sách phẳng tất cả bài giảng để điều hướng tới/lui
  const flatLectures: Array<{
    sectionIndex: number;
    lectureIndex: number;
    lecture: CourseLecture;
  }> = [];

  normalizedSections.forEach((sec, sIdx) => {
    sec.lectures.forEach((lec, lIdx) => {
      flatLectures.push({
        sectionIndex: sIdx,
        lectureIndex: lIdx,
        lecture: lec,
      });
    });
  });

  const currentFlatIndex = activeLecture
    ? flatLectures.findIndex(
        (item) =>
          item.sectionIndex === activeLecture.sectionIndex &&
          item.lectureIndex === activeLecture.lectureIndex,
      )
    : -1;

  const handleSelectLecture = (
    sectionIndex: number,
    lectureIndex: number,
    lecture: CourseLecture,
  ) => {
    setActiveLecture({ sectionIndex, lectureIndex, lecture });
    setExpandedSections((prev) => ({ ...prev, [sectionIndex]: true }));

    if (!canAccessLecture(lecture)) {
      setShowLockedModal(lecture);
      return;
    }

    // Cập nhật URL sạch mà không làm reload trang
    const newUrl = `/learning/${course?.slug || slug}?s=${sectionIndex}&l=${lectureIndex}`;
    window.history.replaceState({}, '', newUrl);

    // Ghi nhận tiến độ học
    if (course?._id) {
      recordCourseInteraction({
        actionType: 'PROGRESS',
        courseId: course._id,
        metadata: {
          action: 'OPEN_LECTURE',
          lectureId: String(lecture._id || ''),
          lectureTitle: lecture.title,
          sectionIndex,
          lectureIndex,
        },
      });
    }
  };

  const handleStepLecture = (direction: -1 | 1) => {
    if (currentFlatIndex < 0) return;
    const target = flatLectures[currentFlatIndex + direction];
    if (target) {
      handleSelectLecture(
        target.sectionIndex,
        target.lectureIndex,
        target.lecture,
      );
    }
  };

  const toggleSectionExpand = (sIdx: number) => {
    setExpandedSections((prev) => ({ ...prev, [sIdx]: !prev[sIdx] }));
  };

  const toggleCompleteLecture = (lectureKey: string) => {
    setCompletedLectures((prev) => ({
      ...prev,
      [lectureKey]: !prev[lectureKey],
    }));
  };

  const getDocumentViewerUrl = (url?: string, fileName?: string): string => {
    if (!url) return '';
    // Nếu là Cloudinary URL, truyền qua proxy streaming của backend để vượt qua giới hạn 401 ACL Deny của Cloudinary
    if (url.includes('cloudinary.com')) {
      const apiBase =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const encodedUrl = encodeURIComponent(url);
      const safeName = encodeURIComponent(fileName || 'tai-lieu.pdf');
      return `${apiBase}/courses/lectures/document-stream?url=${encodedUrl}&filename=${safeName}`;
    }
    // Nếu là tệp cục bộ /uploads
    if (url.startsWith('/uploads')) {
      const apiBase =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const host = apiBase.replace(/\/api\/?$/, '');
      return `${host}${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="learning-page-loading">
        <div className="learning-loading-spinner" />
        <p>Đang tải phòng học và dữ liệu bài giảng...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="learning-page-error">
        <div className="learning-error-box">
          <h2>Không tìm thấy khóa học</h2>
          <p>Khóa học này không tồn tại hoặc đã bị ngừng cung cấp.</p>
          <button
            type="button"
            className="btn-learning-back"
            onClick={() => navigate('/')}
          >
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  const activeSectionTitle =
    activeLecture && normalizedSections[activeLecture.sectionIndex]
      ? normalizedSections[activeLecture.sectionIndex].title
      : 'Tổng quan khóa học';

  const currentLectureKey = activeLecture
    ? `${activeLecture.sectionIndex}-${activeLecture.lectureIndex}`
    : '';

  const isCurrentCompleted = currentLectureKey
    ? Boolean(completedLectures[currentLectureKey])
    : false;
  const completedCount =
    Object.values(completedLectures).filter(Boolean).length;
  const totalLecturesCount = flatLectures.length;
  const progressPercent =
    totalLecturesCount > 0
      ? Math.round((completedCount / totalLecturesCount) * 100)
      : 0;

  return (
    <div className="course-learning-page">
      {/* 1. THANH ĐIỀU HƯỚNG TRÊN CÙNG (DEDICATED LEARNING TOPBAR) */}
      <header className="learning-topbar">
        <div className="learning-topbar-left">
          <button
            type="button"
            className="btn-learning-return"
            onClick={() => navigate(`/courses/${course.slug || course._id}`)}
            title="Quay lại thông tin khóa học"
          >
            <IconlyArrowLeft size={16} color="currentColor" />
            <span>Khóa học</span>
          </button>

          <div className="learning-topbar-divider" />

          <div className="learning-title-group">
            <span className="learning-kicker">
              {course.title} • {activeSectionTitle}
            </span>
            <h1 className="learning-lecture-headline">
              {activeLecture
                ? activeLecture.lecture.title
                : 'Chọn bài giảng để bắt đầu học'}
            </h1>
          </div>
        </div>

        <div className="learning-topbar-right">
          <div className="learning-nav-group">
            <button
              type="button"
              className="btn-learning-step"
              onClick={() => handleStepLecture(-1)}
              disabled={currentFlatIndex <= 0}
              title="Bài học trước"
            >
              ‹ Bài trước
            </button>
            <button
              type="button"
              className="btn-learning-step"
              onClick={() => handleStepLecture(1)}
              disabled={currentFlatIndex >= flatLectures.length - 1}
              title="Bài học kế tiếp"
            >
              Bài tiếp ›
            </button>
          </div>

          <button
            type="button"
            className={`btn-learning-complete ${isCurrentCompleted ? 'completed' : ''}`}
            onClick={() =>
              currentLectureKey && toggleCompleteLecture(currentLectureKey)
            }
            title="Đánh dấu đã hoàn thành bài giảng"
          >
            <IconlyTick
              size={15}
              color={isCurrentCompleted ? '#ffffff' : 'currentColor'}
            />
            <span>
              {isCurrentCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
            </span>
          </button>

          <button
            type="button"
            className="btn-learning-sidebar-toggle"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={
              isSidebarOpen
                ? 'Thu gọn danh sách bài học'
                : 'Mở danh sách bài học'
            }
          >
            <IconlyDocument size={16} color="currentColor" />
            <span className="sidebar-toggle-text">
              Bài học ({totalLecturesCount})
            </span>
          </button>

          <button
            type="button"
            className="btn-learning-exit"
            onClick={() => navigate(`/courses/${course.slug || course._id}`)}
            title="Đóng trình phát và quay lại chi tiết khóa học"
            aria-label="Đóng trình phát"
          >
            <IconlyClose size={18} color="currentColor" />
          </button>
        </div>
      </header>

      {/* 2. KHU VỰC PHÒNG HỌC CHÍNH (PLAYER GRID) */}
      <div
        className={`learning-layout-body ${isSidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}
      >
        {/* CỘT TRÁI: VIDEO / TÀI LIỆU STAGE & NỘI DUNG CHI TIẾT */}
        <main className="learning-main-stage">
          <div className="learning-player-wrapper">
            {/* Banner cảnh báo    Tạm khóa do yêu cầu hoàn tiền đang chờ duyệt */}
            {refundStatus === 'REFUND_PENDING' && !isOwnerOrAdmin && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  marginBottom: '10px',
                }}
              >
                <span>
                  ⚠️ <strong>Quyền truy cập phòng học tạm thời bị khóa:</strong>{' '}
                  Đơn hàng của bạn đang có yêu cầu hoàn tiền chờ Admin xét duyệt
                  .
                </span>
                <button
                  type="button"
                  style={{
                    background: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => navigate('/purchase-history')}
                >
                  Xem Lịch sử mua hàng
                </button>
              </div>
            )}

            {/* Banner thông báo xem thử miễn phí */}
            {activeLecture &&
              activeLecture.lecture.isPreview &&
              !isEnrolled &&
              !isOwnerOrAdmin && (
                <div className="learning-preview-sticky-bar">
                  <div className="preview-sticky-left">
                    <span className="preview-sticky-tag">BÀI HỌC XEM THỬ</span>
                    <span className="preview-sticky-text">
                      Bạn đang trải nghiệm bài giảng xem thử miễn phí. Mở khóa
                      toàn bộ {flatLectures.length} bài giảng bằng cách thanh
                      toán khóa học.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-preview-checkout-now"
                    onClick={() =>
                      navigate(
                        `/checkout/${course?.slug || course?._id || slug}`,
                      )
                    }
                  >
                    Thanh toán khóa học (
                    {formatVND(
                      course?.discountPrice && course.discountPrice > 0
                        ? course.discountPrice
                        : course?.price || 0,
                    )}
                    )
                  </button>
                </div>
              )}

            {activeLecture ? (
              !canAccessLecture(activeLecture.lecture) ? (
                <div className="learning-paywall-screen">
                  <div className="paywall-lock-badge">
                    <IconlyLock size={44} color="#d97706" />
                  </div>
                  <span className="paywall-badge-pill">
                    NỘI DUNG CÓ PHÍ • CẦN THANH TOÁN
                  </span>
                  <h2 className="paywall-title">
                    Bài học yêu cầu thanh toán khóa học
                  </h2>
                  <p className="paywall-desc">
                    Bài giảng <strong>"{activeLecture.lecture.title}"</strong>{' '}
                    thuộc chương trình học tiêu chuẩn của khóa học{' '}
                    <strong>"{course?.title}"</strong>. Vui lòng thanh toán học
                    phí để mở khóa bài giảng này cùng toàn bộ video, tài liệu
                    đính kèm, bài kiểm tra và chứng chỉ tốt nghiệp.
                  </p>

                  <div className="paywall-pricing-card">
                    <div className="paywall-price-row">
                      <span className="paywall-label">Học phí khóa học:</span>
                      <div className="paywall-values">
                        <span className="paywall-final-price">
                          {formatVND(
                            course?.discountPrice &&
                              course.discountPrice > 0 &&
                              course.discountPrice < course.price
                              ? course.discountPrice
                              : course?.price || 0,
                          )}
                        </span>
                        {course?.discountPrice &&
                          course.discountPrice > 0 &&
                          course.discountPrice < course.price && (
                            <span className="paywall-strike-price">
                              {formatVND(course.price)}
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="paywall-features">
                      <div className="paywall-feat-item">
                        ✓ Truy cập trọn đời tất cả video bài giảng & tài liệu
                      </div>
                      <div className="paywall-feat-item">
                        ✓ Bài tập kiểm tra trắc nghiệm AI với lời giải chi tiết
                      </div>
                      <div className="paywall-feat-item">
                        ✓ Cấp chứng chỉ hoàn thành khóa học chính thức
                      </div>
                    </div>
                  </div>

                  <div className="paywall-btn-group">
                    <button
                      type="button"
                      className="btn-paywall-enroll"
                      onClick={() =>
                        navigate(
                          `/checkout/${course?.slug || course?._id || slug}`,
                        )
                      }
                    >
                      <span>Thanh toán khóa học ngay</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      className="btn-paywall-outline"
                      onClick={() =>
                        navigate(
                          `/courses/${course?.slug || course?._id || slug}`,
                        )
                      }
                    >
                      Xem trang giới thiệu khóa học
                    </button>
                  </div>
                </div>
              ) : activeLecture.lecture.type === 'QUIZ' ? (
                <QuizPlayer
                  quizData={
                    activeLecture.lecture
                      .quizData as unknown as import('../../types/instructorCourse').QuizDataItem
                  }
                  lectureTitle={activeLecture.lecture.title}
                  onCompleteQuiz={(_score, passed) => {
                    if (currentLectureKey && passed) {
                      toggleCompleteLecture(currentLectureKey);
                    }
                  }}
                  onNextLecture={() => handleStepLecture(1)}
                />
              ) : activeLecture.lecture.type === 'DOCUMENT' ? (
                activeLecture.lecture.contentUrl ? (
                  (() => {
                    const docViewUrl = getDocumentViewerUrl(
                      activeLecture.lecture.contentUrl,
                      activeLecture.lecture.fileName ||
                        activeLecture.lecture.title,
                    );
                    const docDownloadUrl = docViewUrl.includes('?')
                      ? `${docViewUrl}&download=true`
                      : `${docViewUrl}?download=true`;

                    return (
                      <div className="learning-doc-container">
                        <iframe
                          key={docViewUrl}
                          title={activeLecture.lecture.title}
                          src={docViewUrl}
                          className="learning-doc-frame"
                        />
                        <div className="learning-doc-toolbar">
                          <span className="learning-doc-filename">
                            <IconlyDocument size={15} color="#0056d2" />
                            <span>
                              {activeLecture.lecture.fileName ||
                                activeLecture.lecture.title}
                            </span>
                          </span>
                          <div className="learning-doc-toolbar-actions">
                            <a
                              href={docDownloadUrl}
                              download={
                                activeLecture.lecture.fileName || 'tai-lieu.pdf'
                              }
                              className="btn-learning-doc-download"
                              title="Tải tệp tài liệu về máy"
                            >
                              Tải về máy ↓
                            </a>
                            <a
                              href={docViewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-learning-doc-download"
                              title="Mở toàn màn hình trong tab mới"
                            >
                              Mở trong tab mới ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="learning-empty-stage">
                    <IconlyDocument size={42} color="#64748b" />
                    <h3>Bài giảng tài liệu chưa có tệp đính kèm</h3>
                    <p>Giảng viên đang chuẩn bị tài liệu cho phần học này.</p>
                  </div>
                )
              ) : activeLecture.lecture.contentUrl ? (
                <div className="learning-video-container">
                  <video
                    key={
                      activeLecture.lecture.contentUrl ||
                      activeLecture.lecture.title
                    }
                    controls
                    autoPlay
                    className="learning-video-element"
                    src={activeLecture.lecture.contentUrl}
                  />
                </div>
              ) : (
                <div className="learning-empty-stage">
                  <IconlyPlay size={42} color="#64748b" />
                  <h3>Bài giảng chưa có video đính kèm</h3>
                  <p>
                    Giảng viên hiện đang hoàn thiện video bài giảng cho bài học
                    này.
                  </p>
                  {isOwnerOrAdmin && (
                    <button
                      type="button"
                      className="btn-learning-edit-course"
                      onClick={() => navigate('/instructor/courses')}
                    >
                      Mở quản lý để cập nhật bài giảng
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="learning-empty-stage">
                <IconlyPlay size={42} color="#64748b" />
                <h3>Chọn bài giảng từ danh sách để bắt đầu học</h3>
              </div>
            )}
          </div>

          {/* THANH THÔNG TIN BÀI GIẢNG VÀ CÁC TAB */}
          <div className="learning-content-panel">
            <div className="learning-info-header">
              <div className="learning-info-title-box">
                <h2 className="learning-lecture-title">
                  {activeLecture ? activeLecture.lecture.title : course.title}
                </h2>
                <div className="learning-badges-row">
                  <span className="learning-badge badge-type">
                    {activeLecture?.lecture.type === 'DOCUMENT'
                      ? 'Tài liệu học tập'
                      : activeLecture?.lecture.type === 'QUIZ'
                        ? 'Bài kiểm tra AI'
                        : 'Video bài giảng'}
                  </span>
                  {activeLecture?.lecture.durationMinutes ? (
                    <span className="learning-badge badge-duration">
                      {activeLecture.lecture.durationMinutes} phút
                    </span>
                  ) : null}
                  {activeLecture?.lecture.isPreview && (
                    <span className="learning-badge badge-preview">
                      Xem thử miễn phí
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* TAB CONTROLS */}
            <div className="learning-tabs-nav">
              <button
                type="button"
                className={`learning-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Tổng quan & Ghi chú
              </button>
              <button
                type="button"
                className={`learning-tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
                onClick={() => setActiveTab('discussion')}
              >
                Thảo luận bài học{' '}
                {discussionCount > 0 ? `(${discussionCount})` : ''}
              </button>
              <button
                type="button"
                className={`learning-tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
                onClick={() => setActiveTab('transcript')}
              >
                Phụ đề bài giảng
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="learning-tab-body">
              {activeTab === 'overview' && (
                <div className="tab-pane-overview">
                  <div className="learning-overview-meta">
                    <p className="learning-course-desc">
                      {course.shortDescription ||
                        'Khóa học thực chiến cung cấp đầy đủ lý thuyết, bài tập tương tác và hướng dẫn chi tiết.'}
                    </p>
                  </div>

                  <div className="learning-instructor-card">
                    <div className="instructor-card-info">
                      <h4 className="instructor-card-name">
                        {typeof course.instructorId === 'object' &&
                        course.instructorId?.fullName
                          ? course.instructorId.fullName
                          : 'Giảng viên chuyên môn Purrfect Academy'}
                      </h4>
                      <p className="instructor-card-sub">
                        {typeof course.instructorId === 'object' &&
                        course.instructorId?.headline
                          ? course.instructorId.headline
                          : 'Chuyên gia đào tạo & Cố vấn công nghệ cấp cao'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'discussion' && (
                <div className="tab-pane-discussion">
                  {activeLecture?.lecture?._id ? (
                    <LectureDiscussionPanel
                      lectureId={String(activeLecture.lecture._id)}
                      courseId={String(course._id)}
                      lectureTitle={activeLecture.lecture.title}
                      courseTitle={course.title}
                      isEnrolled={isEnrolled}
                      isCourseInstructor={isCourseInstructor}
                      isAdmin={isAdmin}
                      onEnrollClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                        } else {
                          navigate(`/checkout?courseId=${course._id}`);
                        }
                      }}
                      onDiscussionCountChange={(count) =>
                        setDiscussionCount(count)
                      }
                    />
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '30px 0',
                        color: '#64748b',
                      }}
                    >
                      Vui lòng chọn một bài học để xem và tham gia thảo luận.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transcript' && (
                <div className="tab-pane-transcript">
                  {activeLecture?.lecture.transcript ? (
                    <div className="learning-transcript-box">
                      <div className="transcript-box-header">
                        <div className="transcript-header-title">
                          <IconlyDocument size={16} color="#0056d2" />
                          <span>Nội dung phụ đề bài giảng:</span>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-transcript"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              activeLecture.lecture.transcript || '',
                            );
                            toast.success(
                              'Đã sao chép transcript vào bộ nhớ tạm.',
                            );
                          }}
                        >
                          Sao chép transcript
                        </button>
                      </div>
                      <div className="transcript-box-content">
                        {activeLecture.lecture.transcript}
                      </div>
                    </div>
                  ) : (
                    <div className="learning-transcript-empty">
                      <p>
                        Bài giảng này chưa có phụ đề hoặc transcript tự động.
                      </p>
                      <p className="text-muted">
                        Hệ thống sẽ cập nhật phụ đề khi giảng viên hoàn tất xử
                        lý bài giảng.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* CỘT PHẢI: SIDEBAR NỘI DUNG KHÓA HỌC (PLAYLIST CURRICULUM) */}
        {isSidebarOpen && (
          <aside className="learning-sidebar">
            <div className="learning-sidebar-header">
              <div className="sidebar-header-title">
                <h3>Nội dung khóa học</h3>
                <span className="sidebar-lectures-count">
                  ({totalLecturesCount} bài giảng)
                </span>
              </div>
              <div className="sidebar-progress-box">
                <div className="sidebar-progress-text">
                  <span>Tiến độ học</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="sidebar-progress-bar">
                  <div
                    className="sidebar-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="learning-sidebar-content">
              {normalizedSections.map((sec, sIdx) => {
                const isExpanded = Boolean(expandedSections[sIdx]);
                return (
                  <div key={sIdx} className="learning-section-accordion">
                    <button
                      type="button"
                      className="learning-section-btn"
                      onClick={() => toggleSectionExpand(sIdx)}
                    >
                      <div className="section-title-wrap">
                        <span className="section-number">
                          Chương {sIdx + 1}:
                        </span>
                        <span className="section-name">{sec.title}</span>
                      </div>
                      <div className="section-meta-wrap">
                        <span className="section-meta-text">
                          {sec.lessons} bài • {sec.duration}
                        </span>
                        {isExpanded ? (
                          <IconlyChevronUp size={14} color="#94a3b8" />
                        ) : (
                          <IconlyChevronDown size={14} color="#94a3b8" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <ul className="learning-lectures-list">
                        {sec.lectures.length > 0 ? (
                          sec.lectures.map((lec, lIdx) => {
                            const isActive =
                              activeLecture?.sectionIndex === sIdx &&
                              activeLecture?.lectureIndex === lIdx;
                            const unlocked = canAccessLecture(lec);
                            const itemKey = `${sIdx}-${lIdx}`;
                            const isCompleted = Boolean(
                              completedLectures[itemKey],
                            );

                            return (
                              <li
                                key={lIdx}
                                className={`learning-lecture-item ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                                onClick={() =>
                                  handleSelectLecture(sIdx, lIdx, lec)
                                }
                              >
                                <div className="lecture-item-icon">
                                  {isCompleted ? (
                                    <IconlyTick size={15} color="#22c55e" />
                                  ) : isActive ? (
                                    <IconlyPlay size={15} color="#0056d2" />
                                  ) : unlocked ? (
                                    lec.type === 'QUIZ' ? (
                                      <IconlySparkles
                                        size={15}
                                        color="#8b5cf6"
                                      />
                                    ) : lec.type === 'DOCUMENT' ? (
                                      <IconlyDocument
                                        size={15}
                                        color="#94a3b8"
                                      />
                                    ) : (
                                      <IconlyPlay size={15} color="#94a3b8" />
                                    )
                                  ) : (
                                    <IconlyLock size={15} color="#64748b" />
                                  )}
                                </div>

                                <div className="lecture-item-body">
                                  <span className="lecture-item-title">
                                    {lec.title}
                                  </span>
                                  <div className="lecture-item-meta">
                                    <span className="meta-type">
                                      {lec.type === 'QUIZ'
                                        ? 'Kiểm tra AI'
                                        : lec.type === 'DOCUMENT'
                                          ? 'Tài liệu'
                                          : 'Video'}
                                    </span>
                                    {lec.type === 'QUIZ' &&
                                      lec.quizData?.availableFrom &&
                                      new Date() <
                                        new Date(
                                          lec.quizData.availableFrom,
                                        ) && (
                                        <span
                                          style={{
                                            background: '#ede9fe',
                                            color: '#7c3aed',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            marginLeft: '4px',
                                          }}
                                        >
                                          Chưa mở
                                        </span>
                                      )}
                                    {lec.type === 'QUIZ' &&
                                      lec.quizData?.availableUntil &&
                                      new Date() >
                                        new Date(
                                          lec.quizData.availableUntil,
                                        ) && (
                                        <span
                                          style={{
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            padding: '1px 6px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            marginLeft: '4px',
                                          }}
                                        >
                                          Đóng cổng
                                        </span>
                                      )}
                                    {lec.durationMinutes ? (
                                      <span className="meta-dot">
                                        • {lec.durationMinutes}m
                                      </span>
                                    ) : null}
                                    {lec.isPreview && (
                                      <span className="meta-preview-pill">
                                        Xem thử
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })
                        ) : (
                          <li className="learning-lecture-empty">
                            Chưa có bài giảng trong chương này
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* 3. MODAL KHOÁ BÀI HỌC (KHI CHƯA MUA / ĐĂNG KÝ) */}
      {showLockedModal && (
        <div className="learning-locked-overlay">
          <div className="learning-locked-dialog">
            <div className="locked-dialog-icon">
              <IconlyLock size={32} color="#f59e0b" />
            </div>
            <h3>Bài học này dành riêng cho học viên đã đăng ký</h3>
            <p>
              Bài giảng <strong>"{showLockedModal.title}"</strong> thuộc phần
              nội dung nâng cao của khóa học <strong>"{course.title}"</strong>.
            </p>
            <div className="locked-dialog-actions">
              <button
                type="button"
                className="btn-locked-cancel"
                onClick={() => setShowLockedModal(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-locked-enroll"
                onClick={() => {
                  setShowLockedModal(null);
                  navigate(`/checkout/${course.slug || course._id}`);
                }}
              >
                Thanh toán khóa học ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
