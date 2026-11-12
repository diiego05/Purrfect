import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchPublicPlaylists,
  fetchMyPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  toggleFollowPlaylist,
} from '../../services/playlistApi';
import type { Playlist, PlaylistCourseItem } from '../../types/playlist';
import {
  IconlyFolder,
  IconlySearch,
  IconlyPlus,
  IconlyTick,
  IconlyEdit,
  IconlyDelete,
  IconlyClose,
  IconlyHeart,
  IconlyPlay,
  IconlyArrowLeft,
} from '../Onboarding/IconlyIcons';
import './PlaylistsPage.css';

export const PlaylistsPage: React.FC = () => {
  const { isAuthenticated, navigate } = useAuth();

  // Active Tab: 'public' | 'my'
  const [activeTab, setActiveTab] = useState<'public' | 'my'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'my' ? 'my' : 'public';
  });

  // Subtab trong "Playlist của tôi": 'created' | 'followed'
  const [mySubtab, setMySubtab] = useState<'created' | 'followed'>('created');

  // Dữ liệu
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
  const [myCreatedPlaylists, setMyCreatedPlaylists] = useState<Playlist[]>([]);
  const [myFollowedPlaylists, setMyFollowedPlaylists] = useState<Playlist[]>(
    [],
  );
  const [limits, setLimits] = useState<{
    maxPlaylists: number;
    maxCoursesPerPlaylist: number;
  }>({ maxPlaylists: 15, maxCoursesPerPlaylist: 30 });

  // Trạng thái tìm kiếm & loading
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string>('');

  // Chế độ Tạo mới / Chỉnh sửa Playlist (Dạng trang view chuyên biệt, không popup modal)
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState<boolean>(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formIsPublic, setFormIsPublic] = useState<boolean>(true);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Modal xác nhận xóa
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Tải danh sách playlist công khai
  const loadPublicPlaylists = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchPublicPlaylists(searchQuery);
      setPublicPlaylists(res.playlists || []);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải danh sách playlist công khai',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải danh sách playlist cá nhân
  const loadMyPlaylists = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchMyPlaylists();
      setMyCreatedPlaylists(res.created || []);
      setMyFollowedPlaylists(res.followed || []);
      if (res.limits) setLimits(res.limits);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi tải playlist cá nhân',
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'public') {
      fetchPublicPlaylists(searchKeyword)
        .then((res) => {
          if (isMounted) {
            setPublicPlaylists(res.playlists || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setErrorMsg(
              err instanceof Error
                ? err.message
                : 'Lỗi khi tải danh sách playlist công khai',
            );
            setLoading(false);
          }
        });
    } else if (isAuthenticated) {
      fetchMyPlaylists()
        .then((res) => {
          if (isMounted) {
            setMyCreatedPlaylists(res.created || []);
            setMyFollowedPlaylists(res.followed || []);
            if (res.limits) setLimits(res.limits);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setErrorMsg(
              err instanceof Error
                ? err.message
                : 'Lỗi khi tải playlist cá nhân',
            );
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, isAuthenticated, searchKeyword]);

  // Toast tự tắt sau 4s
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(''), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Xử lý Tìm kiếm
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'public') {
      loadPublicPlaylists(searchKeyword);
    }
  };

  // Lọc playlist theo tìm kiếm ở tab My Playlists
  const filteredMyCreated = useMemo(() => {
    if (!searchKeyword.trim()) return myCreatedPlaylists;
    const kw = searchKeyword.toLowerCase().trim();
    return myCreatedPlaylists.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw)),
    );
  }, [myCreatedPlaylists, searchKeyword]);

  const filteredMyFollowed = useMemo(() => {
    if (!searchKeyword.trim()) return myFollowedPlaylists;
    const kw = searchKeyword.toLowerCase().trim();
    return myFollowedPlaylists.filter(
      (p) =>
        p.name.toLowerCase().includes(kw) ||
        (p.description && p.description.toLowerCase().includes(kw)),
    );
  }, [myFollowedPlaylists, searchKeyword]);

  // Xử lý Theo dõi / Bỏ theo dõi Playlist công khai
  const handleToggleFollow = async (playlist: Playlist) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await toggleFollowPlaylist(playlist._id);
      setToastMsg(res.message);

      // Cập nhật UI Public
      setPublicPlaylists((prev) =>
        prev.map((p) =>
          p._id === playlist._id
            ? {
                ...p,
                isFollowedByMe: res.isFollowed,
                followerCount: res.followerCount,
              }
            : p,
        ),
      );

      // Tải lại My playlists nếu đang ở tab My
      if (activeTab === 'my') {
        loadMyPlaylists();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi cập nhật theo dõi playlist',
      );
    }
  };

  // Mở trang tạo playlist mới (Không popup)
  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setEditingPlaylist(null);
    setFormName('');
    setFormDesc('');
    setFormIsPublic(true);
    setIsCreatingPlaylist(true);
  };

  // Mở chỉnh sửa playlist (Không popup)
  const handleOpenEditModal = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormName(playlist.name);
    setFormDesc(playlist.description || '');
    setFormIsPublic(playlist.isPublic);
    setIsCreatingPlaylist(false);
  };

  // Lưu tạo / sửa playlist
  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Tên playlist không được để trống');
      return;
    }

    setFormSubmitting(true);
    setErrorMsg('');
    try {
      if (editingPlaylist) {
        // Cập nhật
        const res = await updatePlaylist(editingPlaylist._id, {
          name: formName.trim(),
          description: formDesc.trim(),
          isPublic: formIsPublic,
        });
        setToastMsg(res.message);

        // Cập nhật state
        setMyCreatedPlaylists((prev) =>
          prev.map((p) => (p._id === res.playlist._id ? res.playlist : p)),
        );
      } else {
        // Tạo mới
        const res = await createPlaylist({
          name: formName.trim(),
          description: formDesc.trim(),
          isPublic: formIsPublic,
        });
        setToastMsg(res.message);
        setMyCreatedPlaylists((prev) => [res.playlist, ...prev]);
      }
      setIsCreatingPlaylist(false);
      setEditingPlaylist(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu playlist');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Xóa playlist
  const handleDeletePlaylist = async (id: string) => {
    try {
      const res = await deletePlaylist(id);
      setToastMsg(res.message);
      setMyCreatedPlaylists((prev) => prev.filter((p) => p._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi xóa playlist');
    }
  };

  // Helper render Mosaic Thumbnails (1-4 thumbnails collage)
  const renderMosaic = (courses: PlaylistCourseItem[]) => {
    if (!courses || courses.length === 0) {
      return (
        <div className="mosaic-empty">
          <IconlyFolder size={38} color="#94a3b8" />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Chưa có khóa học
          </span>
        </div>
      );
    }

    const count = Math.min(courses.length, 4);
    const displayed = courses.slice(0, count);

    return (
      <div className={`mosaic-grid mosaic-${count}`}>
        {displayed.map((c, i) => (
          <div key={c._id || i} className="mosaic-item">
            <img
              src={
                c.thumbnailUrl ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'
              }
              alt={c.title}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  };

  // Chế độ Tạo mới hoặc Chỉnh sửa playlist -> Hiển thị dạng trang View (Không popup)
  if (isCreatingPlaylist || editingPlaylist) {
    return (
      <div className="playlists-page-container">
        {/* Toast Alert */}
        {toastMsg && (
          <div className="playlist-alert playlist-alert-success" role="alert">
            <IconlyTick size={16} color="#16a34a" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="playlist-alert playlist-alert-error" role="alert">
            <span>{errorMsg}</span>
            <button
              type="button"
              className="playlist-search-clear"
              style={{ marginLeft: 'auto', position: 'static' }}
              onClick={() => setErrorMsg('')}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ maxWidth: '800px', margin: '32px auto 60px auto' }}>
          <button
            type="button"
            className="editor-back-btn"
            style={{ marginBottom: '24px' }}
            onClick={() => {
              setIsCreatingPlaylist(false);
              setEditingPlaylist(null);
            }}
          >
            <IconlyArrowLeft size={16} />
            <span>Quay lại danh sách playlist</span>
          </button>

          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                marginBottom: '24px',
                borderBottom: '1px solid #f1f5f9',
                paddingBottom: '16px',
              }}
            >
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: '0 0 6px 0',
                }}
              >
                {editingPlaylist ? 'Chỉnh sửa playlist' : 'Tạo playlist mới'}
              </h1>
              <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
                Tạo bộ sưu tập khóa học theo chủ đề hoặc lộ trình học tập cá
                nhân để dễ dàng theo dõi.
              </p>
            </div>

            <form onSubmit={handleSavePlaylist}>
              <div className="playlist-form-group">
                <label className="playlist-form-label" htmlFor="pl-name">
                  Tên danh sách phát <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="pl-name"
                  type="text"
                  className="playlist-input"
                  placeholder="Ví dụ: Lộ trình Frontend từ A đến Z..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>

              <div className="playlist-form-group">
                <label className="playlist-form-label" htmlFor="pl-desc">
                  Mô tả ngắn
                </label>
                <textarea
                  id="pl-desc"
                  className="playlist-textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Mô tả mục tiêu, định hướng bài học của bộ sưu tập này..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div
                className="playlist-form-group"
                style={{ marginTop: '16px' }}
              >
                <label className="playlist-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>
                      Công khai playlist này
                    </strong>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Cho phép các học viên khác tìm kiếm, xem và theo dõi
                      playlist theo lộ trình bạn biên soạn.
                    </span>
                  </div>
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '28px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '20px',
                }}
              >
                <button
                  type="button"
                  className="playlist-btn-secondary"
                  onClick={() => {
                    setIsCreatingPlaylist(false);
                    setEditingPlaylist(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="playlist-btn-primary"
                  disabled={formSubmitting || !formName.trim()}
                >
                  {formSubmitting
                    ? 'Đang lưu...'
                    : editingPlaylist
                      ? 'Lưu thay đổi'
                      : 'Tạo playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="playlists-page-container">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="playlist-alert playlist-alert-success" role="alert">
          <IconlyTick size={16} color="#16a34a" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="playlist-alert playlist-alert-error" role="alert">
          <span>{errorMsg}</span>
          <button
            type="button"
            className="playlist-search-clear"
            style={{ marginLeft: 'auto', position: 'static' }}
            onClick={() => setErrorMsg('')}
          >
            ×
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="playlists-header">
        <div className="playlists-header-top">
          <div className="playlists-title-group">
            <div className="playlists-badge">
              <IconlyFolder size={14} color="#0056d2" />
              <span>Khám phá & Bộ sưu tập khóa học</span>
            </div>
            <h1 className="playlists-main-title">
              Bộ sưu tập & Lộ trình khóa học (Playlists)
            </h1>
            <p className="playlists-main-desc">
              Khám phá các playlist công khai do giảng viên và cộng đồng học
              viên biên soạn sẵn theo lộ trình bài bản, hoặc tự tạo bộ sưu tập
              riêng để sắp xếp kế hoạch học tập của bạn.
            </p>
          </div>

          <button
            type="button"
            className="playlist-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <IconlyPlus size={18} color="#ffffff" />
            <span>Tạo playlist mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="playlists-tabs-bar">
        <div className="playlists-nav-tabs">
          <button
            type="button"
            className={`playlists-tab-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('public');
              setSearchKeyword('');
            }}
          >
            <span>Khám phá Playlist công khai</span>
            <span className="playlists-tab-counter">
              {publicPlaylists.length}
            </span>
          </button>

          <button
            type="button"
            className={`playlists-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/login');
                return;
              }
              setActiveTab('my');
              setSearchKeyword('');
            }}
          >
            <span>Playlist của tôi</span>
            {isAuthenticated && (
              <span className="playlists-tab-counter">
                {myCreatedPlaylists.length + myFollowedPlaylists.length}
              </span>
            )}
          </button>
        </div>

        {/* Toolbar: Search input */}
        <div className="playlists-toolbar" style={{ margin: 0 }}>
          <form className="playlists-search-box" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="playlists-search-input"
              placeholder={
                activeTab === 'public'
                  ? 'Tìm kiếm playlist theo chủ đề, lộ trình...'
                  : 'Lọc playlist của bạn...'
              }
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <div className="playlists-search-icon">
              <IconlySearch size={16} />
            </div>
            {searchKeyword && (
              <button
                type="button"
                className="playlists-search-clear"
                onClick={() => setSearchKeyword('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: KHÁM PHÁ PLAYLIST CÔNG KHAI
         ========================================================================= */}
      {activeTab === 'public' && (
        <div className="playlists-content-view">
          {loading ? (
            <div className="playlist-loading-state">
              <div className="playlist-spinner" />
              <span>Đang tải các playlist công khai từ cộng đồng...</span>
            </div>
          ) : publicPlaylists.length === 0 ? (
            <div className="playlist-empty-state">
              <IconlyFolder size={48} color="#94a3b8" />
              <h3
                style={{
                  fontSize: '18px',
                  margin: '14px 0 6px',
                  color: '#1e293b',
                }}
              >
                Không tìm thấy playlist phù hợp
              </h3>
              <p>
                {searchKeyword
                  ? `Không có playlist công khai nào khớp với từ khóa "${searchKeyword}".`
                  : 'Hiện chưa có playlist công khai nào trên hệ thống.'}
              </p>
            </div>
          ) : (
            <div className="playlists-grid">
              {publicPlaylists.map((pl) => (
                <div key={pl._id} className="playlist-card">
                  {/* Thumbnail Mosaic */}
                  <div
                    className="playlist-thumbnail-preview"
                    onClick={() => navigate(`/playlists/${pl._id}`)}
                    title="Nhấn để xem chi tiết danh sách khóa học"
                  >
                    {renderMosaic(pl.courses)}
                    <div className="playlist-overlay-count">
                      <IconlyPlay size={14} color="#ffffff" />
                      <span>{pl.courses?.length || 0} khóa học</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="playlist-card-body">
                    <h3
                      className="playlist-card-title"
                      onClick={() => navigate(`/playlists/${pl._id}`)}
                      title={pl.name}
                    >
                      {pl.name}
                    </h3>
                    <p className="playlist-card-desc">
                      {pl.description || 'Chưa có mô tả cho bộ sưu tập này.'}
                    </p>

                    {/* Author & Followers Row */}
                    <div className="playlist-author-row">
                      <div className="playlist-author-left">
                        <img
                          src={
                            pl.userId?.avatarUrl ||
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                              pl.userId?.email || 'user',
                            )}`
                          }
                          alt={pl.userId?.fullName || 'Tác giả'}
                          className="playlist-author-avatar"
                        />
                        <div className="playlist-author-meta">
                          <span className="playlist-author-name">
                            {pl.userId?.fullName || 'Giảng viên Purrfect'}
                          </span>
                          <span
                            className={`playlist-role-pill ${
                              pl.userId?.role === 'INSTRUCTOR'
                                ? 'instructor'
                                : pl.userId?.role === 'ADMIN'
                                  ? 'admin'
                                  : ''
                            }`}
                          >
                            {pl.userId?.role === 'INSTRUCTOR'
                              ? 'Giảng viên'
                              : pl.userId?.role === 'ADMIN'
                                ? 'Quản trị viên'
                                : 'Học viên'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="playlist-followers-tag"
                        title="Số người đang theo dõi"
                      >
                        <IconlyHeart size={14} color="#ef4444" />
                        <span>{pl.followerCount || 0} theo dõi</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="playlist-card-actions">
                      <button
                        type="button"
                        className="playlist-btn-view"
                        onClick={() => navigate(`/playlists/${pl._id}`)}
                      >
                        Xem danh sách
                      </button>

                      {pl.isOwner ? (
                        <span className="playlist-owner-pill">
                          Playlist của bạn
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`playlist-btn-follow ${
                            pl.isFollowedByMe ? 'following' : ''
                          }`}
                          onClick={() => handleToggleFollow(pl)}
                        >
                          <IconlyHeart
                            size={14}
                            color={pl.isFollowedByMe ? '#166534' : '#0056d2'}
                          />
                          <span>
                            {pl.isFollowedByMe ? 'Đang theo dõi' : 'Theo dõi'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: PLAYLIST CỦA TÔI
         ========================================================================= */}
      {activeTab === 'my' && (
        <div className="playlists-content-view">
          {/* Subtabs: Đã tạo vs Đang theo dõi */}
          <div className="my-playlists-subtabs">
            <button
              type="button"
              className={`my-subtab-btn ${mySubtab === 'created' ? 'active' : ''}`}
              onClick={() => setMySubtab('created')}
            >
              Playlist tôi đã tạo ({myCreatedPlaylists.length})
            </button>
            <button
              type="button"
              className={`my-subtab-btn ${mySubtab === 'followed' ? 'active' : ''}`}
              onClick={() => setMySubtab('followed')}
            >
              Playlist đang theo dõi ({myFollowedPlaylists.length})
            </button>
          </div>

          {/* Subtab 1: Playlist tôi đã tạo */}
          {mySubtab === 'created' && (
            <>
              {/* Giới hạn số lượng playlist theo BR29.1 */}
              <div className="playlist-limit-banner">
                <span>
                  Bạn đã tạo <strong>{myCreatedPlaylists.length}</strong> /{' '}
                  <strong>{limits.maxPlaylists}</strong> playlist tối đa cho
                  phép. Mỗi playlist chứa tối đa{' '}
                  <strong>{limits.maxCoursesPerPlaylist}</strong> khóa học.
                </span>
                {myCreatedPlaylists.length < limits.maxPlaylists && (
                  <button
                    type="button"
                    className="playlist-btn-primary"
                    style={{ padding: '6px 14px', fontSize: '13px' }}
                    onClick={handleOpenCreateModal}
                  >
                    + Tạo thêm
                  </button>
                )}
              </div>

              {loading ? (
                <div className="playlist-loading-state">
                  <div className="playlist-spinner" />
                  <span>Đang tải playlist của bạn...</span>
                </div>
              ) : filteredMyCreated.length === 0 ? (
                <div className="playlist-empty-state">
                  <IconlyFolder size={48} color="#94a3b8" />
                  <h3
                    style={{
                      fontSize: '18px',
                      margin: '14px 0 6px',
                      color: '#1e293b',
                    }}
                  >
                    Bạn chưa có playlist nào
                  </h3>
                  <p style={{ maxWidth: '420px', marginBottom: '18px' }}>
                    Hãy tự tạo bộ sưu tập khóa học theo mục tiêu của riêng bạn
                    để dễ dàng quản lý và theo dõi tiến độ học tập.
                  </p>
                  <button
                    type="button"
                    className="playlist-btn-primary"
                    onClick={handleOpenCreateModal}
                  >
                    <IconlyPlus size={16} color="#ffffff" />
                    <span>Tạo playlist đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="playlists-grid">
                  {filteredMyCreated.map((pl) => (
                    <div key={pl._id} className="playlist-card">
                      <div
                        className="playlist-thumbnail-preview"
                        onClick={() => navigate(`/playlists/${pl._id}`)}
                      >
                        {renderMosaic(pl.courses)}
                        <div className="playlist-overlay-count">
                          <IconlyPlay size={14} color="#ffffff" />
                          <span>{pl.courses?.length || 0} khóa học</span>
                        </div>
                        <div
                          className={`playlist-visibility-pill ${
                            pl.isPublic ? 'public' : 'private'
                          }`}
                        >
                          {pl.isPublic ? 'Công khai' : 'Riêng tư'}
                        </div>
                      </div>

                      <div className="playlist-card-body">
                        <h3
                          className="playlist-card-title"
                          onClick={() => navigate(`/playlists/${pl._id}`)}
                          title={pl.name}
                        >
                          {pl.name}
                        </h3>
                        <p className="playlist-card-desc">
                          {pl.description || 'Chưa có mô tả cho playlist này.'}
                        </p>

                        <div className="playlist-author-row">
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {pl.isPublic
                              ? `${pl.followerCount || 0} người theo dõi`
                              : 'Chỉ mình bạn thấy'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Cập nhật:{' '}
                            {new Date(pl.updatedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="playlist-card-actions">
                          <button
                            type="button"
                            className="playlist-btn-view"
                            onClick={() => navigate(`/playlists/${pl._id}`)}
                          >
                            Quản lý & Sắp xếp
                          </button>
                          <button
                            type="button"
                            className="playlist-course-btn-arrow"
                            title="Chỉnh sửa thông tin"
                            onClick={() => handleOpenEditModal(pl)}
                          >
                            <IconlyEdit size={16} color="#0056d2" />
                          </button>
                          <button
                            type="button"
                            className="playlist-course-btn-del"
                            title="Xóa playlist"
                            onClick={() => setDeleteConfirmId(pl._id)}
                          >
                            <IconlyDelete size={16} color="#ef4444" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Subtab 2: Playlist đang theo dõi */}
          {mySubtab === 'followed' && (
            <>
              {/* Notice BR29.3 */}
              <div className="playlist-notice-banner">
                <IconlyHeart size={20} color="#1e40af" />
                <span>
                  <strong>Lưu ý:</strong> Đối với các danh sách phát công khai
                  do người khác biên soạn, bạn có quyền theo dõi để lưu vào danh
                  sách cá nhân và xem khóa học, không có quyền chỉnh sửa tên hay
                  thêm bớt nội dung gốc.
                </span>
              </div>

              {loading ? (
                <div className="playlist-loading-state">
                  <div className="playlist-spinner" />
                  <span>Đang tải các playlist bạn đang theo dõi...</span>
                </div>
              ) : filteredMyFollowed.length === 0 ? (
                <div className="playlist-empty-state">
                  <IconlyHeart size={48} color="#94a3b8" />
                  <h3
                    style={{
                      fontSize: '18px',
                      margin: '14px 0 6px',
                      color: '#1e293b',
                    }}
                  >
                    Chưa theo dõi playlist nào
                  </h3>
                  <p style={{ maxWidth: '420px', marginBottom: '18px' }}>
                    Khám phá kho lộ trình công khai từ giảng viên & học viên
                    khác, nhấn &quot;Theo dõi&quot; để lưu lại học bất cứ lúc
                    nào!
                  </p>
                  <button
                    type="button"
                    className="playlist-btn-primary"
                    onClick={() => setActiveTab('public')}
                  >
                    Khám phá ngay
                  </button>
                </div>
              ) : (
                <div className="playlists-grid">
                  {filteredMyFollowed.map((pl) => (
                    <div key={pl._id} className="playlist-card">
                      <div
                        className="playlist-thumbnail-preview"
                        onClick={() => navigate(`/playlists/${pl._id}`)}
                      >
                        {renderMosaic(pl.courses)}
                        <div className="playlist-overlay-count">
                          <IconlyPlay size={14} color="#ffffff" />
                          <span>{pl.courses?.length || 0} khóa học</span>
                        </div>
                      </div>

                      <div className="playlist-card-body">
                        <h3
                          className="playlist-card-title"
                          onClick={() => navigate(`/playlists/${pl._id}`)}
                          title={pl.name}
                        >
                          {pl.name}
                        </h3>
                        <p className="playlist-card-desc">
                          {pl.description || 'Chưa có mô tả.'}
                        </p>

                        <div className="playlist-author-row">
                          <div className="playlist-author-left">
                            <img
                              src={
                                pl.userId?.avatarUrl ||
                                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                                  pl.userId?.email || 'user',
                                )}`
                              }
                              alt={pl.userId?.fullName || 'Tác giả'}
                              className="playlist-author-avatar"
                            />
                            <div className="playlist-author-meta">
                              <span className="playlist-author-name">
                                {pl.userId?.fullName || 'Giảng viên Purrfect'}
                              </span>
                              <span className="playlist-role-pill">
                                {pl.userId?.role === 'INSTRUCTOR'
                                  ? 'Giảng viên'
                                  : 'Cộng đồng'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="playlist-card-actions">
                          <button
                            type="button"
                            className="playlist-btn-view"
                            onClick={() => navigate(`/playlists/${pl._id}`)}
                          >
                            Xem khóa học
                          </button>
                          <button
                            type="button"
                            className="playlist-btn-follow following"
                            title="Bỏ theo dõi playlist này"
                            onClick={() => handleToggleFollow(pl)}
                          >
                            <span>Bỏ theo dõi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL XÁC NHẬN XÓA PLAYLIST
         ========================================================================= */}
      {deleteConfirmId && (
        <div
          className="playlist-modal-backdrop"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="playlist-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="playlist-modal-header">
              <h3 className="playlist-modal-title" style={{ color: '#ef4444' }}>
                Xác nhận xóa playlist
              </h3>
              <button
                type="button"
                className="playlist-modal-close-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                <IconlyClose size={18} />
              </button>
            </div>

            <div className="playlist-modal-body">
              <p
                style={{
                  fontSize: '14.5px',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                Bạn có chắc chắn muốn xóa toàn bộ danh sách phát này không? Các
                khóa học bên trong sẽ không bị xóa khỏi hệ thống.
              </p>
            </div>

            <div className="playlist-modal-footer">
              <button
                type="button"
                className="playlist-btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="playlist-btn-primary"
                style={{ backgroundColor: '#ef4444' }}
                onClick={() => handleDeletePlaylist(deleteConfirmId)}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
