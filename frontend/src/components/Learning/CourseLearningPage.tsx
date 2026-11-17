import { useState, useEffect, type FC } from 'react';
import type { Course, CourseSection, CourseLecture } from '../../types/course';
import {
  fetchCourseBySlug,
  recordCourseInteraction,
} from '../../services/courseApi';
import { paymentApi } from '../../services/paymentApi';
import { useAuth } from '../../context/AuthContext';
import { useChatbot } from '../../context/ChatbotContext';
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
  const { askWithPrompt } = useChatbot();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [activeLecture, setActiveLecture] = useState<ActiveLectureState | null>(
    null,
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({ 0: true });
  const [completedLectures, setCompletedLectures] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'ai'>(
    'overview',
  );
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
    if (!canAccessLecture(lecture)) {
      setShowLockedModal(lecture);
      return;
    }

    setActiveLecture({ sectionIndex, lectureIndex, lecture });
    setExpandedSections((prev) => ({ ...prev, [sectionIndex]: true }));

    // Cập nhật URL sạch mà không làm reload trang
    const newUrl = `/learning/${course?.slug || slug}?s=${sectionIndex}&l=${lectureIndex}`;
    window.history.replaceState({}, '', newUrl);

    // Ghi nhận tiến độ học
    if (course?._id) {
      recordCourseInteraction({
        actionType: 'PROGRESS',
        courseId: course._id,
        metadata: {
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

  const handleAskPurrfectAI = (promptText: string) => {
    askWithPrompt(promptText);
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
          >
            <IconlyClose size={15} color="currentColor" />
            <span>Đóng trình phát</span>
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
            {activeLecture ? (
              activeLecture.lecture.type === 'DOCUMENT' ? (
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

              {/* Phím tắt Trợ lý AI */}
              <button
                type="button"
                className="btn-learning-ask-ai"
                onClick={() =>
                  handleAskPurrfectAI(
                    `Em đang học bài "${activeLecture?.lecture.title || course.title}" thuộc khóa "${course.title}". Hãy giải thích tóm tắt ý chính của bài giảng này giúp em.`,
                  )
                }
              >
                <IconlySparkles size={16} color="#ffffff" />
                <span>Hỏi trợ lý AI về bài này</span>
              </button>
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
                className={`learning-tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
                onClick={() => setActiveTab('transcript')}
              >
                Phụ đề & Transcript AI
              </button>
              <button
                type="button"
                className={`learning-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai')}
              >
                Trợ lý RAG thông minh
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

              {activeTab === 'transcript' && (
                <div className="tab-pane-transcript">
                  {activeLecture?.lecture.transcript ? (
                    <div className="learning-transcript-box">
                      <div className="transcript-box-header">
                        <div className="transcript-header-title">
                          <IconlyDocument size={16} color="#0056d2" />
                          <span>
                            Transcript phụ đề trích xuất tự động cho AI RAG:
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-copy-transcript"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              activeLecture.lecture.transcript || '',
                            );
                            alert('Đã sao chép transcript vào bộ nhớ tạm.');
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
                        Hệ thống sẽ tự động trích xuất phụ đề khi giảng viên cập
                        nhật video có giọng nói rõ ràng.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="tab-pane-ai">
                  <div className="learning-ai-intro">
                    <div className="ai-intro-heading">
                      <IconlySparkles size={18} color="#a855f7" />
                      <h4>Trợ lý học tập AI Purrfect (RAG Engine)</h4>
                    </div>
                    <p>
                      Trợ lý AI được huấn luyện dựa trên chính video, transcript
                      và giáo trình của bài học này để trả lời thắc mắc chính
                      xác theo từng mốc thời gian.
                    </p>
                  </div>

                  <div className="learning-ai-prompts">
                    <span className="prompts-label">Gợi ý câu hỏi nhanh:</span>
                    <div className="prompts-grid">
                      <button
                        type="button"
                        className="prompt-chip"
                        onClick={() =>
                          handleAskPurrfectAI(
                            `Tóm tắt 3 ý quan trọng nhất trong bài học "${activeLecture?.lecture.title}" này.`,
                          )
                        }
                      >
                        Tóm tắt 3 ý cốt lõi của bài học
                      </button>
                      <button
                        type="button"
                        className="prompt-chip"
                        onClick={() =>
                          handleAskPurrfectAI(
                            `Giải thích các thuật ngữ chuyên môn xuất hiện trong bài "${activeLecture?.lecture.title}".`,
                          )
                        }
                      >
                        Giải thích các thuật ngữ chuyên môn
                      </button>
                      <button
                        type="button"
                        className="prompt-chip"
                        onClick={() =>
                          handleAskPurrfectAI(
                            `Tạo 3 câu hỏi trắc nghiệm kiểm tra kiến thức bài học "${activeLecture?.lecture.title}" kèm đáp án.`,
                          )
                        }
                      >
                        Tạo 3 câu hỏi ôn tập có lời giải
                      </button>
                    </div>
                  </div>
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
                                    lec.type === 'DOCUMENT' ? (
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
                                      {lec.type === 'DOCUMENT'
                                        ? 'Tài liệu'
                                        : 'Video'}
                                    </span>
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
                Đăng ký khóa học ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
