import { useEffect, useState, type FC } from 'react';
import {
  lectureNoteApi,
  type LectureNote,
} from '../../services/lectureNoteApi';
import { toast } from '../../context/ToastContext';

interface Props {
  courseId: string;
  lectureId?: string;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const LectureNotesPanel: FC<Props> = ({
  courseId,
  lectureId,
  currentTime,
  onSeek,
}) => {
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lectureId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    lectureNoteApi
      .get(courseId, lectureId)
      .then((res) => setNotes(res.data || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [courseId, lectureId]);

  const save = async () => {
    const value = content.trim();
    if (!value) {
      toast.error('Vui lòng nhập nội dung ghi chú trước khi lưu.');
      return;
    }
    if (!lectureId) {
      toast.warning('Hãy chọn một bài giảng video trước.');
      return;
    }
    try {
      if (editing) {
        const res = await lectureNoteApi.update(editing, value);
        setNotes((current) =>
          current.map((note) => (note._id === editing ? res.data : note)),
        );
      } else {
        const res = await lectureNoteApi.create(
          courseId,
          lectureId,
          value,
          currentTime,
        );
        setNotes((current) =>
          [...current, res.data].sort(
            (a, b) => a.timestampSeconds - b.timestampSeconds,
          ),
        );
      }
      setContent('');
      setEditing(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể lưu ghi chú.',
      );
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Xóa ghi chú này?')) return;
    try {
      await lectureNoteApi.remove(id);
      setNotes((current) => current.filter((note) => note._id !== id));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể xóa ghi chú.',
      );
    }
  };

  if (!lectureId)
    return (
      <div className="lecture-notes-empty">
        Chọn một bài giảng video để tạo ghi chú theo mốc thời gian.
      </div>
    );
  return (
    <div className="lecture-notes-panel">
      <div className="lecture-notes-composer">
        <div className="lecture-notes-time">
          Mốc video hiện tại: <strong>{formatTime(currentTime)}</strong>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              save();
            }
          }}
          placeholder="Nhập ghi chú cá nhân… (Enter để lưu, Shift + Enter để xuống dòng)"
          rows={3}
        />
        <div className="lecture-notes-actions">
          <button type="button" className="btn-note-save" onClick={save}>
            {editing ? 'Cập nhật ghi chú' : 'Lưu ghi chú'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn-note-cancel"
              onClick={() => {
                setEditing(null);
                setContent('');
              }}
            >
              Hủy
            </button>
          )}
        </div>
      </div>
      <div className="lecture-notes-list">
        {loading ? (
          <p>Đang tải ghi chú…</p>
        ) : notes.length === 0 ? (
          <p className="lecture-notes-empty">
            Chưa có ghi chú. Các ghi chú của bạn là riêng tư.
          </p>
        ) : (
          notes.map((note) => (
            <article className="lecture-note-item" key={note._id}>
              <button
                type="button"
                className="lecture-note-time"
                onClick={() => onSeek(note.timestampSeconds)}
                title="Tua video đến mốc này"
              >
                {formatTime(note.timestampSeconds)}
              </button>
              <p>{note.content}</p>
              <div className="lecture-note-tools">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(note._id);
                    setContent(note.content);
                  }}
                >
                  Sửa
                </button>
                <button type="button" onClick={() => remove(note._id)}>
                  Xóa
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
