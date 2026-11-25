import React, { useState, useRef } from 'react';
import type {
  QuizDataItem,
  QuizQuestionItem,
} from '../../types/instructorCourse';
import { aiQuizApi } from '../../services/aiQuizApi';
import { IconlyDelete, IconlyClose } from '../Onboarding/IconlyIcons';
import { toast } from '../../context/ToastContext';

interface AiQuizGeneratorProps {
  initialQuizData?: QuizDataItem;
  defaultTopic: string;
  defaultContent?: string;
  onSaveQuiz: (quizData: QuizDataItem) => void;
  onCancel: () => void;
}

type QuizMode = 'ai' | 'manual' | 'import';

const shuffleQuestionOptions = (
  question: QuizQuestionItem,
): QuizQuestionItem => {
  if (question.type !== 'MULTIPLE_CHOICE' || !question.options?.length)
    return question;
  const correct = Number(question.correctAnswer);
  if (
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct >= question.options.length
  )
    return question;
  const choices = question.options.map((text, index) => ({ text, index }));
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return {
    ...question,
    options: choices.map((choice) => choice.text),
    correctAnswer: choices.findIndex((choice) => choice.index === correct),
  };
};

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

// State-machine CSV Parser hỗ trợ dấu ngoặc kép, dấu chấm phẩy, dấu phẩy và xuống dòng
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === ',' || char === ';') && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Chuyển đổi bảng CSV thành danh sách QuizQuestionItem
function parseCsvToQuizQuestions(text: string): QuizQuestionItem[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const firstRowStr = rows[0].join(' ').toLowerCase();
  const hasHeader =
    firstRowStr.includes('loại') ||
    firstRowStr.includes('câu hỏi') ||
    firstRowStr.includes('type') ||
    firstRowStr.includes('question');
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const result: QuizQuestionItem[] = [];

  dataRows.forEach((cols, idx) => {
    if (cols.length < 2) return;
    const typeCol = (cols[0] || '').toUpperCase();
    const isEssay =
      typeCol.includes('TỰ LUẬN') ||
      typeCol.includes('TU LUAN') ||
      typeCol.includes('ESSAY');
    const questionText = cols[1] || '';
    if (!questionText.trim()) return;

    if (isEssay) {
      result.push({
        id: `imported_essay_${Date.now()}_${idx}`,
        type: 'ESSAY',
        question: questionText.trim(),
        sampleAnswer: cols[6] || '',
        explanation: cols[7] || '',
        points: Number(cols[8]) || 20,
      });
    } else {
      const optA = cols[2] || '';
      const optB = cols[3] || '';
      const optC = cols[4] || '';
      const optD = cols[5] || '';
      const options = [optA, optB, optC, optD].filter((o) => Boolean(o.trim()));
      const finalOptions =
        options.length >= 2
          ? options
          : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];

      const rawAns = (cols[6] || '').trim().toUpperCase();
      if (!rawAns)
        throw new Error(
          `Dòng ${idx + 1}: thiếu đáp án đúng (A, B, C, D hoặc 1-4).`,
        );
      let correctIdx = -1;
      if (rawAns === 'A' || rawAns === '1') correctIdx = 0;
      else if (rawAns === 'B' || rawAns === '2') correctIdx = 1;
      else if (rawAns === 'C' || rawAns === '3') correctIdx = 2;
      else if (rawAns === 'D' || rawAns === '4') correctIdx = 3;
      else if (/^[1-4]$/.test(rawAns)) correctIdx = Number(rawAns) - 1;
      if (correctIdx < 0 || correctIdx >= finalOptions.length)
        throw new Error(`Dòng ${idx + 1}: đáp án đúng không khớp phương án.`);

      result.push({
        id: `imported_mc_${Date.now()}_${idx}`,
        type: 'MULTIPLE_CHOICE',
        question: questionText.trim(),
        options: finalOptions,
        correctAnswer: correctIdx,
        explanation: cols[7] || '',
        points: Number(cols[8]) || 10,
      });
    }
  });

  return result;
}

// Phân tích JSON thành câu hỏi
function parseJsonToQuizQuestions(text: string): QuizQuestionItem[] {
  const data = JSON.parse(text);
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.questions)
      ? data.questions
      : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rawList.map((item: any, idx: number) => {
    const isEssay =
      String(item.type).toUpperCase() === 'ESSAY' ||
      String(item.type).toUpperCase().includes('TỰ LUẬN');

    if (isEssay) {
      return {
        id: item.id || `imported_json_essay_${Date.now()}_${idx}`,
        type: 'ESSAY' as const,
        question: String(item.question || `Câu hỏi tự luận ${idx + 1}`),
        sampleAnswer: item.sampleAnswer ? String(item.sampleAnswer) : '',
        explanation: String(item.explanation || ''),
        points: typeof item.points === 'number' ? item.points : 20,
      };
    }

    const opts = Array.isArray(item.options)
      ? item.options.map(String)
      : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];

    let correct = -1;
    if (typeof item.correctAnswer === 'number') {
      correct = item.correctAnswer;
    } else if (typeof item.correctAnswer === 'string') {
      const up = item.correctAnswer.trim().toUpperCase();
      if (up === 'A') correct = 0;
      else if (up === 'B') correct = 1;
      else if (up === 'C') correct = 2;
      else if (up === 'D') correct = 3;
      else if (/^[1-4]$/.test(up)) correct = Number(up) - 1;
    }
    if (!Number.isInteger(correct) || correct < 0 || correct >= opts.length) {
      throw new Error(
        `Câu ${idx + 1}: cần có correctAnswer hợp lệ (A-D hoặc 1-4).`,
      );
    }

    return {
      id: item.id || `imported_json_mc_${Date.now()}_${idx}`,
      type: 'MULTIPLE_CHOICE' as const,
      question: String(item.question || `Câu hỏi ${idx + 1}`),
      options: opts,
      correctAnswer: Math.max(0, Math.min(correct, opts.length - 1)),
      explanation: String(item.explanation || ''),
      points: typeof item.points === 'number' ? item.points : 10,
    };
  });
}

// Phân tích văn bản thô dạng câu hỏi A B C D
function parseTextToQuizQuestions(text: string): QuizQuestionItem[] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const blocks = clean
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const result: QuizQuestionItem[] = [];

  blocks.forEach((block, idx) => {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const qText = lines[0]
      .replace(/^(Câu\s*\d+[\s:.-]*|\d+[\s:.-]+)/i, '')
      .trim();
    const optList: { text: string; isCorrect: boolean }[] = [];
    let explanation = '';

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      const matchOpt = line.match(/^([A-D])[.:)]\s*(.*)$/i);
      const matchExp = line.match(
        /^(Giải thích|Lưu ý|Explanation|Ghi chú)[:\s]*(.*)$/i,
      );

      if (matchExp) {
        explanation = matchExp[2].trim();
      } else if (matchOpt) {
        let optText = matchOpt[2].trim();
        const isCorrect =
          optText.endsWith('*') ||
          line.toLowerCase().includes('(đúng)') ||
          line.toLowerCase().includes('(correct)');
        if (optText.endsWith('*')) optText = optText.slice(0, -1).trim();
        optText = optText.replace(/\((đúng|correct)\)/gi, '').trim();
        optList.push({
          text: optText,
          isCorrect,
        });
      }
    }

    if (optList.length >= 2) {
      const correctItems = optList.filter((o) => o.isCorrect);
      if (correctItems.length !== 1) {
        throw new Error(
          `Câu ${idx + 1}: phải đánh dấu đúng chính xác một đáp án bằng * hoặc (đúng).`,
        );
      }
      const correctIdx = optList.findIndex((o) => o.isCorrect);

      result.push({
        id: `imported_text_mc_${Date.now()}_${idx}`,
        type: 'MULTIPLE_CHOICE',
        question: qText || lines[0],
        options: optList.map((o) => o.text),
        correctAnswer: correctIdx,
        explanation,
        points: 10,
      });
    } else {
      result.push({
        id: `imported_text_essay_${Date.now()}_${idx}`,
        type: 'ESSAY',
        question: qText || lines[0],
        sampleAnswer: lines.slice(1).join('\n'),
        explanation,
        points: 20,
      });
    }
  });

  return result;
}

export const AiQuizGenerator: React.FC<AiQuizGeneratorProps> = ({
  initialQuizData,
  defaultTopic,
  defaultContent = '',
  onSaveQuiz,
  onCancel,
}) => {
  // Chế độ tạo quiz: 'ai' | 'manual' | 'import'
  const [activeMode, setActiveMode] = useState<QuizMode>('ai');

  // Config state
  const [topic, setTopic] = useState<string>(
    initialQuizData?.title || defaultTopic || '',
  );
  const [content, setContent] = useState<string>(defaultContent);
  const [uploadedDocName, setUploadedDocName] = useState<string>('');

  const [mcCount, setMcCount] = useState<number>(4);
  const [essayCount, setEssayCount] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    'Medium',
  );
  const [shuffleAnswers, setShuffleAnswers] = useState<boolean>(true);
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

  // AI Quiz Weekly Quota (Tối đa 5 lần/tuần)
  const [quota, setQuota] = useState<{
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  } | null>(null);

  React.useEffect(() => {
    aiQuizApi
      .getQuota()
      .then((res) => {
        if (res.success && res.data) {
          setQuota(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Import state
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [pasteText, setPasteText] = useState<string>('');

  // Refs cho các input tải file
  const docInputRef = useRef<HTMLInputElement>(null);
  const quizFileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý nạp file tài liệu cho AI
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setContent(text);
      setUploadedDocName(file.name);
      toast.success(
        `Đã nạp tài liệu từ file "${file.name}" (${text.length} ký tự).`,
        'Nạp tài liệu thành công',
      );
    };
    reader.onerror = () => {
      toast.error('Không thể đọc file tài liệu này.', 'Lỗi đọc file');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Tải file mẫu CSV (Excel UTF-8 có BOM)
  const handleDownloadSampleCsv = () => {
    const sampleCsvContent =
      '\uFEFFLoại câu,Câu hỏi,Phương án A,Phương án B,Phương án C,Phương án D,Đáp án đúng,Giải thích,Điểm\r\n' +
      'TRẮC NGHIỆM,Phương thức nào trong React được sử dụng để quản lý trạng thái cục bộ của component?,useEffect,useState,useContext,useReducer,B,useState là hook cơ bản để khai báo state trong functional component.,10\r\n' +
      'TRẮC NGHIỆM,Giao thức bảo mật SSL/TLS hoạt động ở tầng nào trong mô hình OSI?,Tầng mạng (Network),Tầng liên kết (Data Link),Tầng phiên / Tầng ứng dụng,Tầng vật lý (Physical),C,SSL/TLS mã hóa dữ liệu truyền tải bảo mật qua mạng internet.,10\r\n' +
      'TỰ LUẬN,Trình bày khái niệm RESTful API và 4 phương thức HTTP phổ biến nhất?,,,,,"RESTful API là chuẩn kiến trúc web: GET (đọc dữ liệu), POST (tạo mới), PUT (cập nhật), DELETE (xóa).",Nêu đủ định nghĩa và 4 phương thức HTTP.,20\r\n';

    const blob = new Blob([sampleCsvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau_cau_hoi_quiz_purrfect.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tải file mẫu JSON
  const handleDownloadSampleJson = () => {
    const sampleJsonData = [
      {
        type: 'MULTIPLE_CHOICE',
        question:
          'Phương thức nào trong React được sử dụng để quản lý trạng thái cục bộ của component?',
        options: ['useEffect', 'useState', 'useContext', 'useReducer'],
        correctAnswer: 1,
        explanation:
          'useState là hook cơ bản để khai báo state trong functional component.',
        points: 10,
      },
      {
        type: 'MULTIPLE_CHOICE',
        question:
          'Giao thức bảo mật SSL/TLS hoạt động ở tầng nào trong mô hình OSI?',
        options: [
          'Tầng mạng (Network)',
          'Tầng liên kết (Data Link)',
          'Tầng phiên / Tầng ứng dụng',
          'Tầng vật lý (Physical)',
        ],
        correctAnswer: 2,
        explanation: 'SSL/TLS mã hóa dữ liệu truyền tải bảo mật qua mạng.',
        points: 10,
      },
      {
        type: 'ESSAY',
        question:
          'Trình bày khái niệm RESTful API và 4 phương thức HTTP phổ biến nhất?',
        sampleAnswer:
          'RESTful API là chuẩn kiến trúc web: GET (đọc dữ liệu), POST (tạo mới), PUT (cập nhật), DELETE (xóa).',
        explanation: 'Nêu đủ định nghĩa và 4 phương thức HTTP.',
        points: 20,
      },
    ];

    const blob = new Blob([JSON.stringify(sampleJsonData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau_cau_hoi_quiz_purrfect.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Xử lý nạp tệp câu hỏi (.csv, .json, .txt)
  const handleImportQuizFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawText = (event.target?.result as string) || '';
      let parsed: QuizQuestionItem[] = [];

      const lowerName = file.name.toLowerCase();
      try {
        if (lowerName.endsWith('.csv')) {
          parsed = parseCsvToQuizQuestions(rawText);
        } else if (lowerName.endsWith('.json')) {
          parsed = parseJsonToQuizQuestions(rawText);
        } else {
          parsed = parseTextToQuizQuestions(rawText);
        }

        if (parsed.length === 0) {
          toast.warning(
            'Không tìm thấy câu hỏi hợp lệ trong file. Vui lòng kiểm tra định dạng hoặc tải file mẫu.',
            'Không có câu hỏi',
          );
          return;
        }

        if (importMode === 'replace') {
          setQuestions(parsed);
        } else {
          setQuestions((prev) => [...prev, ...parsed]);
        }

        toast.success(
          `Đã nạp thành công ${parsed.length} câu hỏi từ tệp "${file.name}".`,
          'Nhập câu hỏi thành công',
        );
      } catch (err) {
        console.error('Lỗi phân tích file câu hỏi:', err);
        toast.error('Lỗi khi phân tích nội dung file câu hỏi.', 'Lỗi nạp file');
      }
    };

    reader.onerror = () => {
      toast.error('Không thể đọc tệp tin này.', 'Lỗi đọc tệp');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Xử lý phân tích văn bản dán
  const handleParsePasteText = () => {
    if (!pasteText.trim()) {
      toast.warning(
        'Vui lòng dán nội dung câu hỏi vào khung trước khi nạp.',
        'Chưa có nội dung',
      );
      return;
    }

    let parsed: QuizQuestionItem[] = [];
    try {
      if (
        pasteText.trim().startsWith('[') ||
        pasteText.trim().startsWith('{')
      ) {
        parsed = parseJsonToQuizQuestions(pasteText);
      } else if (
        pasteText.includes(',') &&
        (pasteText.toLowerCase().includes('trắc nghiệm') ||
          pasteText.toLowerCase().includes('câu hỏi'))
      ) {
        parsed = parseCsvToQuizQuestions(pasteText);
      } else {
        parsed = parseTextToQuizQuestions(pasteText);
      }

      if (parsed.length === 0) {
        toast.warning(
          'Không nhận diện được câu hỏi nào từ văn bản. Hãy kiểm tra định dạng hoặc xem mẫu bên dưới.',
          'Không có câu hỏi',
        );
        return;
      }

      if (importMode === 'replace') {
        setQuestions(parsed);
      } else {
        setQuestions((prev) => [...prev, ...parsed]);
      }

      toast.success(
        `Đã nạp thành công ${parsed.length} câu hỏi từ nội dung dán!`,
        'Nạp câu hỏi thành công',
      );
      setPasteText('');
    } catch (err) {
      console.error('Lỗi phân tích văn bản câu hỏi:', err);
      toast.error('Lỗi khi phân tích định dạng văn bản.', 'Lỗi định dạng');
    }
  };

  // Sinh câu hỏi bằng AI từ tài liệu
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.warning(
        'Vui lòng nhập chủ đề bài kiểm tra trước khi tạo câu hỏi.',
        'Chủ đề trống',
      );
      return;
    }

    if (!content.trim() || content.trim().length < 20) {
      toast.warning(
        'Vui lòng dán hoặc tải lên tài liệu kiến thức (bài giảng, giáo trình, slide tóm tắt) để AI đọc và trích xuất câu hỏi chuẩn xác.',
        'Thiếu tài liệu bài học',
      );
      return;
    }

    if (quota && quota.remaining <= 0) {
      toast.error(
        'Bạn đã dùng hết hạn mức 5 lần tạo Quiz bằng AI trong tuần này. Vui lòng quay lại vào tuần mới để được cấp thêm lượt!',
        'Hết hạn mức AI',
      );
      return;
    }

    setLoading(true);
    setNotice('');

    try {
      const res = await aiQuizApi.generateQuiz({
        topic: topic.trim(),
        content: content.trim(),
        multipleChoiceCount: mcCount,
        essayCount,
        difficulty,
      });

      if (res.success && res.data) {
        setQuestions(
          (res.data.questions || []).map((question) =>
            shuffleAnswers ? shuffleQuestionOptions(question) : question,
          ),
        );
        if (res.data.passingScore) {
          setPassingScore(res.data.passingScore);
        }
        if (res.quota) {
          setQuota(res.quota);
        } else if (quota) {
          setQuota({
            ...quota,
            used: quota.used + 1,
            remaining: Math.max(0, quota.remaining - 1),
          });
        }
        if (res.message) {
          setNotice(res.message);
        } else {
          setNotice(
            `AI đã đọc tài liệu và sinh thành công ${res.data.questions?.length || 0} câu hỏi bám sát kiến thức!`,
          );
        }
        toast.success(
          `AI đã sinh thành công ${res.data.questions?.length || 0} câu hỏi từ tài liệu.`,
          'Sinh câu hỏi thành công',
        );
      } else {
        toast.error(
          res.message || 'Không thể tạo câu hỏi lúc này.',
          'Lỗi sinh câu hỏi',
        );
      }
    } catch (err) {
      console.error('Lỗi gọi AI sinh đề:', err);
      toast.error(
        'Lỗi khi kết nối Trợ lý AI. Vui lòng kiểm tra lại tài liệu và thử lại sau.',
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

  // Xóa toàn bộ câu hỏi
  const handleClearAllQuestions = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ câu hỏi hiện tại?')) {
      setQuestions([]);
    }
  };

  // Thêm câu trắc nghiệm thủ công
  const handleAddManualMC = () => {
    const newQ: QuizQuestionItem = {
      id: `manual_mc_${Date.now()}`,
      type: 'MULTIPLE_CHOICE',
      question: 'Nhập nội dung câu hỏi trắc nghiệm...',
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
      question: 'Nhập nội dung câu hỏi tự luận...',
      sampleAnswer: 'Đáp án mẫu hoặc các ý chính cần đạt...',
      explanation: 'Tiêu chí chấm điểm cụ thể...',
      points: 20,
    };
    setQuestions([...questions, newQ]);
  };

  // Lưu lại vào bài học / chương
  const handleSave = () => {
    if (questions.length === 0) {
      toast.warning(
        'Vui lòng tạo hoặc nhập ít nhất 1 câu hỏi trước khi lưu bài kiểm tra.',
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '10px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={docInputRef}
        accept=".txt,.md,.json,.csv"
        onChange={handleDocFileUpload}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={quizFileInputRef}
        accept=".csv,.json,.txt"
        onChange={handleImportQuizFile}
        style={{ display: 'none' }}
      />

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
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Thiết lập Đề kiểm tra (Quiz) & Câu hỏi
          </h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Hỗ trợ tạo bằng AI từ tài liệu, tự soạn bằng tay hoặc import từ file
            Excel/CSV/JSON
          </span>
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
          title="Đóng bảng đề thi"
        >
          <IconlyClose size={16} color="currentColor" />
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '8px',
          gap: '4px',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('ai')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeMode === 'ai' ? 700 : 500,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: activeMode === 'ai' ? '#ffffff' : 'transparent',
            color: activeMode === 'ai' ? '#7c3aed' : '#475569',
            boxShadow:
              activeMode === 'ai' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Tạo bằng AI từ tài liệu
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('manual')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeMode === 'manual' ? 700 : 500,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: activeMode === 'manual' ? '#ffffff' : 'transparent',
            color: activeMode === 'manual' ? '#7c3aed' : '#475569',
            boxShadow:
              activeMode === 'manual' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Tự soạn bằng tay (Thủ công)
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('import')}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: activeMode === 'import' ? 700 : 500,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: activeMode === 'import' ? '#ffffff' : 'transparent',
            color: activeMode === 'import' ? '#7c3aed' : '#475569',
            boxShadow:
              activeMode === 'import' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          Import file câu hỏi
        </button>
      </div>

      {/* TAB 1: TẠO BẰNG AI TỪ TÀI LIỆU */}
      {activeMode === 'ai' && (
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
          {/* Hạn mức Credit tuần */}
          <div
            style={{
              gridColumn: 'span 2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '8px',
              background: quota && quota.remaining <= 0 ? '#fef2f2' : '#f5f3ff',
              border: `1px solid ${quota && quota.remaining <= 0 ? '#fecaca' : '#ddd6fe'}`,
              fontSize: '12.5px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <span
                style={{
                  color: quota && quota.remaining <= 0 ? '#dc2626' : '#6d28d9',
                  fontWeight: 600,
                }}
              >
                Hạn mức AI tuần này: Còn {quota ? quota.remaining : 5}/5 lượt
                tạo Quiz
              </span>
            </div>
            <span style={{ color: '#64748b', fontSize: '11.5px' }}>
              {quota && quota.remaining <= 0
                ? 'Đã hết lượt - Tự động cấp lại vào tuần mới'
                : 'Giới hạn 5 lần/tuần, tự động cấp mới hàng tuần'}
            </span>
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
              Chủ đề bài kiểm tra *
            </label>
            <input
              type="text"
              className="editor-form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Kiểm tra kiến thức Chương 1: Kiến trúc và nguyên lý cơ bản"
              style={{ background: '#ffffff' }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <label
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Tài liệu / Nội dung kiến thức để AI đọc và trích xuất câu hỏi *
              </label>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {uploadedDocName && (
                  <span
                    style={{
                      fontSize: '11.5px',
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    Đã nạp: {uploadedDocName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Tải tệp tài liệu lên (.txt, .md, .csv)
                </button>
              </div>
            </div>

            <textarea
              className="editor-form-input"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dán nội dung giáo trình, tóm tắt bài giảng, slide bài dạy hoặc nhấn nút tải tệp tài liệu lên ở góc trên. AI sẽ bám sát tuyệt đối vào tài liệu này để ra đề, không tự suy diễn nếu không có căn cứ."
              style={{ background: '#ffffff', resize: 'vertical' }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px',
                fontSize: '11.5px',
                color: '#64748b',
              }}
            >
              <span>
                Ký tự: {content.length} | Ước tính: {wordCount} từ
              </span>
              <span>
                Khuyến nghị: Cung cấp từ 100 từ trở lên để AI sinh câu hỏi sâu
                sát nhất.
              </span>
            </div>
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
              disabled={loading || (quota !== null && quota.remaining <= 0)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background:
                  quota && quota.remaining <= 0 ? '#94a3b8' : '#7c3aed',
                cursor:
                  quota && quota.remaining <= 0 ? 'not-allowed' : 'pointer',
                padding: '8px 20px',
              }}
            >
              <span>
                {loading
                  ? 'AI đang phân tích tài liệu & soạn câu hỏi...'
                  : quota && quota.remaining <= 0
                    ? 'Đã hết hạn mức AI tuần này (0/5)'
                    : 'Tạo câu hỏi ngay với AI'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TỰ SOẠN BẰNG TAY (THỦ CÔNG) */}
      {activeMode === 'manual' && (
        <div
          style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
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
              Chủ đề bài kiểm tra *
            </label>
            <input
              type="text"
              className="editor-form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Bài kiểm tra trắc nghiệm tổng hợp Chương 1"
              style={{ background: '#ffffff' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                Tự biên soạn câu hỏi theo ý muốn
              </span>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                Thêm từng câu hỏi trắc nghiệm hoặc tự luận, tùy chỉnh đáp án và
                barem điểm trực tiếp.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-create-course"
                onClick={handleAddManualMC}
                style={{
                  fontSize: '12px',
                  padding: '6px 14px',
                  background: '#2563eb',
                }}
              >
                + Thêm câu trắc nghiệm
              </button>
              <button
                type="button"
                className="btn-create-course"
                onClick={handleAddManualEssay}
                style={{
                  fontSize: '12px',
                  padding: '6px 14px',
                  background: '#7c3aed',
                }}
              >
                + Thêm câu tự luận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT FILE CÂU HỎI */}
      {activeMode === 'import' && (
        <div
          style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
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
              Chủ đề bài kiểm tra *
            </label>
            <input
              type="text"
              className="editor-form-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Đề thi đánh giá năng lực nhập từ file"
              style={{ background: '#ffffff' }}
            />
          </div>

          {/* Hàng tải file mẫu & Chọn chế độ ghi đè / nối tiếp */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 12px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Tải file mẫu chuẩn:
              </span>
              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #10b981',
                  background: '#ecfdf5',
                  color: '#065f46',
                  cursor: 'pointer',
                }}
              >
                Tải file mẫu CSV (Excel UTF-8)
              </button>
              <button
                type="button"
                onClick={handleDownloadSampleJson}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                Tải file mẫu JSON
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span>Ghi đè câu hỏi cũ</span>
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                />
                <span>Thêm nối tiếp</span>
              </label>
            </div>
          </div>

          {/* Vùng chọn file từ máy tính */}
          <div
            onClick={() => quizFileInputRef.current?.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              background: '#ffffff',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2563eb',
                marginBottom: '4px',
              }}
            >
              Bấm vào đây để chọn tệp câu hỏi (.csv, .json, .txt)
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Hệ thống tự động nhận diện dạng trắc nghiệm (A, B, C, D) và tự
              luận từ file
            </span>
          </div>

          {/* Vùng dán văn bản nhanh */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '4px',
              }}
            >
              Hoặc dán nhanh danh sách câu hỏi văn bản:
            </label>
            <textarea
              className="editor-form-input"
              rows={4}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`1. Đâu là thư viện giao diện người dùng phổ biến nhất hiện nay?\nA. React*\nB. Linux\nC. MySQL\nD. Docker\nGiải thích: React là thư viện JavaScript xây dựng UI do Meta phát triển.\n\n2. Trình bày sự khác biệt giữa state và props trong React?`}
              style={{ background: '#ffffff', resize: 'vertical' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '6px',
              }}
            >
              <button
                type="button"
                onClick={handleParsePasteText}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                Phân tích & Nạp câu hỏi từ văn bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THIẾT LẬP CHUNG: THỜI GIAN, ĐIỂM ĐẠT & LỊCH THI */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '16px',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  width: '70px',
                  padding: '4px 8px',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                phút (Đồng hồ đếm ngược)
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Điểm Đạt:
              </span>
              <input
                type="number"
                min={10}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="editor-form-input"
                style={{
                  width: '60px',
                  padding: '4px 6px',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b' }}>%</span>
            </div>
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
              <strong>Lưu ý quy chế thi:</strong> Hạn chót chỉ áp dụng để đóng
              cổng truy cập. Học viên chỉ cần vào thi trước hạn chót này sẽ được
              làm trọn vẹn đủ {timeLimitMinutes} phút.
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
            Mặc định không hẹn lịch: Học viên có thể vào làm bài kiểm tra bất cứ
            lúc nào.
          </p>
        )}
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

      {/* DANH SÁCH CÂU HỎI */}
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
            Danh sách câu hỏi đề thi ({questions.length} câu)
          </h5>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={shuffleAnswers}
                onChange={(e) => setShuffleAnswers(e.target.checked)}
              />
              Xáo trộn đáp án khi AI tạo
            </label>
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
            {questions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllQuestions}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  background: 'none',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Xóa tất cả câu hỏi
              </button>
            )}
          </div>
        </div>

        {questions.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            <p style={{ margin: '0 0 10px 0' }}>
              Chưa có câu hỏi nào trong đề thi.
            </p>
            <p
              style={{
                margin: '0 0 14px 0',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              Hãy chọn tab <strong>Tạo bằng AI từ tài liệu</strong>,{' '}
              <strong>Tự soạn bằng tay</strong> hoặc{' '}
              <strong>Import file câu hỏi</strong> ở trên để nạp câu hỏi vào đề.
            </p>
            <div
              style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}
            >
              <button
                type="button"
                onClick={handleAddManualMC}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                + Thêm trắc nghiệm ngay
              </button>
              <button
                type="button"
                onClick={handleAddManualEssay}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                + Thêm tự luận ngay
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '480px',
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

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Điểm:
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={q.points || (isMC ? 10 : 20)}
                          onChange={(e) =>
                            handleUpdateQuestion(
                              qIdx,
                              'points',
                              Number(e.target.value),
                            )
                          }
                          style={{
                            width: '45px',
                            padding: '2px 4px',
                            fontSize: '11.5px',
                            textAlign: 'center',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                          }}
                        />
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
                      <p
                        style={{
                          margin: '2px 0 0 48px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#16a34a',
                        }}
                      >
                        Đáp án đúng:{' '}
                        {String.fromCharCode(65 + Number(q.correctAnswer))}
                      </p>
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

                  {/* Lời giải thích */}
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
                      Lời giải thích (Hiển thị sau khi học viên nộp bài):
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
        )}
      </div>

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
          <span>Lưu bộ câu hỏi vào bài học</span>
        </button>
      </div>
    </div>
  );
};
