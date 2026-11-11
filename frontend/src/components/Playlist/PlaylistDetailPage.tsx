import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchPlaylistDetail,
  updatePlaylist,
  deletePlaylist,
  removeCourseFromPlaylist,
  toggleFollowPlaylist,
} from '../../services/playlistApi';
import type { Playlist, PlaylistCourseItem } from '../../types/playlist';
import {
  IconlyFolder,
  IconlyTick,
  IconlyEdit,
  IconlyDelete,
  IconlyClose,
  IconlyArrowUp,
  IconlyArrowDown,
  IconlyHeart,
  IconlyPlay,
  IconlyStar,
  IconlyTimeCircle,
  IconlyUserGroup,
} from '../Onboarding/IconlyIcons';
import { formatVND } from '../../utils/format';
import './PlaylistDetailPage.css';
import './PlaylistsPage.css';

interface PlaylistDetailPageProps {
  playlistId: string;
}

export const PlaylistDetailPage: React.FC<PlaylistDetailPageProps> = ({
  playlistId,
}) => {
  const { isAuthenticated, navigate } = useAuth();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Modal Chỉnh sửa thông tin Playlist
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formIsPublic, setFormIsPublic] = useState<boolean>(true);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Modal Xác nhận xóa Playlist
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  // Tải chi tiết playlist khi mount hoặc đổi id
  useEffect(() => {
    let isMounted = true;
    fetchPlaylistDetail(playlistId)
      .then((res) => {
        if (!isMounted) return;
        if (res.playlist) {
          setPlaylist(res.playlist);
        } else {
          setErrorMsg('Không tìm thấy danh sách phát yêu cầu.');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Lỗi máy chủ khi tải chi tiết playlist',
        );
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  // Hàm reload khi cần rollback
  const reloadDetail = useCallback(async () => {
    try {
      const res = await fetchPlaylistDetail(playlistId);
      if (res.playlist) {
        setPlaylist(res.playlist);
      }
    } catch {
      // Bỏ qua lỗi ngầm
    }
  }, [playlistId]);

  // Tự động tắt Toast thông báo sau 3s
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      setToastMsg('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Tính tổng số giờ học của tất cả khóa học trong playlist
  const totalHours = useMemo(() => {
    if (!playlist?.courses) return 0;
    return playlist.courses.reduce((sum, c) => sum + (c.durationHours || 0), 0);
  }, [playlist]);

  // Theo dõi / Bỏ theo dõi playlist công khai (BR29.3)
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!playlist) return;

    try {
      const res = await toggleFollowPlaylist(playlist._id);
      setToastMsg(res.message);
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              isFollowedByMe: res.isFollowed,
              followerCount: res.followerCount,
            }
          : prev,
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi cập nhật trạng thái theo dõi',
      );
    }
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = () => {
    if (!playlist) return;
    setFormName(playlist.name);
    setFormDesc(playlist.description || '');
    setFormIsPublic(playlist.isPublic);
    setIsEditModalOpen(true);
  };

  // Lưu chỉnh sửa thông tin playlist (BR29.1, BR29.3)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist) return;
    if (!formName.trim()) {
      setErrorMsg('Vui lòng nhập tên danh sách phát');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await updatePlaylist(playlist._id, {
        name: formName.trim(),
        description: formDesc.trim(),
        isPublic: formIsPublic,
      });

      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              name: res.playlist.name,
              description: res.playlist.description,
              isPublic: res.playlist.isPublic,
              updatedAt: res.playlist.updatedAt,
            }
          : prev,
      );

      setIsEditModalOpen(false);
      setToastMsg('Cập nhật thông tin danh sách phát thành công!');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi lưu chỉnh sửa playlist',
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Xác nhận xóa Playlist (Alt flow 5a, 5a1)
  const handleConfirmDelete = async () => {
    if (!playlist) return;
    setDeleteSubmitting(true);
    try {
      const res = await deletePlaylist(playlist._id);
      setToastMsg(res.message);
      // Chuyển hướng về tab Playlist của tôi
      setTimeout(() => {
        navigate('/playlists?tab=my');
      }, 500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi xóa danh sách phát',
      );
      setDeleteSubmitting(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Sắp xếp thứ tự khóa học trong playlist (Basic flow step 5)
  const handleReorderCourse = async (
    index: number,
    direction: 'up' | 'down',
  ) => {
    if (!playlist || !playlist.isOwner || !playlist.courses) return;

    const courses = [...playlist.courses];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= courses.length) return;

    // Hoán đổi vị trí
    const temp = courses[index];
    courses[index] = courses[targetIdx];
    courses[targetIdx] = temp;

    // Cập nhật tạm thời trên UI (optimistic update)
    setPlaylist({
      ...playlist,
      courses,
    });

    try {
      const res = await updatePlaylist(playlist._id, {
        courses: courses.map((c) => c._id),
      });
      setPlaylist(res.playlist);
      setToastMsg('Đã cập nhật thứ tự khóa học');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể lưu thứ tự khóa học mới',
      );
      // Rollback
      reloadDetail();
    }
  };

  // Gỡ khóa học khỏi playlist (Alt flow 5a1)
  const handleRemoveCourse = async (courseId: string) => {
    if (!playlist || !playlist.isOwner) return;

    try {
      const res = await removeCourseFromPlaylist(playlist._id, courseId);
      setToastMsg(res.message);
      setPlaylist(res.playlist);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi gỡ khóa học khỏi playlist',
      );
    }
  };

  // Chia sẻ liên kết playlist
  const handleSharePlaylist = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setToastMsg('Đã sao chép liên kết playlist vào bộ nhớ tạm!');
    }
  };

  // Render thumbnail mosaic cho cover hero
  const renderHeroCover = (courses?: PlaylistCourseItem[]) => {
    if (!courses || courses.length === 0) {
      return (
        <div
          className="playlist-hero-cover"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconlyFolder size={56} color="#475569" />
          <div className="playlist-hero-cover-overlay">
            <span className="playlist-hero-cover-pill">0 khóa học</span>
          </div>
        </div>
      );
    }

    if (courses.length < 4) {
      const mainThumb =
        courses[0]?.thumbnailUrl ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
      return (
        <div className="playlist-hero-cover">
          <img
            src={mainThumb}
            alt={playlist?.name || 'Cover'}
            className="playlist-hero-cover-single"
          />
          <div className="playlist-hero-cover-overlay">
            <span className="playlist-hero-cover-pill">
              <IconlyPlay size={14} color="#ffffff" />
              <span>{courses.length} khóa học</span>
            </span>
          </div>
        </div>
      );
    }

    // 4 khóa học -> hiển thị dạng lưới 2x2 mosaic
    return (
      <div className="playlist-hero-cover">
        <div className="playlist-hero-mosaic">
          {courses.slice(0, 4).map((c, i) => (
            <img
              key={c._id || i}
              src={
                c.thumbnailUrl ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'
              }
              alt=""
            />
          ))}
        </div>
        <div className="playlist-hero-cover-overlay">
          <span className="playlist-hero-cover-pill">
            <IconlyPlay size={14} color="#ffffff" />
            <span>{courses.length} khóa học</span>
          </span>
        </div>
      </div>
    );
  };

  // Trạng thái Loading
  if (loading) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-container">
          <div className="playlist-detail-loading">
            <div className="playlist-spinner" />
            <p>Đang tải thông tin danh sách phát...</p>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái Lỗi / Không tìm thấy
  if (!playlist || errorMsg) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-container">
          <div className="playlist-empty-box">
            <IconlyFolder size={52} color="#94a3b8" />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
              Không thể tải danh sách phát
            </h3>
            <p>{errorMsg || 'Danh sách phát không tồn tại hoặc đã bị xóa.'}</p>
            <button
              type="button"
              className="btn-playlist-primary"
              onClick={() => navigate('/playlists')}
            >
              Quay lại danh sách phát
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist-detail-page">
      <div className="playlist-detail-container">
        {/* =========================================================================
            1. BREADCRUMBS & TOP NAV
           ========================================================================= */}
        <div className="playlist-detail-topbar">
          <button
            type="button"
            className="playlist-back-btn"
            onClick={() => navigate('/playlists')}
          >
            ← Quay lại danh sách phát
          </button>

          <nav className="playlist-breadcrumbs" aria-label="Breadcrumb">
            <span className="clickable" onClick={() => navigate('/')}>
              Trang chủ
            </span>
            <span className="crumb-separator">/</span>
            <span className="clickable" onClick={() => navigate('/playlists')}>
              Danh sách phát
            </span>
            <span className="crumb-separator">/</span>
            <span className="crumb-current" title={playlist.name}>
              {playlist.name}
            </span>
          </nav>
        </div>

        {/* =========================================================================
            2. HERO BANNER CARD
           ========================================================================= */}
        <div className="playlist-hero-card">
          {/* Cover Mosaic bên trái */}
          {renderHeroCover(playlist.courses)}

          {/* Nội dung thông tin chi tiết bên phải */}
          <div className="playlist-hero-content">
            <div className="playlist-hero-badges">
              <span
                className={`playlist-pill-visibility ${
                  playlist.isPublic ? 'public' : 'private'
                }`}
              >
                {playlist.isPublic ? 'Công khai' : 'Riêng tư'}
              </span>

              {playlist.isOwner && (
                <span className="playlist-pill-owner">👑 Playlist của bạn</span>
              )}
            </div>

            <h1 className="playlist-hero-title">{playlist.name}</h1>

            <p className="playlist-hero-desc">
              {playlist.description ||
                'Chưa có mô tả chi tiết cho danh sách phát này.'}
            </p>

            {/* Thông tin tác giả tạo playlist */}
            <div className="playlist-hero-author">
              <img
                src={
                  playlist.userId?.avatarUrl ||
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                    playlist.userId?.email || 'author',
                  )}`
                }
                alt={playlist.userId?.fullName || 'Tác giả'}
                className="playlist-hero-author-avatar"
              />
              <div className="playlist-hero-author-info">
                <span className="playlist-hero-author-name">
                  {playlist.userId?.fullName || 'Người dùng Purrfect'}
                </span>
                <span className="playlist-hero-author-role">
                  {playlist.userId?.role === 'INSTRUCTOR'
                    ? 'Giảng viên Purrfect'
                    : playlist.userId?.role === 'ADMIN'
                      ? 'Quản trị viên hệ thống'
                      : 'Học viên'}
                </span>
              </div>
            </div>

            {/* Thanh thông số cốt lõi */}
            <div className="playlist-hero-stats">
              <div className="playlist-hero-stat-item">
                <IconlyPlay size={16} color="#0056d2" />
                <span>
                  <strong>{playlist.courses?.length || 0}</strong> khóa học
                </span>
              </div>

              {totalHours > 0 && (
                <div className="playlist-hero-stat-item">
                  <IconlyTimeCircle size={16} color="#059669" />
                  <span>
                    <strong>{totalHours}</strong> giờ học tổng cộng
                  </span>
                </div>
              )}

              <div className="playlist-hero-stat-item">
                <IconlyHeart size={16} color="#ef4444" />
                <span>
                  <strong>{playlist.followerCount || 0}</strong> người theo dõi
                </span>
              </div>

              <div className="playlist-hero-stat-item">
                <span>
                  Cập nhật:{' '}
                  {new Date(playlist.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Thanh nút hành động */}
            <div className="playlist-hero-actions">
              {!playlist.isOwner ? (
                <>
                  <button
                    type="button"
                    className={`btn-playlist-follow ${
                      playlist.isFollowedByMe ? 'following' : ''
                    }`}
                    onClick={handleToggleFollow}
                  >
                    <IconlyHeart
                      size={16}
                      color={playlist.isFollowedByMe ? '#166534' : '#0056d2'}
                    />
                    <span>
                      {playlist.isFollowedByMe
                        ? 'Đang theo dõi'
                        : 'Theo dõi playlist này'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="btn-playlist-secondary"
                    onClick={handleSharePlaylist}
                    title="Sao chép liên kết"
                  >
                    <span>Chia sẻ playlist</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-playlist-primary"
                    onClick={handleOpenEditModal}
                  >
                    <IconlyEdit size={16} color="#ffffff" />
                    <span>Chỉnh sửa thông tin</span>
                  </button>

                  <button
                    type="button"
                    className="btn-playlist-danger"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <IconlyDelete size={16} color="#e11d48" />
                    <span>Xóa playlist</span>
                  </button>

                  <button
                    type="button"
                    className="btn-playlist-secondary"
                    onClick={handleSharePlaylist}
                  >
                    <span>Chia sẻ</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. DANH SÁCH KHÓA HỌC TRONG PLAYLIST
           ========================================================================= */}
        <section className="playlist-content-section">
          <div className="playlist-content-header">
            <h2 className="playlist-content-title">
              Nội dung các khóa học trong lộ trình
            </h2>
            <span className="playlist-content-count-pill">
              {playlist.courses?.length || 0} khóa học
            </span>
          </div>

          {/* Bảng thông báo quyền hạn người học */}
          {!playlist.isOwner ? (
            <div className="playlist-role-notice info">
              <span>
                💡 <strong>Gợi ý:</strong> Bạn đang xem playlist công khai của
                tác giả{' '}
                <strong>{playlist.userId?.fullName || 'Cộng đồng'}</strong>.
                Nhấn "Theo dõi" để lưu lại vào mục cá nhân và thuận tiện học tập
                theo lộ trình chuẩn.
              </span>
            </div>
          ) : (
            <div className="playlist-role-notice owner">
              <span>
                ⚡ <strong>Quyền quản lý:</strong> Bạn có thể sử dụng các nút
                mũi tên (↑ / ↓) để sắp xếp lại thứ tự ưu tiên học tập hoặc biểu
                tượng thùng rác để gỡ bớt khóa học.
              </span>
            </div>
          )}

          {/* Danh sách các khóa học */}
          <div className="playlist-courses-stack">
            {!playlist.courses || playlist.courses.length === 0 ? (
              <div className="playlist-empty-box">
                <IconlyFolder size={44} color="#94a3b8" />
                <h4
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#0f172a',
                    margin: 0,
                  }}
                >
                  Chưa có khóa học nào trong danh sách phát này
                </h4>
                <p>
                  Duyệt qua danh mục khóa học của Purrfect và nhấn "Lưu vào
                  Playlist" để bắt đầu xây dựng lộ trình học tập của riêng bạn.
                </p>
                <button
                  type="button"
                  className="btn-playlist-primary"
                  onClick={() => navigate('/')}
                >
                  Khám phá các khóa học ngay
                </button>
              </div>
            ) : (
              playlist.courses.map((course, idx) => (
                <div key={course._id || idx} className="playlist-course-card">
                  {/* Số thứ tự */}
                  <span className="playlist-course-index">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Thumbnail */}
                  <div
                    className="playlist-course-thumb-box"
                    onClick={() => navigate(`/courses/${course.slug}`)}
                  >
                    <img
                      src={
                        course.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'
                      }
                      alt={course.title}
                    />
                  </div>

                  {/* Thông tin khóa học */}
                  <div className="playlist-course-details">
                    <h3
                      className="playlist-course-heading"
                      onClick={() => navigate(`/courses/${course.slug}`)}
                      title={course.title}
                    >
                      {course.title}
                    </h3>

                    <div className="playlist-course-meta-tags">
                      {course.durationHours && (
                        <span className="playlist-course-meta-chip">
                          <IconlyTimeCircle size={14} color="#64748b" />
                          <span>{course.durationHours}h học</span>
                        </span>
                      )}

                      {course.level && (
                        <span className="playlist-course-meta-chip">
                          <span>Trình độ: {course.level}</span>
                        </span>
                      )}

                      {course.averageRating !== undefined && (
                        <span className="playlist-course-meta-chip">
                          <IconlyStar size={14} color="#f59e0b" />
                          <span>{course.averageRating.toFixed(1)}</span>
                        </span>
                      )}

                      {course.totalStudents !== undefined && (
                        <span className="playlist-course-meta-chip">
                          <IconlyUserGroup size={14} color="#64748b" />
                          <span>
                            {course.totalStudents.toLocaleString('vi-VN')} học
                            viên
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="playlist-course-price-tag">
                      {course.price <= 0 ? 'Miễn phí' : formatVND(course.price)}
                    </div>
                  </div>

                  {/* Nhóm nút hành động */}
                  <div className="playlist-course-action-group">
                    <button
                      type="button"
                      className="btn-course-enroll"
                      onClick={() => navigate(`/courses/${course.slug}`)}
                    >
                      Vào học
                    </button>

                    {/* Dành cho chủ sở hữu: Sắp xếp thứ tự & Gỡ bỏ */}
                    {playlist.isOwner && (
                      <>
                        <button
                          type="button"
                          className="btn-reorder-icon"
                          title="Di chuyển lên trên"
                          disabled={idx === 0}
                          onClick={() => handleReorderCourse(idx, 'up')}
                        >
                          <IconlyArrowUp size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-reorder-icon"
                          title="Di chuyển xuống dưới"
                          disabled={idx === playlist.courses.length - 1}
                          onClick={() => handleReorderCourse(idx, 'down')}
                        >
                          <IconlyArrowDown size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-remove-course-icon"
                          title="Gỡ khỏi danh sách phát"
                          onClick={() => handleRemoveCourse(course._id)}
                        >
                          <IconlyDelete size={15} color="#ef4444" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* =========================================================================
          MODAL CHỈNH SỬA THÔNG TIN PLAYLIST
         ========================================================================= */}
      {isEditModalOpen && (
        <div
          className="playlist-modal-backdrop"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="playlist-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="playlist-modal-header">
              <div className="playlist-modal-header-info">
                <h3 className="playlist-modal-title">
                  Chỉnh sửa danh sách phát
                </h3>
                <p className="playlist-modal-subtitle">
                  Cập nhật tên gọi, mô tả và chế độ hiển thị cho playlist của
                  bạn
                </p>
              </div>
              <button
                type="button"
                className="playlist-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Đóng"
              >
                <IconlyClose size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="playlist-modal-body">
                <div className="playlist-form-group">
                  <label
                    htmlFor="editPlaylistName"
                    className="playlist-form-label"
                  >
                    Tên danh sách phát{' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="editPlaylistName"
                    type="text"
                    className="playlist-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ví dụ: Lộ trình Frontend React Pro..."
                    maxLength={100}
                    required
                    autoFocus
                  />
                </div>

                <div className="playlist-form-group">
                  <label
                    htmlFor="editPlaylistDesc"
                    className="playlist-form-label"
                  >
                    Mô tả danh sách phát (tùy chọn)
                  </label>
                  <textarea
                    id="editPlaylistDesc"
                    className="playlist-textarea"
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Mô tả mục tiêu học tập hoặc lộ trình chi tiết..."
                    maxLength={500}
                  />
                </div>

                <div className="playlist-form-group">
                  <label className="playlist-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formIsPublic}
                      onChange={(e) => setFormIsPublic(e.target.checked)}
                    />
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a' }}>
                        Cho phép công khai danh sách phát
                      </strong>
                      <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                        Những người học khác có thể tìm kiếm, tham khảo và theo
                        dõi playlist này của bạn.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="playlist-modal-footer">
                <button
                  type="button"
                  className="playlist-btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="playlist-btn-primary"
                  disabled={formSubmitting || !formName.trim()}
                >
                  {formSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XÁC NHẬN XÓA PLAYLIST
         ========================================================================= */}
      {deleteConfirmOpen && (
        <div
          className="playlist-modal-backdrop"
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            className="playlist-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="playlist-modal-header">
              <h3 className="playlist-modal-title" style={{ color: '#ef4444' }}>
                Xác nhận xóa danh sách phát
              </h3>
              <button
                type="button"
                className="playlist-modal-close-btn"
                onClick={() => setDeleteConfirmOpen(false)}
                aria-label="Đóng"
              >
                <IconlyClose size={18} />
              </button>
            </div>

            <div className="playlist-modal-body">
              <p
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Bạn có chắc chắn muốn xóa danh sách phát{' '}
                <strong>"{playlist.name}"</strong> không? Thao tác này sẽ gỡ bỏ
                danh sách vĩnh viễn và không thể khôi phục lại.
              </p>
            </div>

            <div className="playlist-modal-footer">
              <button
                type="button"
                className="playlist-btn-secondary"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteSubmitting}
              >
                Giữ lại
              </button>
              <button
                type="button"
                className="playlist-btn-primary"
                style={{ backgroundColor: '#ef4444' }}
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOAST FEEDBACK THÔNG BÁO
         ========================================================================= */}
      {toastMsg && (
        <div className="playlist-toast">
          <IconlyTick size={18} color="#22c55e" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
