import React, { useState } from 'react';
import type {
  QuizDataItem,
  QuizQuestionItem,
} from '../../types/instructorCourse';
import { aiQuizApi } from '../../services/aiQuizApi';
import {
  IconlySparkles,
  IconlyTick,
  IconlyDelete,
  IconlyClose,
} from '../Onboarding/IconlyIcons';
import { toast } from '../../context/ToastContext';

interface AiQuizGeneratorProps {
  initialQuizData?: QuizDataItem;
  defaultTopic: string;
  defaultContent?: string;
  onSaveQuiz: (quizData: QuizDataItem) => void;
  onCancel: () => void;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

interface ScheduleDatePickerProps {
  title: string;
  value: string;
  onChange: (val: string) => void;
  emptyNotice: string;
}

const DateTimeSchedulePicker: React.FC<ScheduleDatePickerProps> = ({
  title,
  value,
  onChange,
  emptyNotice,
}) => {
  const parseVal = () => {
    if (!value) {
      const now = new Date();
      return {
        hour: '08',
        minute: '00',
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        hasValue: false,
      };
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      const now = new Date();
      return {
        hour: '08',
        minute: '00',
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        hasValue: false,
      };
    }
    return {
      hour: String(d.getHours()).padStart(2, '0'),
      minute: String(d.getMinutes()).padStart(2, '0'),
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      hasValue: true,
    };
  };

  const current = parseVal();
  const maxDays = getDaysInMonth(current.year, current.month);

  const update = (h: string, m: string, d: number, mo: number, y: number) => {
    const validMaxDay = getDaysInMonth(y, mo);
    const validDay = Math.min(d, validMaxDay);
    const yStr = String(y);
    const moStr = String(mo).padStart(2, '0');
    const dStr = String(validDay).padStart(2, '0');
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    onChange(`${yStr}-${moStr}-${dStr}T${hStr}:${mStr}`);
  };

  const applyQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const y = target.getFullYear();
    const mo = target.getMonth() + 1;
    const d = target.getDate();
    update(current.hour || '08', current.minute || '00', d, mo, y);
  };

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
          {title}
        </span>
        {current.hasValue ? (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            Bỏ hẹn mốc này
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              update(
                '08',
                '00',
                now.getDate(),
                now.getMonth() + 1,
                now.getFullYear(),
              );
            }}
            style={{
              background: '#ede9fe',
              border: '1px solid #ddd6fe',
              color: '#6d28d9',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '3px 8px',
              borderRadius: '6px',
            }}
          >
            + Thiết lập hẹn giờ
          </button>
        )}
      </div>

      {current.hasValue ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))',
              gap: '6px',
              alignItems: 'center',
            }}
          >
            {/* Giờ */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                Giờ
              </span>
              <select
                value={current.hour}
                onChange={(e) =>
                  update(
                    e.target.value,
                    current.minute,
                    current.day,
                    current.month,
                    current.year,
                  )
                }
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const val = String(i).padStart(2, '0');
                  return (
                    <option key={val} value={val}>
                      {val} giờ
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Phút */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                Phút
              </span>
              <select
                value={current.minute}
                onChange={(e) =>
                  update(
                    current.hour,
                    e.target.value,
                    current.day,
                    current.month,
                    current.year,
                  )
                }
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {Array.from({ length: 60 }).map((_, i) => {
                  const val = String(i).padStart(2, '0');
                  return (
                    <option key={val} value={val}>
                      {val} phút
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Ngày */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                Ngày
              </span>
              <select
                value={current.day}
                onChange={(e) =>
                  update(
                    current.hour,
                    current.minute,
                    Number(e.target.value),
                    current.month,
                    current.year,
                  )
                }
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {Array.from({ length: maxDays }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Ngày {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Tháng */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                Tháng
              </span>
              <select
                value={current.month}
                onChange={(e) =>
                  update(
                    current.hour,
                    current.minute,
                    current.day,
                    Number(e.target.value),
                    current.year,
                  )
                }
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Năm */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  color: '#64748b',
                  marginBottom: '2px',
                }}
              >
                Năm
              </span>
              <select
                value={current.year}
                onChange={(e) =>
                  update(
                    current.hour,
                    current.minute,
                    current.day,
                    current.month,
                    Number(e.target.value),
                  )
                }
                style={{
                  width: '100%',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dòng tóm tắt ngày giờ tháng năm & Phím chọn nhanh */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '6px',
              paddingTop: '6px',
              borderTop: '1px dashed #cbd5e1',
              fontSize: '11.5px',
            }}
          >
            <div style={{ color: '#0369a1', fontWeight: 600 }}>
              Hẹn: {current.hour}:{current.minute} ngày {current.day} tháng{' '}
              {current.month} năm {current.year}
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => applyQuickDate(0)}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => applyQuickDate(1)}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                Ngày mai
              </button>
              <button
                type="button"
                onClick={() => applyQuickDate(7)}
                style={{
                  padding: '2px 6px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                +7 ngày
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          {emptyNotice}
        </div>
      )}
    </div>
  );
};

export const AiQuizGenerator: React.FC<AiQuizGeneratorProps> = ({
  initialQuizData,
  defaultTopic,
  defaultContent = '',
  onSaveQuiz,
  onCancel,
}) => {
  // Config state
  const [topic, setTopic] = useState<string>(
    initialQuizData?.title || defaultTopic || '',
  );
  const [content, setContent] = useState<string>(defaultContent);
  const [mcCount, setMcCount] = useState<number>(4);
  const [essayCount, setEssayCount] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    'Medium',
  );
  const [passingScore, setPassingScore] = useState<number>(
    initialQuizData?.passingScore || 80,
  );
  const [availableFrom, setAvailableFrom] = useState<string>(
    initialQuizData?.availableFrom || '',
  );
  const [availableUntil, setAvailableUntil] = useState<string>(
    initialQuizData?.availableUntil || '',
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(
    initialQuizData?.timeLimitMinutes || 15,
  );
  const [isScheduled, setIsScheduled] = useState<boolean>(
    Boolean(initialQuizData?.availableFrom || initialQuizData?.availableUntil),
  );

  // Loading & Questions state
  const [loading, setLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestionItem[]>(
    initialQuizData?.questions || [],
  );

  // Sinh câu hỏi bằng AI
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.warning(
        'Vui lòng nhập chủ đề bài kiểm tra trước khi tạo câu hỏi.',
        'Chủ đề trống',
      );
      return;
    }

    setLoading(true);
    setNotice('');

    try {
      const res = await aiQuizApi.generateQuiz({
        topic: topic.trim(),
        content: content.trim() || undefined,
        multipleChoiceCount: mcCount,
        essayCount,
        difficulty,
      });

      if (res.success && res.data) {
        setQuestions(res.data.questions || []);
        if (res.data.passingScore) {
          setPassingScore(res.data.passingScore);
        }
        if (res.message) {
          setNotice(res.message);
        } else {
          setNotice(
            `AI đã sinh thành công ${res.data.questions?.length || 0} câu hỏi bám sát chủ đề!`,
          );
        }
      } else {
        toast.error(
          res.message || 'Không thể tạo câu hỏi lúc này.',
          'Lỗi sinh câu hỏi',
        );
      }
    } catch (err) {
      console.error('Lỗi gọi AI sinh đề:', err);
      toast.error(
        'Lỗi khi gọi Trợ lý AI. Vui lòng thử lại sau.',
        'Lỗi kết nối AI',
      );
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật câu hỏi
  const handleUpdateQuestion = (
    idx: number,
    field: keyof QuizQuestionItem,
    value: unknown,
  ) => {
    const updated = [...questions];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    setQuestions(updated);
  };

  // Cập nhật phương án trắc nghiệm
  const handleUpdateOption = (
    qIdx: number,
    optIdx: number,
    newText: string,
  ) => {
    const updated = [...questions];
    const opts = [...(updated[qIdx].options || [])];
    opts[optIdx] = newText;
    updated[qIdx].options = opts;
    setQuestions(updated);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  // Thêm câu trắc nghiệm thủ công
  const handleAddManualMC = () => {
    const newQ: QuizQuestionItem = {
      id: `manual_mc_${Date.now()}`,
      type: 'MULTIPLE_CHOICE',
      question: 'Nhập câu hỏi trắc nghiệm mới...',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswer: 0,
      explanation: 'Giải thích tại sao phương án này đúng...',
      points: 10,
    };
    setQuestions([...questions, newQ]);
  };

  // Thêm câu tự luận thủ công
  const handleAddManualEssay = () => {
    const newQ: QuizQuestionItem = {
      id: `manual_essay_${Date.now()}`,
      type: 'ESSAY',
      question: 'Nhập câu hỏi tự luận mới...',
      sampleAnswer: 'Đáp án mẫu hoặc các ý chính cần đạt...',
      explanation: 'Tiêu chí chấm điểm cụ thể...',
      points: 20,
    };
    setQuestions([...questions, newQ]);
  };

  // Lưu lại vào khóa học
  const handleSave = () => {
    if (questions.length === 0) {
      toast.warning(
        'Vui lòng tạo ít nhất 1 câu hỏi trước khi lưu bài kiểm tra.',
        'Chưa có câu hỏi',
      );
      return;
    }

    onSaveQuiz({
      title: topic.trim() || 'Bài kiểm tra kiến thức',
      description: `Bài kiểm tra gồm ${questions.length} câu hỏi đánh giá mức độ tiếp thu bài học.`,
      passingScore,
      availableFrom: isScheduled && availableFrom ? availableFrom : undefined,
      availableUntil:
        isScheduled && availableUntil ? availableUntil : undefined,
      timeLimitMinutes: timeLimitMinutes || 15,
      questions,
    });
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#f5f3ff',
              color: '#7c3aed',
            }}
          >
            <IconlySparkles size={16} color="#7c3aed" />
          </span>
          <h4
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Trợ lý AI Soạn đề kiểm tra (Trắc nghiệm & Tự luận)
          </h4>
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
          }}
          title="Đóng bảng AI"
        >
          <IconlyClose size={16} color="currentColor" />
        </button>
      </div>

      {/* Configuration Form */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
        }}
      >
        <div style={{ gridColumn: 'span 2' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Chủ đề bài kiểm tra *
          </label>
          <input
            type="text"
            className="editor-form-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ví dụ: Nguyên tắc bảo mật và xác thực JWT trong Node.js"
            style={{ background: '#ffffff' }}
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Nội dung tóm tắt / Transcript kiến thức cần ra đề (Tùy chọn)
          </label>
          <textarea
            className="editor-form-input"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dán nội dung bài học, transcript video hoặc các ý trọng tâm vào đây để AI bám sát đề thi..."
            style={{ background: '#ffffff', resize: 'vertical' }}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Số câu trắc nghiệm
          </label>
          <select
            className="editor-form-input"
            value={mcCount}
            onChange={(e) => setMcCount(Number(e.target.value))}
            style={{ background: '#ffffff' }}
          >
            <option value={2}>2 câu trắc nghiệm</option>
            <option value={3}>3 câu trắc nghiệm</option>
            <option value={4}>4 câu trắc nghiệm (Chuẩn)</option>
            <option value={5}>5 câu trắc nghiệm</option>
            <option value={8}>8 câu trắc nghiệm</option>
            <option value={10}>10 câu trắc nghiệm</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Số câu tự luận ngắn
          </label>
          <select
            className="editor-form-input"
            value={essayCount}
            onChange={(e) => setEssayCount(Number(e.target.value))}
            style={{ background: '#ffffff' }}
          >
            <option value={0}>Không có tự luận (100% trắc nghiệm)</option>
            <option value={1}>1 câu tự luận ngắn (Khuyến nghị)</option>
            <option value={2}>2 câu tự luận</option>
            <option value={3}>3 câu tự luận</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Độ khó
          </label>
          <select
            className="editor-form-input"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')
            }
            style={{ background: '#ffffff' }}
          >
            <option value="Easy">Cơ bản (Dễ)</option>
            <option value="Medium">Trung bình (Chuẩn)</option>
            <option value="Hard">Nâng cao (Phân hóa cao)</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '5px',
            }}
          >
            Điểm tối thiểu để Đạt (%)
          </label>
          <input
            type="number"
            min={10}
            max={100}
            className="editor-form-input"
            value={passingScore}
            onChange={(e) => setPassingScore(Number(e.target.value))}
            style={{ background: '#ffffff' }}
          />
        </div>

        {/* Thiết lập Hẹn ngày giờ tháng năm & Thời lượng làm bài */}
        <div
          style={{
            gridColumn: 'span 2',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '14px',
            marginTop: '2px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: isScheduled ? '12px' : '0',
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsScheduled(checked);
                  if (!checked) {
                    setAvailableFrom('');
                    setAvailableUntil('');
                  } else if (!availableFrom) {
                    const now = new Date();
                    const fromIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T08:00`;
                    setAvailableFrom(fromIso);
                  }
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#7c3aed',
                  cursor: 'pointer',
                }}
              />
              <span>Hẹn ngày giờ tháng năm tổ chức bài kiểm tra</span>
            </label>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Thời lượng làm bài:
              </span>
              <input
                type="number"
                min={1}
                max={180}
                value={timeLimitMinutes}
                onChange={(e) =>
                  setTimeLimitMinutes(Math.max(1, Number(e.target.value)))
                }
                className="editor-form-input"
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                phút (Đồng hồ đếm ngược)
              </span>
            </div>
          </div>

          {isScheduled ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                paddingTop: '10px',
                borderTop: '1px dashed #e2e8f0',
              }}
            >
              <DateTimeSchedulePicker
                title="Thời điểm mở đề (Bắt đầu):"
                value={availableFrom}
                onChange={setAvailableFrom}
                emptyNotice="Mở đề tự do (Học viên vào thi ngay khi khóa học được xuất bản)"
              />

              <DateTimeSchedulePicker
                title="Hạn chót vào làm bài (Đóng cổng thi):"
                value={availableUntil}
                onChange={setAvailableUntil}
                emptyNotice="Mở cổng tự do (Bài thi luôn mở quyền truy cập)"
              />
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '12px',
                  color: '#0369a1',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  gridColumn: '1 / -1',
                }}
              >
                💡 <strong>Quy chế thi:</strong> Hạn chót chỉ áp dụng để đóng
                cổng truy cập. Học viên chỉ cần vào thi trước hạn chót này sẽ
                được làm trọn vẹn đủ {timeLimitMinutes} phút.
              </p>
            </div>
          ) : (
            <p
              style={{
                margin: '4px 0 0 24px',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              Mặc định không hẹn lịch: Học viên có thể vào làm bài kiểm tra bất
              cứ lúc nào.
            </p>
          )}
        </div>

        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            className="btn-create-course"
            onClick={handleGenerate}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#7c3aed',
              padding: '8px 20px',
            }}
          >
            <IconlySparkles size={16} color="#ffffff" />
            <span>
              {loading
                ? 'AI đang phân tích & soạn câu hỏi...'
                : '✨ Tạo câu hỏi ngay với AI'}
            </span>
          </button>
        </div>
      </div>

      {/* Thông báo AI */}
      {notice && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#15803d',
            fontSize: '12.5px',
            marginBottom: '16px',
          }}
        >
          {notice}
        </div>
      )}

      {/* Danh sách câu hỏi sau khi sinh hoặc chỉnh sửa */}
      {questions.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h5
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              Danh sách câu hỏi ({questions.length} câu)
            </h5>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={handleAddManualMC}
              >
                + Thêm trắc nghiệm
              </button>
              <button
                type="button"
                className="btn-action-secondary"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={handleAddManualEssay}
              >
                + Thêm tự luận
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '450px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {questions.map((q, qIdx) => {
              const isMC = q.type === 'MULTIPLE_CHOICE';

              return (
                <div
                  key={q.id || qIdx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: '#0f172a',
                        }}
                      >
                        Câu {qIdx + 1}:
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: isMC ? '#eff6ff' : '#f5f3ff',
                          color: isMC ? '#2563eb' : '#7c3aed',
                          border: `1px solid ${isMC ? '#bfdbfe' : '#ddd6fe'}`,
                        }}
                      >
                        {isMC ? 'Trắc nghiệm (4 lựa chọn)' : 'Tự luận'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        padding: '2px 6px',
                      }}
                      title="Xóa câu hỏi này"
                    >
                      <IconlyDelete size={14} color="currentColor" />
                    </button>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      className="editor-form-input"
                      value={q.question}
                      onChange={(e) =>
                        handleUpdateQuestion(qIdx, 'question', e.target.value)
                      }
                      style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        background: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Chi tiết trắc nghiệm */}
                  {isMC && q.options && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      {q.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isCorrect = Number(q.correctAnswer) === optIdx;

                        return (
                          <div
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: isCorrect ? '#16a34a' : '#64748b',
                                minWidth: '40px',
                              }}
                            >
                              <input
                                type="radio"
                                name={`correct_${q.id || qIdx}`}
                                checked={isCorrect}
                                onChange={() =>
                                  handleUpdateQuestion(
                                    qIdx,
                                    'correctAnswer',
                                    optIdx,
                                  )
                                }
                              />
                              <span>{optLetter}.</span>
                            </label>
                            <input
                              type="text"
                              className="editor-form-input"
                              value={opt}
                              onChange={(e) =>
                                handleUpdateOption(qIdx, optIdx, e.target.value)
                              }
                              style={{
                                fontSize: '12.5px',
                                padding: '6px 10px',
                                background: isCorrect ? '#f0fdf4' : '#ffffff',
                                borderColor: isCorrect ? '#86efac' : '#cbd5e1',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Chi tiết tự luận */}
                  {!isMC && (
                    <div style={{ marginBottom: '10px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#64748b',
                          marginBottom: '3px',
                        }}
                      >
                        Đáp án mẫu & Gợi ý barem chấm:
                      </label>
                      <textarea
                        className="editor-form-input"
                        rows={2}
                        value={q.sampleAnswer || ''}
                        onChange={(e) =>
                          handleUpdateQuestion(
                            qIdx,
                            'sampleAnswer',
                            e.target.value,
                          )
                        }
                        style={{
                          fontSize: '12px',
                          background: '#ffffff',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  )}

                  {/* Lời giải thích từ AI */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '3px',
                      }}
                    >
                      💡 Lời giải thích của AI (Hiển thị sau khi học viên nộp
                      bài):
                    </label>
                    <input
                      type="text"
                      className="editor-form-input"
                      value={q.explanation || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(
                          qIdx,
                          'explanation',
                          e.target.value,
                        )
                      }
                      style={{
                        fontSize: '12px',
                        color: '#334155',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <button
          type="button"
          className="btn-action-secondary"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button
          type="button"
          className="btn-create-course"
          onClick={handleSave}
          disabled={questions.length === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
          }}
        >
          <IconlyTick size={16} color="#ffffff" />
          <span>Lưu bộ câu hỏi vào bài học</span>
        </button>
      </div>
    </div>
  );
};
