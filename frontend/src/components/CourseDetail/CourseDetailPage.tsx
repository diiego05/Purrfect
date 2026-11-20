import { useEffect, useState, useCallback, type FC } from 'react';
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
import { reviewApi } from '../../services/reviewApi';
import type { CourseReviewItem, ReviewStats } from '../../types/review';
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
  IconlyEdit,
  IconlyDelete,
} from '../Onboarding/IconlyIcons';
import './CourseDetailPage.css';
import { AddToPlaylistModal } from '../Playlist/AddToPlaylistModal';

interface CourseDetailPageProps {
  slug: string;
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
  const [actionMessage, setActionMessage] = useState<string>('');

  // Đánh giá & Phản hồi (UC23)
  const [reviews, setReviews] = useState<CourseReviewItem[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const [reviewToastMsg, setReviewToastMsg] = useState<string>('');

  // Giảng viên / Admin phản hồi trực tiếp (UC23)
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [replyError, setReplyError] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // Giảng viên / Admin sửa phản hồi (Alternative Flow 4a1)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState<string>('');
  const [editReplyError, setEditReplyError] = useState<string>('');
  const [submittingEditReply, setSubmittingEditReply] = useState<boolean>(false);

  // Học viên gửi đánh giá mới
  const [showWriteReview, setShowWriteReview] = useState<boolean>(false);
  const [studentRating, setStudentRating] = useState<number>(5);
  const [studentComment, setStudentComment] = useState<string>('');
  const [studentReviewError, setStudentReviewError] = useState<string>('');
  const [submittingStudentReview, setSubmittingStudentReview] = useState<boolean>(false);

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

  // Tải danh sách đánh giá từ API (UC23)
  const loadReviews = useCallback(() => {
    if (!course?._id) return;
    reviewApi
      .getCourseReviews(course._id)
      .then((res) => {
        if (res.success && res.data) {
          setReviews(res.data.reviews || []);
          setReviewStats(res.data.stats);
          if (res.data.userMeta?.isEnrolled) {
            setIsEnrolled(true);
          }
          if (res.data.userMeta?.myReview) {
            setStudentRating(res.data.userMeta.myReview.rating);
            setStudentComment(res.data.userMeta.myReview.comment);
          }
        }
        setReviewsLoading(false);
      })
      .catch((err) => {
        console.error('[CourseDetailPage] Error loading reviews:', err);
        setReviewsLoading(false);
      });
  }, [course]);

  useEffect(() => {
    if (!course?._id || (activeTab !== 'reviews' && !isEnrolled)) return;
    let isMounted = true;
    reviewApi
      .getCourseReviews(course._id)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setReviews(res.data.reviews || []);
          setReviewStats(res.data.stats);
          if (res.data.userMeta?.isEnrolled) {
            setIsEnrolled(true);
          }
          if (res.data.userMeta?.myReview) {
            setStudentRating(res.data.userMeta.myReview.rating);
            setStudentComment(res.data.userMeta.myReview.comment);
          }
        }
        setReviewsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[CourseDetailPage] Error loading reviews:', err);
        setReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [course, activeTab, isEnrolled]);

  // Giảng viên / Admin gửi phản hồi trực tiếp (UC23 Basic Flow 4)
  const handleSendReply = async (reviewId: string) => {
    setReplyError('');
    const trimmed = replyContent.trim();
    // Exception Flow 4b
    if (!trimmed) {
      setReplyError('Nội dung phản hồi không được để trống');
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await reviewApi.replyToReview(reviewId, trimmed);
      if (res.success) {
        setReviewToastMsg('Phản hồi đánh giá thành công!');
        setReplyingReviewId(null);
        setReplyContent('');
        loadReviews();
      } else {
        setReplyError(res.message || 'Không thể gửi phản hồi.');
      }
    } catch (err) {
      console.error('[CourseDetailPage] Error replying:', err);
      setReplyError('Lỗi kết nối khi gửi phản hồi.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Giảng viên / Admin chỉnh sửa phản hồi (Alternative Flow 4a1)
  const handleSaveEditReply = async (reviewId: string) => {
    setEditReplyError('');
    const trimmed = editReplyContent.trim();
    if (!trimmed) {
      setEditReplyError('Nội dung phản hồi không được để trống');
      return;
    }
    setSubmittingEditReply(true);
    try {
      const res = await reviewApi.updateReviewReply(reviewId, trimmed);
      if (res.success) {
        setReviewToastMsg('Cập nhật phản hồi thành công!');
        setEditingReviewId(null);
        setEditReplyContent('');
        loadReviews();
      } else {
        setEditReplyError(res.message || 'Không thể cập nhật phản hồi.');
      }
    } catch (err) {
      console.error('[CourseDetailPage] Error updating reply:', err);
      setEditReplyError('Lỗi kết nối khi cập nhật.');
    } finally {
      setSubmittingEditReply(false);
    }
  };

  // Giảng viên / Admin xóa phản hồi (Alternative Flow 4a2)
  const handleDeleteReply = async (reviewId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này không?')) return;
    try {
      const res = await reviewApi.deleteReviewReply(reviewId);
      if (res.success) {
        setReviewToastMsg('Đã xóa phản hồi đánh giá.');
        loadReviews();
      } else {
        alert(res.message || 'Không thể xóa phản hồi.');
      }
    } catch (err) {
      console.error('[CourseDetailPage] Error deleting reply:', err);
      alert('Lỗi kết nối khi xóa phản hồi.');
    }
  };

  // Học viên gửi đánh giá
  const handleSubmitStudentReview = async () => {
    if (!course?._id) return;
    setStudentReviewError('');
    const trimmed = studentComment.trim();
    if (!trimmed) {
      setStudentReviewError('Nội dung nhận xét không được để trống.');
      return;
    }
    setSubmittingStudentReview(true);
    try {
      const res = await reviewApi.submitCourseReview(course._id, studentRating, trimmed);
      if (res.success) {
        setReviewToastMsg('Gửi nhận xét đánh giá thành công!');
        setShowWriteReview(false);
        loadReviews();
      } else {
        setStudentReviewError(res.message || 'Không thể gửi đánh giá.');
      }
    } catch (err) {
      console.error('[CourseDetailPage] Error submitting review:', err);
      setStudentReviewError('Lỗi kết nối khi gửi đánh giá.');
    } finally {
      setSubmittingStudentReview(false);
    }
  };

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

  const totalModules = normalizedSections.length;
  const totalLecturesCount = normalizedSections.reduce(
    (sum, sec) =>
      sum + (sec.lectures.length > 0 ? sec.lectures.length : sec.lessons),
    0,
  );

  const canAccessLecture = (lecture: CourseLecture, bypassLock = false) =>
    Boolean(bypassLock || isEnrolled || isOwnerOrAdmin || lecture.isPreview);

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
    // Chuyển sang trang phòng học chuyên biệt
    navigate(
      `/learning/${course.slug || course._id}?s=${sectionIndex}&l=${lectureIndex}`,
    );
  };

  const handleStartLearning = (bypassLock = false) => {
    if (!course) return;
    for (let sIdx = 0; sIdx < normalizedSections.length; sIdx += 1) {
      const lectures = normalizedSections[sIdx].lectures;
      if (lectures && lectures.length > 0) {
        openLecturePlayer(sIdx, 0, lectures[0], bypassLock);
        return;
      }
    }

    navigate(`/learning/${course.slug || course._id}`);
  };

  const handlePreviewCourse = () => {
    if (!course) return;
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
    ? (course.skillIds as Array<SkillItem | string | null>)
        .filter((s): s is SkillItem | string => Boolean(s))
        .map((s) => (typeof s === 'object' && s.name ? s.name : String(s)))
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
                  ) : (course.price ?? 0) <= 0 ? (
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
                                    return (
                                      <li
                                        key={lIdx}
                                        className={`clickable-lesson ${!unlocked ? 'locked-lesson' : ''}`}
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
                                            {unlocked ? (
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
                                              Vào học
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
                            {(course.totalStudents ?? 0).toLocaleString(
                              'vi-VN',
                            )}
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

          {/* Tab 4: Đánh giá & Phản hồi (UC23) */}
          {activeTab === 'reviews' && (
            <div className="tab-pane-fade">
              <section className="detail-section-card">
                <div className="reviews-tab-top-row">
                  <h2 className="section-heading">
                    Đánh giá & Phản hồi từ học viên
                  </h2>
                  {isEnrolled && !showWriteReview && (
                    <button
                      type="button"
                      className="btn-write-review-toggle"
                      onClick={() => setShowWriteReview(true)}
                    >
                      <IconlyStar size={16} color="currentColor" />
                      <span>{reviewStats && reviewStats.totalReviews > 0 ? 'Viết hoặc sửa nhận xét' : 'Viết đánh giá đầu tiên'}</span>
                    </button>
                  )}
                </div>

                {reviewToastMsg && (
                  <div className="course-action-notice">
                    <span>{reviewToastMsg}</span>
                    <button
                      type="button"
                      className="btn-dismiss-notice"
                      onClick={() => setReviewToastMsg('')}
                      aria-label="Đóng"
                    >
                      <IconlyClose size={15} color="currentColor" />
                    </button>
                  </div>
                )}

                {/* Khối Thống kê điểm số & Phân bố sao */}
                <div className="reviews-summary-box">
                  <div className="review-big-score">
                    <span className="big-number">
                      {reviewStats ? reviewStats.averageRating.toFixed(1) : ratingNum}
                    </span>
                    <div className="stars-gold-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <IconlyStar key={s} size={20} color="#f59e0b" />
                      ))}
                    </div>
                    <span className="score-desc">
                      {reviewStats ? reviewStats.totalReviews : ratingCount} đánh giá từ học viên
                    </span>
                  </div>
                  <div className="review-bars-col">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const pct = reviewStats?.starPercentages
                        ? reviewStats.starPercentages[star] || 0
                        : star === 5
                          ? 88
                          : star === 4
                            ? 9
                            : star === 3
                              ? 2
                              : star === 2
                                ? 1
                                : 0;
                      return (
                        <div key={star} className="review-bar-line">
                          <span className="bar-label">{star} sao</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="bar-pct">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Viết đánh giá của Học viên đã ghi danh */}
                {isEnrolled && showWriteReview && (
                  <div className="student-write-review-panel">
                    <h3 className="write-review-heading">Đánh giá của bạn về khóa học</h3>
                    <div className="rating-select-row">
                      <span className="rating-label">Mức độ hài lòng:</span>
                      <div className="star-picker-group">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-pick-btn ${star <= studentRating ? 'active' : ''}`}
                            onClick={() => setStudentRating(star)}
                            title={`${star} sao`}
                          >
                            <IconlyStar
                              size={24}
                              color={star <= studentRating ? '#f59e0b' : '#cbd5e1'}
                            />
                          </button>
                        ))}
                        <span className="star-rating-text-hint">
                          {studentRating === 5 && 'Tuyệt vời, vượt mong đợi!'}
                          {studentRating === 4 && 'Rất tốt, nội dung hữu ích'}
                          {studentRating === 3 && 'Bình thường, tạm ổn'}
                          {studentRating === 2 && 'Cần cải thiện nhiều'}
                          {studentRating === 1 && 'Chưa hài lòng'}
                        </span>
                      </div>
                    </div>

                    <textarea
                      className="student-review-textarea"
                      placeholder="Chia sẻ cảm nhận chi tiết của bạn về giảng viên, nội dung bài giảng và bài tập..."
                      value={studentComment}
                      onChange={(e) => setStudentComment(e.target.value)}
                    />
                    {studentReviewError && (
                      <div className="reply-error-msg">{studentReviewError}</div>
                    )}

                    <div className="write-review-actions">
                      <button
                        type="button"
                        className="btn-cancel-reply"
                        onClick={() => setShowWriteReview(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        className="btn-send-reply"
                        disabled={submittingStudentReview}
                        onClick={handleSubmitStudentReview}
                      >
                        {submittingStudentReview ? 'Đang gửi...' : 'Gửi nhận xét'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Danh sách các Đánh giá & Phản hồi (UC23) */}
                <div className="course-reviews-container">
                  {reviewsLoading ? (
                    <div className="reviews-loading-state">
                      <p>Đang tải danh sách đánh giá...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="reviews-empty-state-detail">
                      <IconlyStar size={36} color="#94a3b8" />
                      <p className="empty-title">Chưa có đánh giá nào</p>
                      <p className="empty-sub">
                        {isEnrolled
                          ? 'Hãy là người đầu tiên chia sẻ cảm nhận về khóa học này!'
                          : 'Hãy đăng ký học để trải nghiệm và gửi đánh giá đầu tiên.'}
                      </p>
                    </div>
                  ) : (
                    <div className="reviews-items-feed">
                      {reviews.map((rev) => {
                        const hasReply = Boolean(rev.instructorReply);
                        const studentAvatar =
                          rev.userId?.avatarUrl ||
                          rev.userId?.avatar ||
                          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                            rev.userId?.email || 'student',
                          )}`;
                        const studentName =
                          rev.userId?.fullName || rev.userId?.name || rev.userId?.email || 'Học viên';
                        const revDate = rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '';

                        return (
                          <div key={rev._id} className="course-review-feed-item">
                            {/* Header của nhận xét */}
                            <div className="review-feed-author-row">
                              <img
                                src={studentAvatar}
                                alt={studentName}
                                className="review-author-avatar"
                              />
                              <div className="review-author-info">
                                <span className="review-author-name">{studentName}</span>
                                <div className="review-author-stars-date">
                                  <div className="stars-mini-row">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <IconlyStar
                                        key={s}
                                        size={14}
                                        color={s <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                                      />
                                    ))}
                                  </div>
                                  <span className="review-feed-date">{revDate}</span>
                                </div>
                              </div>
                            </div>

                            {/* Nội dung nhận xét của học viên */}
                            <p className="review-feed-comment-text">{rev.comment}</p>

                            {/* Phản hồi chính thức của Giảng viên / Quản trị viên (UC23) */}
                            {hasReply && (
                              <div
                                className={`review-official-reply-card ${
                                  rev.replyRole === 'ADMIN' ? 'admin' : 'instructor'
                                }`}
                              >
                                <div className="reply-card-header">
                                  <div className="reply-author-meta">
                                    <img
                                      src={
                                        rev.repliedBy?.avatarUrl ||
                                        rev.repliedBy?.avatar ||
                                        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                                          rev.repliedBy?.email || 'instructor',
                                        )}`
                                      }
                                      alt="Replier Avatar"
                                      className="reply-avatar-img"
                                    />
                                    <span className="reply-author-name">
                                      {rev.repliedBy?.fullName ||
                                        rev.repliedBy?.email ||
                                        (rev.replyRole === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên')}
                                    </span>
                                    {/* ROLE BADGE HIỂN THỊ RÕ RÀNG THEO YÊU CẦU */}
                                    <span
                                      className={`review-role-badge ${
                                        rev.replyRole === 'ADMIN' ? 'admin' : 'instructor'
                                      }`}
                                    >
                                      {rev.replyRole === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}
                                    </span>
                                  </div>

                                  <div className="reply-actions-row">
                                    <span className="reply-card-date">
                                      {rev.repliedAt
                                        ? new Date(rev.repliedAt).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })
                                        : ''}
                                    </span>
                                    {/* Alternative Flow 4a: Sửa & Xóa (Chỉ cho chủ khóa học hoặc admin) */}
                                    {isOwnerOrAdmin && (
                                      <div className="reply-mgmt-buttons">
                                        <button
                                          type="button"
                                          className="btn-reply-action"
                                          onClick={() => {
                                            setEditingReviewId(rev._id);
                                            setEditReplyContent(rev.instructorReply || '');
                                            setEditReplyError('');
                                            setReplyingReviewId(null);
                                          }}
                                          title="Chỉnh sửa câu trả lời"
                                        >
                                          <IconlyEdit size={14} color="currentColor" />
                                          <span>Sửa</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-reply-action danger"
                                          onClick={() => handleDeleteReply(rev._id)}
                                          title="Xóa câu trả lời"
                                        >
                                          <IconlyDelete size={14} color="currentColor" />
                                          <span>Xóa</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Form Chỉnh sửa hoặc Hiển thị nội dung phản hồi */}
                                {editingReviewId === rev._id ? (
                                  <div className="reply-edit-box">
                                    <textarea
                                      className="reply-textarea-field"
                                      value={editReplyContent}
                                      onChange={(e) => setEditReplyContent(e.target.value)}
                                      placeholder="Chỉnh sửa nội dung phản hồi..."
                                    />
                                    {editReplyError && (
                                      <div className="reply-error-msg">{editReplyError}</div>
                                    )}
                                    <div className="reply-composer-footer">
                                      <button
                                        type="button"
                                        className="btn-cancel-reply"
                                        onClick={() => {
                                          setEditingReviewId(null);
                                          setEditReplyError('');
                                        }}
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-send-reply"
                                        disabled={submittingEditReply}
                                        onClick={() => handleSaveEditReply(rev._id)}
                                      >
                                        {submittingEditReply ? 'Đang lưu...' : 'Lưu thay đổi'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="reply-card-body">{rev.instructorReply}</p>
                                )}
                              </div>
                            )}

                            {/* Nếu chưa phản hồi và người dùng là Giảng viên sở hữu hoặc Admin -> Cho phép phản hồi */}
                            {!hasReply && isOwnerOrAdmin && (
                              <div className="course-reply-trigger-zone">
                                {replyingReviewId === rev._id ? (
                                  <div className="inline-reply-composer">
                                    <div className="composer-header">
                                      <span>
                                        Phản hồi nhận xét của <strong>{studentName}</strong>:
                                      </span>
                                      <span
                                        className={`review-role-badge ${
                                          user?.role === 'ADMIN' ? 'admin' : 'instructor'
                                        }`}
                                      >
                                        {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Giảng viên'}
                                      </span>
                                    </div>

                                    <textarea
                                      className="reply-textarea-field"
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="Nhập lời cảm ơn hoặc giải đáp thắc mắc của học viên..."
                                      autoFocus
                                    />
                                    {/* Exception Flow 4b: Thông báo lỗi khi nội dung rỗng */}
                                    {replyError && (
                                      <div className="reply-error-msg">{replyError}</div>
                                    )}

                                    <div className="reply-composer-footer">
                                      <button
                                        type="button"
                                        className="btn-cancel-reply"
                                        onClick={() => {
                                          setReplyingReviewId(null);
                                          setReplyError('');
                                        }}
                                      >
                                        Hủy bỏ
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-send-reply"
                                        disabled={submittingReply}
                                        onClick={() => handleSendReply(rev._id)}
                                      >
                                        <IconlyTick size={16} color="currentColor" />
                                        <span>{submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-open-reply"
                                    onClick={() => {
                                      setReplyingReviewId(rev._id);
                                      setReplyContent('');
                                      setReplyError('');
                                      setEditingReviewId(null);
                                    }}
                                  >
                                    <IconlyChat size={16} color="currentColor" />
                                    <span>Phản hồi nhận xét này</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                const basePrice = course.price ?? 0;
                const hasDiscount = Boolean(
                  course.discountPrice &&
                  course.discountPrice > 0 &&
                  course.discountPrice < basePrice,
                );
                const currentPriceVal = hasDiscount
                  ? (course.discountPrice as number)
                  : basePrice;
                const originalPriceVal = hasDiscount ? basePrice : null;

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
                ) : (course.price ?? 0) <= 0 ? (
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

      {course && (course._id || course.id) && (
        <AddToPlaylistModal
          courseId={course._id || course.id || ''}
          courseTitle={course.title}
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
        />
      )}
    </div>
  );
};
