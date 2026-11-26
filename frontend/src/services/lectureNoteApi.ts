import { authFetch } from './authApi';
import { parseJsonSafe } from '../utils/api';

export interface LectureNote {
  _id: string;
  content: string;
  timestampSeconds: number;
  createdAt: string;
  updatedAt: string;
}

const BASE = '/api/v1';

export const lectureNoteApi = {
  get: async (courseId: string, lectureId: string) =>
    parseJsonSafe<{ success: boolean; data: LectureNote[] }>(
      await authFetch(
        `${BASE}/courses/${courseId}/lectures/${lectureId}/notes`,
      ),
      'Không thể tải ghi chú',
    ),
  create: async (
    courseId: string,
    lectureId: string,
    content: string,
    timestampSeconds: number,
  ) =>
    parseJsonSafe<{ success: boolean; data: LectureNote }>(
      await authFetch(
        `${BASE}/courses/${courseId}/lectures/${lectureId}/notes`,
        { method: 'POST', body: JSON.stringify({ content, timestampSeconds }) },
      ),
      'Không thể lưu ghi chú',
    ),
  update: async (noteId: string, content: string) =>
    parseJsonSafe<{ success: boolean; data: LectureNote }>(
      await authFetch(`${BASE}/lecture-notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
      'Không thể cập nhật ghi chú',
    ),
  remove: async (noteId: string) =>
    parseJsonSafe<{ success: boolean }>(
      await authFetch(`${BASE}/lecture-notes/${noteId}`, { method: 'DELETE' }),
      'Không thể xóa ghi chú',
    ),
};
