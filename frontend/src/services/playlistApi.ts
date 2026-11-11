import { authFetch } from './authApi';
import type {
  PublicPlaylistsResponse,
  MyPlaylistsResponse,
  PlaylistDetailResponse,
  Playlist,
} from '../types/playlist';
import { parseApiJson } from '../utils/api';

const PLAYLIST_API_BASE = '/api/playlists';

/**
 * Lấy danh sách các playlist công khai (hỗ trợ tìm kiếm)
 */
export const fetchPublicPlaylists = async (
  search?: string,
): Promise<PublicPlaylistsResponse> => {
  const query = search ? `?search=${encodeURIComponent(search.trim())}` : '';
  const res = await authFetch(`${PLAYLIST_API_BASE}/public${query}`);
  return parseApiJson(res, 'Lỗi khi tải danh sách playlist công khai');
};

/**
 * Lấy danh sách playlist cá nhân (Đã tạo + Đang theo dõi)
 */
export const fetchMyPlaylists = async (): Promise<MyPlaylistsResponse> => {
  const res = await authFetch(`${PLAYLIST_API_BASE}/my`);
  return parseApiJson(res, 'Lỗi khi tải playlist cá nhân');
};

/**
 * Lấy chi tiết một playlist
 */
export const fetchPlaylistDetail = async (
  id: string,
): Promise<PlaylistDetailResponse> => {
  const res = await authFetch(`${PLAYLIST_API_BASE}/${id}`);
  return parseApiJson(res, 'Lỗi khi tải chi tiết playlist');
};

/**
 * Tạo playlist mới
 * (BR29.1, Exception 1b)
 */
export const createPlaylist = async (payload: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): Promise<{ success: boolean; message: string; playlist: Playlist }> => {
  const res = await authFetch(PLAYLIST_API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi tạo playlist mới');
};

/**
 * Cập nhật thông tin hoặc sắp xếp danh sách khóa học
 * (BR29.3, Exception 3a4)
 */
export const updatePlaylist = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    courses?: string[];
  },
): Promise<{ success: boolean; message: string; playlist: Playlist }> => {
  const res = await authFetch(`${PLAYLIST_API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return parseApiJson(res, 'Lỗi khi cập nhật playlist');
};

/**
 * Xóa một playlist
 * (Alternative flow 5a2)
 */
export const deletePlaylist = async (
  id: string,
): Promise<{ success: boolean; message: string }> => {
  const res = await authFetch(`${PLAYLIST_API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return parseApiJson(res, 'Lỗi khi xóa playlist');
};

/**
 * Thêm khóa học vào playlist
 * (BR29.2: Tránh trùng lặp, BR29.1: Tối đa số khóa học)
 */
export const addCourseToPlaylist = async (
  playlistId: string,
  courseId: string,
): Promise<{ success: boolean; message: string; playlist: Playlist }> => {
  const res = await authFetch(`${PLAYLIST_API_BASE}/${playlistId}/courses`, {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  });
  return parseApiJson(res, 'Lỗi khi thêm khóa học vào playlist');
};

/**
 * Gỡ khóa học khỏi playlist
 */
export const removeCourseFromPlaylist = async (
  playlistId: string,
  courseId: string,
): Promise<{ success: boolean; message: string; playlist: Playlist }> => {
  const res = await authFetch(
    `${PLAYLIST_API_BASE}/${playlistId}/courses/${courseId}`,
    {
      method: 'DELETE',
    },
  );
  return parseApiJson(res, 'Lỗi khi gỡ khóa học khỏi playlist');
};

/**
 * Theo dõi / Bỏ theo dõi playlist công khai
 * (Alternative flow 3a2, 3a3, BR29.3)
 */
export const toggleFollowPlaylist = async (
  playlistId: string,
): Promise<{
  success: boolean;
  isFollowed: boolean;
  followerCount: number;
  message: string;
}> => {
  const res = await authFetch(`${PLAYLIST_API_BASE}/${playlistId}/follow`, {
    method: 'POST',
  });
  return parseApiJson(res, 'Lỗi khi theo dõi playlist');
};
