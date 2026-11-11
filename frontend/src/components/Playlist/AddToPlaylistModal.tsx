import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyPlaylists,
  addCourseToPlaylist,
  createPlaylist,
} from '../../services/playlistApi';
import type { Playlist } from '../../types/playlist';
import {
  IconlyFolder,
  IconlyClose,
  IconlyTick,
  IconlyPlus,
} from '../Onboarding/IconlyIcons';
import './PlaylistsPage.css';

interface AddToPlaylistModalProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  courseId,
  courseTitle,
  isOpen,
  onClose,
}) => {
  const { isAuthenticated, navigate } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form tạo nhanh playlist mới
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleClose = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setShowCreateForm(false);
    setNewPlaylistName('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    let isMounted = true;
    fetchMyPlaylists()
      .then((res) => {
        if (isMounted) {
          setPlaylists(res.created || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Lỗi khi tải danh sách playlist',
          );
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="playlist-modal-backdrop" onClick={handleClose}>
        <div
          className="playlist-modal-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="playlist-modal-header">
            <h3 className="playlist-modal-title">Thêm vào Playlist</h3>
            <button
              type="button"
              className="playlist-modal-close-btn"
              onClick={handleClose}
              aria-label="Đóng"
            >
              <IconlyClose size={18} />
            </button>
          </div>
          <div
            className="playlist-modal-body text-center"
            style={{ padding: '24px 16px' }}
          >
            <p
              style={{
                color: '#4b5563',
                marginBottom: '16px',
                fontSize: '14.5px',
              }}
            >
              Vui lòng đăng nhập để tạo và lưu khóa học vào danh sách phát cá
              nhân của bạn.
            </p>
            <button
              type="button"
              className="playlist-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                handleClose();
                navigate('/login');
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleAddCourse = async (playlist: Playlist) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(playlist._id);
    try {
      await addCourseToPlaylist(playlist._id, courseId);
      setSuccessMsg(`Đã thêm vào danh sách phát "${playlist.name}"!`);
      // Cập nhật lại danh sách playlist tại chỗ
      setPlaylists((prev) =>
        prev.map((p) =>
          p._id === playlist._id
            ? {
                ...p,
                courses: [
                  ...p.courses,
                  {
                    _id: courseId,
                    title: courseTitle,
                    slug: '',
                  } as unknown as Playlist['courses'][0],
                ],
                courseCount: (p.courses?.length || 0) + 1,
              }
            : p,
        ),
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Lỗi khi thêm khóa học vào playlist',
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      setErrorMsg('Vui lòng nhập tên playlist');
      return;
    }

    setIsCreating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await createPlaylist({
        name: newPlaylistName.trim(),
        isPublic,
      });

      // Thêm ngay khóa học vào playlist mới tạo
      await addCourseToPlaylist(res.playlist._id, courseId);

      setSuccessMsg(
        `Đã tạo playlist "${res.playlist.name}" và thêm khóa học thành công!`,
      );
      setNewPlaylistName('');
      setShowCreateForm(false);

      // Thêm playlist mới vào state
      setPlaylists((prev) => [
        {
          ...res.playlist,
          courses: [
            {
              _id: courseId,
              title: courseTitle,
              slug: '',
            } as unknown as Playlist['courses'][0],
          ],
          courseCount: 1,
        },
        ...prev,
      ]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Lỗi khi tạo playlist mới',
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="playlist-modal-backdrop" onClick={handleClose}>
      <div
        className="playlist-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="playlist-modal-header">
          <div className="playlist-modal-header-info">
            <h3 className="playlist-modal-title">Thêm vào Playlist</h3>
            <p className="playlist-modal-subtitle" title={courseTitle}>
              {courseTitle}
            </p>
          </div>
          <button
            type="button"
            className="playlist-modal-close-btn"
            onClick={handleClose}
            aria-label="Đóng"
          >
            <IconlyClose size={18} />
          </button>
        </div>

        <div className="playlist-modal-body">
          {errorMsg && (
            <div className="playlist-alert playlist-alert-error" role="alert">
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="playlist-alert playlist-alert-success" role="alert">
              <IconlyTick size={16} color="#16a34a" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="playlist-loading-state">
              <div className="playlist-spinner" />
              <span>Đang tải danh sách playlist...</span>
            </div>
          ) : (
            <div className="playlist-list-container">
              {playlists.length === 0 && !showCreateForm ? (
                <div className="playlist-empty-state">
                  <IconlyFolder size={36} color="#94a3b8" />
                  <p>Bạn chưa có playlist nào.</p>
                  <button
                    type="button"
                    className="playlist-btn-primary"
                    style={{ marginTop: '10px' }}
                    onClick={() => setShowCreateForm(true)}
                  >
                    <IconlyPlus size={16} color="#ffffff" />
                    <span>Tạo playlist đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="playlist-item-rows">
                  {playlists.map((pl) => {
                    const isAlreadyIn = pl.courses?.some(
                      (c) => (typeof c === 'string' ? c : c._id) === courseId,
                    );
                    const isRowLoading = actionLoadingId === pl._id;

                    return (
                      <div key={pl._id} className="playlist-picker-item">
                        <div className="playlist-picker-left">
                          <div className="playlist-picker-icon">
                            <IconlyFolder size={20} color="#0056d2" />
                          </div>
                          <div className="playlist-picker-meta">
                            <span
                              className="playlist-picker-name"
                              title={pl.name}
                            >
                              {pl.name}
                            </span>
                            <span className="playlist-picker-sub">
                              {pl.courses?.length || 0} khóa học •{' '}
                              {pl.isPublic ? 'Công khai' : 'Riêng tư'}
                            </span>
                          </div>
                        </div>

                        <div className="playlist-picker-action">
                          {isAlreadyIn ? (
                            <span className="playlist-badge-added">
                              <IconlyTick size={14} color="#16a34a" />
                              <span>Đã thêm</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="playlist-btn-add-sm"
                              disabled={isRowLoading}
                              onClick={() => handleAddCourse(pl)}
                            >
                              {isRowLoading ? 'Đang thêm...' : '+ Thêm vào'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Form tạo nhanh playlist mới */}
          {showCreateForm ? (
            <form
              onSubmit={handleCreateAndAdd}
              className="playlist-quick-create-form"
            >
              <div className="form-field">
                <label className="form-label" htmlFor="quick-pl-name">
                  Tên playlist mới <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="quick-pl-name"
                  type="text"
                  className="playlist-input"
                  placeholder="Ví dụ: Lộ trình Web Dev 2026..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="form-field-row">
                <label className="playlist-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <span>
                    Đặt ở chế độ công khai để người khác cùng theo dõi
                  </span>
                </label>
              </div>

              <div className="playlist-form-actions">
                <button
                  type="button"
                  className="playlist-btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="playlist-btn-primary"
                  disabled={isCreating || !newPlaylistName.trim()}
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo & Thêm khóa học'}
                </button>
              </div>
            </form>
          ) : (
            playlists.length > 0 && (
              <button
                type="button"
                className="playlist-btn-toggle-create"
                onClick={() => setShowCreateForm(true)}
              >
                <IconlyPlus size={16} color="#0056d2" />
                <span>+ Tạo playlist mới</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
