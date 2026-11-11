import { useEffect, useRef, useState, type FC } from 'react';
import type {
  Course,
  SkillItem,
  CourseSection,
  CourseLecture,
} from '../../types/course';
import {
  fetchCourseBySlug,
  recordCourseInteraction,
} from '../../services/courseApi';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import { paymentApi } from '../../services/paymentApi';
import { useCartWishlist } from '../../context/CartWishlistContext';
import {
  IconlyTimeCircle,
  IconlyFolder,
  IconlyDevice,
  IconlyChat,
  IconlyAward,
  IconlyTick,
  IconlyStar,
  IconlyUserGroup,
  IconlyPlay,
  IconlyBuy,
  IconlyHeart,
  IconlyArrowLeft,
  IconlyClose,
  IconlyLock,
} from '../Onboarding/IconlyIcons';
import './CourseDetailPage.css';
import { AddToPlaylistModal } from '../Playlist/AddToPlaylistModal';

interface CourseDetailPageProps {
  slug: string;
}

interface ActiveLectureState {
  sectionIndex: number;
  lectureIndex: number;
  lecture: CourseLecture;
}

export const CourseDetailPage: FC<CourseDetailPageProps> = ({ slug }) => {
  const { navigate, isAuthenticated, user } = useAuth();
  const { addToCart, isInCart, toggleWishlist, isInWishlist } =
    useCartWishlist();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'syllabus' | 'instructor' | 'reviews'
  >('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] =
    useState<boolean>(false);
  const [activeLecture, setActiveLecture] = useState<ActiveLectureState | null>(
    null,
  );
  const [actionMessage, setActionMessage] = useState<string>('');
  const playerSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchCourseBySlug(slug).then((data) => {
      if (isMounted) {
        setCourse(data);
        setLoading(false);

        if (data?._id) {
          recordCourseInteraction({
            actionType: 'VIEW',
            courseId: data._id,
          });

          // Kiểm tra xem học viên hiện tại đã mua / đăng ký khóa học này chưa
          if (isAuthenticated) {
            paymentApi.checkEnrollment(data._id).then((res) => {
              if (isMounted && res.isEnrolled) {
                setIsEnrolled(true);
              }
            });
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated]);

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
      : [
          {
            title: 'Module 1: Nền tảng cốt lõi & Thiết lập công cụ',
            lessons: 3,
            duration: '1h 05m',
            lectures: [
              {
                title: '1. Giới thiệu tổng quan và mục tiêu đầu ra',
                type: 'VIDEO',
                contentUrl:
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                durationMinutes: 15,
                isPreview: true,
              },
              {
                title: '2. Hướng dẫn cài đặt và cấu hình môi trường',
                type: 'VIDEO',
                durationMinutes: 20,
              },
              {
                title: '3. Bài tập thực hành có chấm điểm',
                type: 'DOCUMENT',
                durationMinutes: 30,
              },
            ],
          },
          {
            title: 'Module 2: Các kỹ thuật và thao tác thực chiến',
            lessons: 8,
            duration: '3h 40m',
            lectures: [],
          },
          {
            title: 'Module 3: Dự án thực tế chuẩn doanh nghiệp',
            lessons: 10,
            duration: '4h 30m',
            lectures: [],
          },
          {
            title: 'Module 4: Kiểm tra đánh giá & Cấp chứng chỉ tốt nghiệp',
            lessons: 4,
            duration: '1h 35m',
            lectures: [],
          },
        ];

  const instructorObjId =
    course && typeof course.instructorId === 'object'
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

  const totalModules = normalizedSections.length;
  const totalLecturesCount = normalizedSections.reduce(
    (sum, sec) =>
      sum + (sec.lectures.length > 0 ? sec.lectures.length : sec.lessons),
    0,
  );

  const canAccessLecture = (lecture: CourseLecture, bypassLock = false) =>
    Boolean(bypassLock || isEnrolled || isOwnerOrAdmin || lecture.isPreview);

  const scrollToPlayer = () => {
    window.setTimeout(() => {
      playerSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 60);
  };

  const openLecturePlayer = (
    sectionIndex: number,
    lectureIndex: number,
    lecture: CourseLecture,
    bypassLock = false,
  ) => {
    if (!course) return;

    if (!canAccessLecture(lecture, bypassLock)) {
      setActionMessage(
        `Bài giảng "${lecture.title}" dành cho học viên đã đăng ký. Nhấn "Đăng ký học ngay" để mở khóa toàn bộ nội dung.`,
      );
      setActiveTab('syllabus');
      return;
    }

    setActionMessage('');
    setActiveLecture({ sectionIndex, lectureIndex, lecture });
    setExpandedModule(sectionIndex);
    setActiveTab('syllabus');

    if (course._id && isAuthenticated) {
      recordCourseInteraction({
        actionType: 'PROGRESS',
        courseId: course._id,
        metadata: { lectureTitle: lecture.title },
      });
    }

    scrollToPlayer();
  };

  const handleStartLearning = (bypassLock = false) => {
    for (let sIdx = 0; sIdx < normalizedSections.length; sIdx += 1) {
      const lectures = normalizedSections[sIdx].lectures;
      if (lectures && lectures.length > 0) {
        openLecturePlayer(sIdx, 0, lectures[0], bypassLock);
        return;
      }
    }

    setActiveTab('syllabus');
    setActionMessage('Khóa học hiện chưa có bài giảng nào được tải lên.');
  };

  const handlePreviewCourse = () => {
    if (isEnrolled || isOwnerOrAdmin) {
      handleStartLearning();
      return;
    }

    for (let sIdx = 0; sIdx < normalizedSections.length; sIdx += 1) {
      const lectures = normalizedSections[sIdx].lectures;
      const previewIdx = lectures.findIndex((lec) => Boolean(lec.isPreview));
      if (previewIdx >= 0) {
        openLecturePlayer(sIdx, previewIdx, lectures[previewIdx]);
        return;
      }
    }

    setActiveTab('syllabus');
    setActionMessage(
      'Khóa học này chưa có bài giảng xem thử miễn phí. Bạn có thể đăng ký để học toàn bộ nội dung.',
    );
  };

  const handleStepLecture = (direction: -1 | 1) => {
    if (!activeLecture) return;

    const flatList: Array<{
      sectionIndex: number;
      lectureIndex: number;
      lecture: CourseLecture;
    }> = [];

    normalizedSections.forEach((sec, sIdx) => {
      sec.lectures.forEach((lec, lIdx) => {
        flatList.push({ sectionIndex: sIdx, lectureIndex: lIdx, lecture: lec });
      });
    });

    const currentPos = flatList.findIndex(
      (item) =>
        item.sectionIndex === activeLecture.sectionIndex &&
        item.lectureIndex === activeLecture.lectureIndex,
    );

    const target = flatList[currentPos + direction];
    if (target) {
      openLecturePlayer(
        target.sectionIndex,
        target.lectureIndex,
        target.lecture,
      );
    }
  };

  const handleEnrollClick = () => {
    if (!course) return;

    // Nếu đã sở hữu hoặc là giảng viên/admin quản lý -> mở trình phát học tập ngay
    if (isEnrolled || isOwnerOrAdmin) {
      handleStartLearning();
      return;
    }

    // Nếu chưa đăng nhập -> điều hướng tới trang đăng nhập
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const effectivePrice =
      course.discountPrice &&
      course.discountPrice > 0 &&
      course.discountPrice < course.price
        ? course.discountPrice
        : course.price;

    // Nếu khóa học có phí -> chuyển sang trang thanh toán /checkout/:slug
    if (effectivePrice > 0) {
      navigate(`/checkout/${course.slug || course._id}`);
      return;
    }

    // Nếu khóa học miễn phí -> Đăng ký ngay lập tức và mở trình phát bài giảng
    if (course._id) {
      paymentApi
        .createPaymentUrl({ courseId: course._id })
        .then((res) => {
          if (res.success) {
            setIsEnrolled(true);
            handleStartLearning(true);
            setActionMessage(
              `Đã đăng ký thành công khóa học "${course.title}".`,
            );
          }
        })
        .catch(() => {
          setIsEnrolled(true);
          handleStartLearning(true);
        });
    }
  };

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="detail-banner-skeleton shimmer" />
        <div className="detail-container">
          <div className="detail-card-skeleton shimmer" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-not-found">
        <div className="not-found-box">
          <h2>Không tìm thấy khóa học</h2>
          <p>Khóa học với đường dẫn này không tồn tại hoặc đã được cập nhật.</p>
          <button className="btn-back-home" onClick={() => navigate('/')}>
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Chuẩn hóa Cấp độ hiển thị
  const formatLevel = (lvl?: string) => {
    const l = (lvl || 'Beginner').toLowerCase();
    if (l.includes('inter') || l.includes('trung')) {
      return { title: 'Cấp độ Trung cấp', desc: 'Kinh nghiệm được đề xuất' };
    }
    if (l.includes('adv') || l.includes('cao')) {
      return { title: 'Cấp độ Nâng cao', desc: 'Dành cho chuyên gia' };
    }
    return { title: 'Cấp độ Cơ bản', desc: 'Dành cho người mới bắt đầu' };
  };

  const levelInfo = formatLevel(course.level);

  // Chuẩn hóa thời lượng học
  const displayHours =
    course.durationText ||
    (course.durationHours ? `${course.durationHours} giờ` : '1.5 hours');

  // Chuẩn hóa số sao và số lượt đánh giá
  const ratingNum = course.averageRating
    ? Number(course.averageRating).toFixed(1)
    : '4.8';
  const ratingCount = course.totalStudents
    ? Math.max(12, Math.round(course.totalStudents * 0.35)).toLocaleString(
        'vi-VN',
      )
    : '14.314';

  const categoryName =
    typeof course.categoryId === 'object' && course.categoryId?.name
      ? course.categoryId.name
      : 'Kỹ năng chuyên sâu';

  // Giảng viên
  const instructorName =
    typeof course.instructorId === 'object' &&
    (course.instructorId?.fullName || course.instructorId?.name)
      ? course.instructorId.fullName || course.instructorId.name || 'Giảng viên'
      : 'Giảng viên Purrfect Academy';

  const instructorAvatar =
    typeof course.instructorId === 'object' &&
    (course.instructorId?.avatarUrl || course.instructorId?.avatar)
      ? course.instructorId.avatarUrl ||
        course.instructorId.avatar ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80'
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80';

  const instructorHeadline =
    typeof course.instructorId === 'object' && course.instructorId?.headline
      ? course.instructorId.headline
      : 'Chuyên gia đào tạo & Cố vấn cấp cao tại Purrfect Academy';

  const instructorBio =
    typeof course.instructorId === 'object' && course.instructorId?.bio
      ? course.instructorId.bio
      : 'Với hơn 10 năm kinh nghiệm trong ngành và từng đào tạo hàng chục nghìn học viên trên toàn cầu, giảng viên mang đến phương pháp giảng dạy trực quan, dễ hiểu và tập trung 100% vào ứng dụng thực tiễn.';

  const statusBadgeText = (() => {
    switch (course.status) {
      case 'PUBLISHED':
        return 'Đã xuất bản';
      case 'PENDING_APPROVAL':
        return 'Chờ phê duyệt';
      case 'REJECTED':
        return 'Bị từ chối';
      case 'DISABLED':
      case 'ARCHIVED':
        return 'Ngừng kinh doanh';
      default:
        return 'Bản nháp';
    }
  })();

  // Lấy danh sách kỹ năng
  const skillsList: string[] = Array.isArray(course.skillIds)
    ? (course.skillIds as (SkillItem | string)[]).map((s) =>
        typeof s === 'object' && s.name ? s.name : String(s),
      )
    : [];

  const courseId = course._id || course.id || '';
  const inCart = courseId ? isInCart(courseId) : false;
  const inWishlist = courseId ? isInWishlist(courseId) : false;

  return (
    <div className="course-detail-page">
      {isOwnerOrAdmin && (
        <div className="instructor-preview-bar">
          <div className="instructor-preview-bar-inner">
            <div className="instructor-preview-left">
              <button
                type="button"
                className="btn-back-instructor"
                onClick={() =>
                  navigate(
                    user?.role === 'ADMIN'
                      ? '/admin/courses'
                      : '/instructor/courses',
                  )
                }
              >
                <IconlyArrowLeft size={15} color="currentColor" />
                <span>Quay lại Quản lý khóa học</span>
              </button>
              <span
                className={`course-status-pill status-${(course.status || 'DRAFT').toLowerCase()}`}
              >
                {statusBadgeText}
              </span>
            </div>
            <div className="instructor-preview-right">
              <button
                type="button"
                className="btn-open-course-player"
                onClick={() => handleStartLearning()}
              >
                <IconlyPlay size={14} color="#ffffff" />
                <span>Trình phát khóa học</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeLecture && (
        <section ref={playerSectionRef} className="course-player-section">
          <div className="course-player-container">
            <div className="course-player-topbar">
              <div>
                <div className="course-player-kicker">
                  {course.title} • Chương {activeLecture.sectionIndex + 1}
                </div>
                <h2 className="course-player-title">
                  {activeLecture.lecture.title}
                </h2>
              </div>
              <div className="course-player-actions">
                <button
                  type="button"
                  className="btn-player-nav"
                  onClick={() => handleStepLecture(-1)}
                >
                  ‹ Bài trước
                </button>
                <button
                  type="button"
                  className="btn-player-nav"
                  onClick={() => handleStepLecture(1)}
                >
                  Bài tiếp ›
                </button>
                <button
                  type="button"
                  className="btn-player-close"
                  onClick={() => setActiveLecture(null)}
                >
                  <IconlyClose size={14} color="currentColor" />
                  <span>Đóng trình phát</span>
                </button>
              </div>
            </div>

            <div className="course-player-grid">
              <div className="course-player-main">
                <div className="course-player-stage">
                  {activeLecture.lecture.type === 'DOCUMENT' ? (
                    activeLecture.lecture.contentUrl ? (
                      <div className="course-player-doc-wrap">
                        <iframe
                          title={activeLecture.lecture.title}
                          src={activeLecture.lecture.contentUrl}
                          className="course-player-doc"
                        />
                        <div className="course-player-doc-footer">
                          <span>
                            {activeLecture.lecture.fileName ||
                              'Tài liệu bài giảng'}
                          </span>
                          <a
                            href={activeLecture.lecture.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="course-player-doc-link"
                          >
                            Mở tài liệu trong tab mới ↗
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="course-player-empty">
                        <p>Bài giảng tài liệu này chưa có tệp đính kèm.</p>
                      </div>
                    )
                  ) : activeLecture.lecture.contentUrl ? (
                    <video
                      key={
                        activeLecture.lecture.contentUrl ||
                        activeLecture.lecture.title
                      }
                      controls
                      autoPlay
                      className="course-player-video"
                      src={activeLecture.lecture.contentUrl}
                    />
                  ) : (
                    <div className="course-player-empty">
                      <p>Bài giảng này chưa có tệp video tải lên.</p>
                      {isOwnerOrAdmin && (
                        <button
                          type="button"
                          className="btn-back-instructor"
                          onClick={() => navigate('/instructor/courses')}
                        >
                          Mở Quản lý khóa học để bổ sung video
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {activeLecture.lecture.transcript && (
                  <div className="course-player-transcript">
                    <h4>Phụ đề / Transcript trích xuất cho Trợ lý AI</h4>
                    <p>{activeLecture.lecture.transcript}</p>
                  </div>
                )}
              </div>

              <aside className="course-player-sidebar">
                <div className="player-sidebar-header">
                  Nội dung khóa học ({totalLecturesCount} bài giảng)
                </div>
                <div className="player-playlist-scroll">
                  {normalizedSections.map((sec, sIdx) => (
                    <div key={sIdx} className="player-section-group">
                      <div className="player-section-heading">{sec.title}</div>
                      <ul className="player-lecture-list">
                        {sec.lectures.length > 0 ? (
                          sec.lectures.map((lec, lIdx) => {
                            const isActive =
                              activeLecture.sectionIndex === sIdx &&
                              activeLecture.lectureIndex === lIdx;
                            const unlocked = canAccessLecture(lec);
                            return (
                              <li
                                key={lIdx}
                                className={`player-lecture-item ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                                onClick={() =>
                                  openLecturePlayer(sIdx, lIdx, lec)
                                }
                              >
                                <span className="player-lecture-icon">
                                  {isActive ? (
                                    <IconlyPlay size={14} color="#60a5fa" />
                                  ) : unlocked ? (
                                    <IconlyPlay size={14} color="#94a3b8" />
                                  ) : (
                                    <IconlyLock size={14} color="#64748b" />
                                  )}
                                </span>
                                <div className="player-lecture-info">
                                  <span className="player-lecture-name">
                                    {lec.title}
                                  </span>
                                  <span className="player-lecture-meta">
                                    {lec.type === 'DOCUMENT'
                                      ? 'Tài liệu'
                                      : 'Video'}
                                    {lec.durationMinutes
                                      ? ` • ${lec.durationMinutes}m`
                                      : ''}
                                    {lec.isPreview ? ' • Xem thử' : ''}
                                  </span>
                                </div>
                              </li>
                            );
                          })
                        ) : (
                          <li className="player-lecture-empty">
                            Chưa có bài giảng trong chương này
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      {/* 1. HERO BANNER THEO MẪU */}
      <section className="course-hero-banner">
        <div className="banner-inner-container">
          {/* Breadcrumb */}
          <nav className="course-breadcrumb" aria-label="Breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate('/')}>
              Trang chủ
            </span>
            <span className="breadcrumb-separator">/</span>
            {categoryName && (
              <>
                <span
                  className="breadcrumb-link"
                  onClick={() => {
                    const catSlug =
                      typeof course.categoryId === 'object' &&
                      course.categoryId?.slug
                        ? course.categoryId.slug
                        : '';
                    if (catSlug) {
                      navigate(`/category/${catSlug}`);
                    } else {
                      navigate('/category/all');
                    }
                  }}
                >
                  {categoryName}
                </span>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            <span className="breadcrumb-current">{course.title}</span>
          </nav>

          <div className="banner-content-grid">
            <div className="banner-text-col">
              <h1 className="course-hero-title">{course.title}</h1>

              {/* Thông tin giảng viên */}
              <div className="course-instructor-line">
                <img
                  src={instructorAvatar}
                  alt={instructorName}
                  className="instructor-avatar-circle"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
                  }}
                />
                <span className="instructor-label">
                  Giảng viên:{' '}
                  <strong className="instructor-name-link">
                    {instructorName}
                  </strong>
                </span>
              </div>

              {/* Nút Đăng ký, Giỏ hàng, Yêu thích & Số học viên */}
              <div className="banner-cta-group">
                <button
                  className={`btn-banner-enroll ${isEnrolled || isOwnerOrAdmin ? 'enrolled' : ''}`}
                  onClick={handleEnrollClick}
                >
                  {isEnrolled || isOwnerOrAdmin ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <IconlyPlay size={16} color="#ffffff" />
                      <span>Vào học ngay</span>
                    </span>
                  ) : course.price <= 0 ? (
                    'Đăng ký miễn phí'
                  ) : (
                    'Đăng ký học ngay'
                  )}
                </button>
                {!isEnrolled && !isOwnerOrAdmin && (
                  <>
                    <button
                      type="button"
                      className="btn-banner-cart"
                      onClick={async (e) => {
                        if (inCart) {
                          navigate('/cart');
                        } else {
                          await addToCart(course, e);
                        }
                      }}
                    >
                      <IconlyBuy size={18} color="#0056d2" />
                      <span>{inCart ? 'Xem giỏ hàng' : 'Thêm vào giỏ'}</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-banner-wishlist ${inWishlist ? 'active' : ''}`}
                      onClick={async () => {
                        const res = await toggleWishlist(course);
                        if (res.isWishlisted) {
                          navigate('/wishlist');
                        }
                      }}
                      title={inWishlist ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                      aria-label="Yêu thích"
                    >
                      <IconlyHeart
                        size={20}
                        color={inWishlist ? '#e11d48' : '#475569'}
                      />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn-banner-playlist"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setIsPlaylistModalOpen(true);
                  }}
                  title="Lưu khóa học vào Playlist"
                >
                  <IconlyFolder size={18} color="#0056d2" />
                  <span>Lưu vào Playlist</span>
                </button>
                <div className="banner-students-enrolled">
                  <strong>
                    {course.totalStudents
                      ? course.totalStudents.toLocaleString('vi-VN')
                      : '1.408.583'}
                  </strong>{' '}
                  đã đăng ký
                </div>
              </div>
            </div>

            {/* Họa tiết vòng tròn vector trang trí bên phải */}
            <div className="banner-decor-col" aria-hidden="true">
              <div className="abstract-circle-ring ring-outer" />
              <div className="abstract-circle-ring ring-middle" />
              <div className="abstract-circle-ring ring-inner" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. THANH THÔNG SỐ NỔI (FLOATING INFO BAR) */}
      <div className="floating-info-bar-wrapper">
        <div className="floating-info-bar">
          {/* Cột 1: Phân loại / Dự án thực hành */}
          <div className="info-bar-col">
            <h3 className="col-headline">Các dự án có hướng dẫn</h3>
            <p className="col-subtext">
              Học, thực hành và áp dụng các kỹ năng sẵn sàng cho công việc với
              sự hướng dẫn của chuyên gia
            </p>
          </div>

          {/* Cột 2: Số sao & Đánh giá (Thông số chỉ định) */}
          <div className="info-bar-col">
            <div className="col-rating-line">
              <span className="rating-score">{ratingNum}</span>
              <IconlyStar size={18} color="#f59e0b" />
              <span className="rating-count">({ratingCount} đánh giá)</span>
            </div>
            <p className="col-subtext">
              Đánh giá trung thực từ cộng đồng người học
            </p>
          </div>

          {/* Cột 3: Cấp độ (Thông số chỉ định) */}
          <div className="info-bar-col">
            <h3 className="col-headline">{levelInfo.title}</h3>
            <p className="col-subtext">{levelInfo.desc} ⓘ</p>
          </div>

          {/* Cột 4: Giờ học (Thông số chỉ định) */}
          <div className="info-bar-col">
            <h3 className="col-headline">{displayHours}</h3>
            <p className="col-subtext">Học theo tốc độ của riêng bạn</p>
          </div>
        </div>
      </div>

      {/* 3. NỘI DUNG CHI TIẾT RIÊNG BIỆT CHO PURRFECT (KHÁC BIỆT 100%) */}
      <div className="course-main-content-layout">
        <div className="content-left-column">
          {/* Tabs điều hướng nội dung */}
          <div className="purr-content-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
            <button
              className={`tab-btn ${activeTab === 'syllabus' ? 'active' : ''}`}
              onClick={() => setActiveTab('syllabus')}
            >
              Chương trình học
            </button>
            <button
              className={`tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructor')}
            >
              Giảng viên
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Đánh giá ({ratingNum}</span>
                <IconlyStar size={13} color="#f59e0b" />
                <span>)</span>
              </span>
            </button>
          </div>

          {/* Tab 1: Tổng quan */}
          {activeTab === 'overview' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <h2 className="section-heading">Những gì bạn sẽ học được</h2>
                <div className="learning-outcomes-grid">
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Nắm vững các nguyên lý thực chiến và kỹ năng giải quyết
                      vấn đề từ căn bản đến chuyên sâu.
                    </span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Thao tác tự tin với các công cụ hàng đầu, tối ưu hóa quy
                      trình làm việc chuyên nghiệp.
                    </span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Xây dựng các dự án thực tế để hoàn thiện hồ sơ năng lực
                      (Portfolio) gây ấn tượng với nhà tuyển dụng.
                    </span>
                  </div>
                  <div className="outcome-item">
                    <span className="outcome-check">
                      <IconlyTick size={14} color="#059669" />
                    </span>
                    <span>
                      Tư duy phân tích dữ liệu và áp dụng linh hoạt trong môi
                      trường doanh nghiệp hiện đại.
                    </span>
                  </div>
                </div>
              </section>

              {skillsList.length > 0 && (
                <section className="detail-section-card">
                  <h2 className="section-heading">Kỹ năng bạn sẽ tích lũy</h2>
                  <div className="skills-badge-wrap">
                    {skillsList.map((skill, idx) => (
                      <span key={idx} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section className="detail-section-card">
                <h2 className="section-heading">Mô tả chi tiết khóa học</h2>
                <p className="course-long-desc">
                  {course.description ||
                    course.shortDescription ||
                    'Khóa học được thiết kế bởi các chuyên gia đầu ngành, mang lại trải nghiệm học tập thực tế và tương tác cao. Mỗi bài học đều có bài tập ứng dụng kèm lời giải chi tiết giúp bạn nhanh chóng làm chủ kỹ năng.'}
                </p>
              </section>
            </div>
          )}

          {/* Tab 2: Chương trình học */}
          {activeTab === 'syllabus' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <div className="syllabus-header">
                  <div>
                    <h2 className="section-heading">
                      {course.sections && course.sections.length > 0
                        ? 'Nội dung chương trình học'
                        : 'Lộ trình học tập chi tiết'}
                    </h2>
                    <p className="syllabus-meta">
                      {totalModules} Chương • {totalLecturesCount} Bài giảng •
                      Thời lượng {displayHours}
                    </p>
                  </div>
                </div>

                {actionMessage && (
                  <div className="course-action-notice">
                    <span>{actionMessage}</span>
                    <button
                      type="button"
                      className="btn-dismiss-notice"
                      onClick={() => setActionMessage('')}
                      aria-label="Đóng thông báo"
                    >
                      <IconlyClose size={15} color="currentColor" />
                    </button>
                  </div>
                )}

                <div className="syllabus-accordion">
                  {normalizedSections.map(
                    (
                      mod: {
                        title: string;
                        lessons: number;
                        duration: string;
                        lectures: CourseLecture[];
                      },
                      idx: number,
                    ) => (
                      <div key={idx} className="module-item">
                        <button
                          type="button"
                          className="module-toggle-btn"
                          onClick={() =>
                            setExpandedModule(
                              expandedModule === idx ? null : idx,
                            )
                          }
                        >
                          <div className="module-title-left">
                            <span className="module-index">0{idx + 1}</span>
                            <span className="module-name">{mod.title}</span>
                          </div>
                          <div className="module-meta-right">
                            <span>
                              {mod.lessons} bài học • {mod.duration}
                            </span>
                            <span className="module-arrow">
                              {expandedModule === idx ? '▲' : '▼'}
                            </span>
                          </div>
                        </button>
                        {expandedModule === idx && (
                          <div className="module-content-drawer">
                            <ul className="lesson-list">
                              {mod.lectures && mod.lectures.length > 0 ? (
                                mod.lectures.map(
                                  (lec: CourseLecture, lIdx: number) => {
                                    const unlocked = canAccessLecture(lec);
                                    const isPlaying =
                                      activeLecture?.sectionIndex === idx &&
                                      activeLecture?.lectureIndex === lIdx;
                                    return (
                                      <li
                                        key={lIdx}
                                        className={`clickable-lesson ${isPlaying ? 'playing' : ''} ${!unlocked ? 'locked-lesson' : ''}`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                          openLecturePlayer(idx, lIdx, lec)
                                        }
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                          ) {
                                            e.preventDefault();
                                            openLecturePlayer(idx, lIdx, lec);
                                          }
                                        }}
                                      >
                                        <span className="lesson-title-cell">
                                          <span className="lesson-play-badge">
                                            {isPlaying || unlocked ? (
                                              <IconlyPlay
                                                size={14}
                                                color="#0056d2"
                                              />
                                            ) : (
                                              <IconlyLock
                                                size={14}
                                                color="#64748b"
                                              />
                                            )}
                                          </span>
                                          <span>{lec.title}</span>
                                        </span>
                                        <div className="lesson-tags-cell">
                                          {lec.isPreview ? (
                                            <span className="lesson-tag lesson-tag-preview">
                                              Xem thử
                                            </span>
                                          ) : unlocked ? (
                                            <span className="lesson-tag lesson-tag-play">
                                              {isPlaying
                                                ? 'Đang phát'
                                                : 'Phát ngay'}
                                            </span>
                                          ) : (
                                            <span className="lesson-tag lesson-tag-lock">
                                              Học viên
                                            </span>
                                          )}
                                          <span className="lesson-tag">
                                            {lec.type === 'DOCUMENT'
                                              ? 'Tài liệu'
                                              : 'Video'}{' '}
                                            {lec.durationMinutes
                                              ? `${lec.durationMinutes}m`
                                              : ''}
                                          </span>
                                        </div>
                                      </li>
                                    );
                                  },
                                )
                              ) : (
                                <li className="empty-lesson-row">
                                  <span>
                                    Chương này chưa có bài giảng chi tiết
                                  </span>
                                  <span className="lesson-tag">
                                    Đang cập nhật
                                  </span>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </section>
            </div>
          )}

          {/* Tab 3: Giảng viên */}
          {activeTab === 'instructor' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card instructor-bio-card">
                <div className="instructor-card-top">
                  <img
                    src={instructorAvatar}
                    alt={instructorName}
                    className="instructor-large-avatar"
                  />
                  <div>
                    <h2 className="instructor-fullname">{instructorName}</h2>
                    <p className="instructor-role">{instructorHeadline}</p>
                    <div className="instructor-stats-row">
                      <span className="stat-item">
                        <IconlyStar size={16} color="#f59e0b" />
                        <span>
                          <strong>{ratingNum}</strong> Điểm giảng viên
                        </span>
                      </span>
                      <span className="stat-item">
                        <IconlyUserGroup size={16} color="#0056d2" />
                        <span>
                          <strong>
                            {course.totalStudents.toLocaleString('vi-VN')}
                          </strong>{' '}
                          Học viên
                        </span>
                      </span>
                      <span className="stat-item">
                        <IconlyAward size={16} color="#0056d2" />
                        <span>
                          <strong>12</strong> Khóa học đã xuất bản
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <p className="instructor-bio-text">{instructorBio}</p>
              </section>
            </div>
          )}

          {/* Tab 4: Đánh giá */}
          {activeTab === 'reviews' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <h2 className="section-heading">
                  Phản hồi từ học viên đã hoàn thành
                </h2>
                <div className="reviews-summary-box">
                  <div className="review-big-score">
                    <span className="big-number">{ratingNum}</span>
                    <div className="stars-gold-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <IconlyStar key={s} size={20} color="#f59e0b" />
                      ))}
                    </div>
                    <span className="score-desc">
                      {ratingCount} đánh giá tích cực
                    </span>
                  </div>
                  <div className="review-bars-col">
                    {[
                      { star: '5 sao', percent: '88%' },
                      { star: '4 sao', percent: '9%' },
                      { star: '3 sao', percent: '2%' },
                      { star: '2 sao', percent: '1%' },
                      { star: '1 sao', percent: '0%' },
                    ].map((bar, i) => (
                      <div key={i} className="review-bar-line">
                        <span className="bar-label">{bar.star}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: bar.percent }}
                          />
                        </div>
                        <span className="bar-pct">{bar.percent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Cột Phải (Sidebar Sticky Widget) */}
        <aside className="content-right-sidebar">
          <div className="sticky-enrollment-card">
            <div
              className="sidebar-thumb-wrap"
              role="button"
              tabIndex={0}
              onClick={handlePreviewCourse}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePreviewCourse();
                }
              }}
              title={
                isEnrolled || isOwnerOrAdmin
                  ? 'Nhấn để phát bài giảng ngay'
                  : 'Nhấn để xem thử khóa học'
              }
            >
              <img
                src={
                  course.thumbnailUrl || '/assets/advanced_digital_skills.jpg'
                }
                alt={course.title}
                className="sidebar-thumb-img"
              />
              <div className="sidebar-thumb-overlay">
                <span className="btn-play-preview">
                  <IconlyPlay size={14} color="#0f172a" />
                  <span>
                    {isEnrolled || isOwnerOrAdmin
                      ? 'Phát bài giảng ngay'
                      : 'Xem trước khóa học'}
                  </span>
                </span>
              </div>
            </div>

            <div className="sidebar-card-body">
              {(() => {
                const hasDiscount = Boolean(
                  course.discountPrice &&
                  course.discountPrice > 0 &&
                  course.discountPrice < course.price,
                );
                const currentPriceVal = hasDiscount
                  ? (course.discountPrice as number)
                  : course.price;
                const originalPriceVal = hasDiscount ? course.price : null;

                return (
                  <div className="sidebar-price-row">
                    <span className="current-price">
                      {formatVND(currentPriceVal)}
                    </span>
                    {originalPriceVal && (
                      <span className="original-price">
                        {formatVND(originalPriceVal)}
                      </span>
                    )}
                    {course.badge && (
                      <span className="discount-tag">{course.badge}</span>
                    )}
                  </div>
                );
              })()}

              <button
                type="button"
                className={`btn-sidebar-action ${isEnrolled || isOwnerOrAdmin ? 'enrolled' : ''}`}
                onClick={handleEnrollClick}
              >
                {isEnrolled || isOwnerOrAdmin ? (
                  <>
                    <IconlyPlay size={15} color="#ffffff" />
                    <span>Vào học ngay</span>
                  </>
                ) : course.price <= 0 ? (
                  'Đăng ký miễn phí ngay'
                ) : (
                  'Đăng ký học ngay'
                )}
              </button>

              <div className="perks-list">
                <h4 className="perks-title">Đặc quyền khóa học bao gồm:</h4>
                <ul>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyTimeCircle size={18} color="#0056d2" />
                    </span>
                    <span>{displayHours} video bài giảng theo lộ trình</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyFolder size={18} color="#0056d2" />
                    </span>
                    <span>Tài nguyên & source code dự án tải về</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyDevice size={18} color="#0056d2" />
                    </span>
                    <span>Học linh hoạt trên cả Điện thoại và Máy tính</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyChat size={18} color="#0056d2" />
                    </span>
                    <span>Diễn đàn thảo luận và trợ giảng giải đáp 24/7</span>
                  </li>
                  <li>
                    <span className="perk-icon-box">
                      <IconlyAward size={18} color="#0056d2" />
                    </span>
                    <span>Chứng chỉ tốt nghiệp xác thực khi hoàn thành</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {course && (
        <AddToPlaylistModal
          courseId={course._id}
          courseTitle={course.title}
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
        />
      )}
    </div>
  );
};
