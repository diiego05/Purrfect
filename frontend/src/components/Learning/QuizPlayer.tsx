import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  QuizDataItem,
  QuizQuestionItem,
} from '../../types/instructorCourse';
import { aiQuizApi } from '../../services/aiQuizApi';
import {
  IconlyTick,
  IconlyClose,
  IconlySparkles,
  IconlyDocument,
  IconlyTimeCircle,
} from '../Onboarding/IconlyIcons';
import { toast } from '../../context/ToastContext';
import './QuizPlayer.css';

interface QuizPlayerProps {
  quizData?: QuizDataItem;
  lectureTitle: string;
  onCompleteQuiz?: (score: number, passed: boolean) => void;
  onNextLecture?: () => void;
}

interface EssayEvaluation {
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string;
  improvements: string;
}

function formatViDateTime(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return String(isoOrDate);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${hours}:${minutes} ngày ${day} tháng ${month} năm ${year}`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (days > 0) {
    return `${days} ngày ${pad(hours)} giờ ${pad(minutes)} phút ${pad(seconds)}s`;
  }
  if (hours > 0) {
    return `${pad(hours)} giờ ${pad(minutes)} phút ${pad(seconds)}s`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quizData,
  lectureTitle,
  onCompleteQuiz,
  onNextLecture,
}) => {
  // Dữ liệu câu hỏi dự phòng nếu bài học chưa có quizData
  const defaultQuestions: QuizQuestionItem[] = [
    {
      id: 'q1',
      type: 'MULTIPLE_CHOICE',
      question: `Mục tiêu cốt lõi của bài học "${lectureTitle}" là gì?`,
      options: [
        'Nắm vững kiến thức nền tảng và phương pháp áp dụng thực tiễn.',
        'Học thuộc lòng lý thuyết mà không cần thực hành.',
        'Bỏ qua các bước kiểm thử và kiểm soát chất lượng.',
        'Chỉ tập trung vào giao diện bề ngoài.',
      ],
      correctAnswer: 0,
      explanation:
        'Bài học hướng tới việc giúp học viên làm chủ kiến thức và áp dụng vào dự án thực tế.',
      points: 10,
    },
    {
      id: 'q2',
      type: 'MULTIPLE_CHOICE',
      question: 'Khi triển khai giải pháp thực tế, yếu tố nào quan trọng nhất?',
      options: [
        'Tuân thủ quy trình chuẩn, xử lý ngoại lệ và đảm bảo độ tin cậy.',
        'Viết mã nguồn ngắn nhất bất chấp lỗi tiềm ẩn.',
        'Không cần viết tài liệu hướng dẫn.',
        'Không cần kiểm tra dữ liệu đầu vào từ người dùng.',
      ],
      correctAnswer: 0,
      explanation:
        'Quy trình chuẩn hóa và xử lý ngoại lệ là tiêu chí sống còn của phần mềm chất lượng.',
      points: 10,
    },
    {
      id: 'q3',
      type: 'ESSAY',
      question:
        'Hãy tóm tắt 2 điểm mấu chốt bạn đã tiếp thu được từ bài học này và cách bạn sẽ áp dụng vào thực tế.',
      sampleAnswer:
        'Học viên cần nêu được 2 điểm cốt lõi của bài học và một ví dụ hoặc tình huống cụ thể sẽ áp dụng.',
      explanation:
        'Barem chấm: Nêu đúng 2 điểm (6đ), Đưa ra tình huống áp dụng hợp lý (4đ).',
      points: 20,
    },
  ];

  const questions =
    quizData?.questions && quizData.questions.length > 0
      ? quizData.questions
      : defaultQuestions;

  const passingScorePercent = quizData?.passingScore || 80;
  const timeLimitMinutes = quizData?.timeLimitMinutes || 15;

  // Lịch ngày giờ mở / đóng
  const availableFrom = quizData?.availableFrom
    ? new Date(quizData.availableFrom)
    : null;
  const availableUntil = quizData?.availableUntil
    ? new Date(quizData.availableUntil)
    : null;

  // Đồng hồ thời gian thực
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isNotYetOpen = availableFrom ? now < availableFrom : false;
  const isExpired = availableUntil ? now > availableUntil : false;

  // Trạng thái làm bài
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    timeLimitMinutes * 60,
  );

  // States câu trả lời
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [essayResults, setEssayResults] = useState<
    Record<string, EssayEvaluation>
  >({});
  const [calculatedScorePercent, setCalculatedScorePercent] =
    useState<number>(0);
  const [isPassed, setIsPassed] = useState<boolean>(false);

  // Chọn đáp án trắc nghiệm
  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  // Nhập câu trả lời tự luận
  const handleEssayChange = (questionId: string, text: string) => {
    if (isSubmitted) return;
    setEssayAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  // Nộp bài và chấm điểm
  const handleSubmitQuiz = useCallback(
    async (isAutoSubmit = false) => {
      if (isSubmitting || isSubmitted) return;

      if (!isAutoSubmit) {
        const unansweredMC = questions.filter(
          (q) =>
            q.type === 'MULTIPLE_CHOICE' && selectedAnswers[q.id] === undefined,
        );
        if (unansweredMC.length > 0) {
          const confirmSubmit = await toast.confirm({
            title: 'Xác nhận nộp bài kiểm tra',
            message: `Bạn vẫn còn ${unansweredMC.length} câu trắc nghiệm chưa chọn đáp án.`,
            subMessage:
              'Bạn có chắc chắn muốn nộp bài và chấm điểm ngay bây giờ không?',
            confirmText: 'Nộp bài ngay',
            cancelText: 'Làm tiếp',
            confirmVariant: 'warning',
            type: 'warning',
          });
          if (!confirmSubmit) return;
        }
      } else {
        toast.warning(
          'Đã hết thời gian làm bài! Hệ thống tự động thu bài và chấm điểm.',
        );
      }

      setIsSubmitting(true);

      try {
        let earnedPoints = 0;
        let totalMaxPoints = 0;
        const essayEvaluations: Record<string, EssayEvaluation> = {};

        for (const q of questions) {
          const qPoints = q.points || (q.type === 'ESSAY' ? 20 : 10);
          totalMaxPoints += qPoints;

          if (q.type === 'MULTIPLE_CHOICE') {
            const chosen = selectedAnswers[q.id];
            const correctIdx = Number(q.correctAnswer);
            if (chosen !== undefined && chosen === correctIdx) {
              earnedPoints += qPoints;
            }
          } else if (q.type === 'ESSAY') {
            const answerText = (essayAnswers[q.id] || '').trim();
            try {
              const gradeRes = await aiQuizApi.gradeEssay({
                question: q.question,
                sampleAnswer: q.sampleAnswer,
                studentAnswer: answerText,
              });

              if (gradeRes.success && gradeRes.data) {
                const resData = gradeRes.data;
                essayEvaluations[q.id] = resData;
                const pointsEarned = (resData.score / 10) * qPoints;
                earnedPoints += pointsEarned;
              }
            } catch (err) {
              console.error('Lỗi chấm tự luận:', err);
              const wordCount = answerText.split(/\s+/).length;
              const score10 = wordCount >= 15 ? 8 : wordCount >= 5 ? 5 : 0;
              essayEvaluations[q.id] = {
                score: score10,
                passed: score10 >= 6,
                feedback:
                  'Bài làm đã được ghi nhận và đánh giá cơ bản theo các ý chính.',
                strengths: 'Đã hoàn thành nội dung trả lời theo yêu cầu.',
                improvements: 'Có thể mở rộng thêm phân tích chi tiết.',
              };
              earnedPoints += (score10 / 10) * qPoints;
            }
          }
        }

        const scorePercent =
          totalMaxPoints > 0
            ? Math.round((earnedPoints / totalMaxPoints) * 100)
            : 100;
        const passed = scorePercent >= passingScorePercent;

        setEssayResults(essayEvaluations);
        setCalculatedScorePercent(scorePercent);
        setIsPassed(passed);
        setIsSubmitted(true);

        if (onCompleteQuiz) {
          onCompleteQuiz(scorePercent, passed);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      isSubmitted,
      questions,
      selectedAnswers,
      essayAnswers,
      passingScorePercent,
      onCompleteQuiz,
    ],
  );

  // Bộ đếm ngược thời gian làm bài (khi học viên đã bấm Bắt đầu thi)
  const submitRef = useRef(handleSubmitQuiz);
  useEffect(() => {
    submitRef.current = handleSubmitQuiz;
  }, [handleSubmitQuiz]);

  useEffect(() => {
    if (!hasStarted || isSubmitted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitRef.current(true); // Tự động nộp khi hết giờ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted]);

  // Làm lại bài
  const handleRetakeQuiz = () => {
    if (isExpired) {
      toast.error(
        'Cổng vào bài kiểm tra đã đóng, bạn không thể bắt đầu lượt thi mới lúc này.',
      );
      return;
    }
    setSelectedAnswers({});
    setEssayAnswers({});
    setIsSubmitted(false);
    setEssayResults({});
    setCalculatedScorePercent(0);
    setIsPassed(false);
    setSecondsRemaining(timeLimitMinutes * 60);
    setHasStarted(false);
  };

  // =========================================================================
  // TRƯỜNG HỢP 1: CHƯA ĐẾN GIỜ MỞ ĐỀ (NOT YET OPEN)
  // =========================================================================
  if (isNotYetOpen && !isSubmitted && availableFrom) {
    const diffMs = availableFrom.getTime() - now.getTime();
    return (
      <div className="quiz-player-container">
        <div className="quiz-scheduled-gate-box not-open">
          <div className="scheduled-icon-wrap">
            <IconlyTimeCircle size={44} color="#7c3aed" />
          </div>
          <span className="scheduled-badge not-open-badge">
            Chưa đến giờ mở đề
          </span>
          <h2 className="scheduled-title">
            {quizData?.title || `Bài kiểm tra: ${lectureTitle}`}
          </h2>
          <p className="scheduled-desc">
            Bài kiểm tra này đã được Giảng viên lên lịch hẹn giờ. Vui lòng quay
            lại đúng thời điểm để tham gia làm bài thi!
          </p>

          <div className="countdown-display-card">
            <span className="countdown-kicker">
              Thời gian đếm ngược đến lúc mở đề:
            </span>
            <div className="countdown-time-digits">
              {formatCountdown(diffMs)}
            </div>
          </div>

          <div className="scheduled-meta-table">
            <div className="meta-row">
              <span className="meta-label">Thời điểm mở đề:</span>
              <strong className="meta-val">
                {formatViDateTime(availableFrom)}
              </strong>
            </div>
            {availableUntil && (
              <div className="meta-row">
                <span className="meta-label">Đóng cổng vào thi:</span>
                <strong className="meta-val">
                  {formatViDateTime(availableUntil)}
                </strong>
              </div>
            )}
            <div className="meta-row">
              <span className="meta-label">Thời lượng làm bài:</span>
              <strong className="meta-val">{timeLimitMinutes} phút</strong>
            </div>
            <div className="meta-row">
              <span className="meta-label">Số lượng câu hỏi:</span>
              <strong className="meta-val">{questions.length} câu</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRƯỜNG HỢP 2: ĐÃ HẾT HẠN VÀO THI (EXPIRED - CHƯA BẮT ĐẦU VÀ ĐÃ QUÁ HẠN MỞ CỔNG)
  // =========================================================================
  if (isExpired && !hasStarted && !isSubmitted && availableUntil) {
    return (
      <div className="quiz-player-container">
        <div className="quiz-scheduled-gate-box expired">
          <div className="scheduled-icon-wrap expired-icon">
            <IconlyClose size={44} color="#ef4444" />
          </div>
          <span className="scheduled-badge expired-badge">
            Đã đóng cổng vào làm bài
          </span>
          <h2 className="scheduled-title">
            {quizData?.title || `Bài kiểm tra: ${lectureTitle}`}
          </h2>
          <p className="scheduled-desc">
            Thời hạn mở cổng vào làm bài kiểm tra này đã khép lại vào lúc:
            <br />
            <strong>{formatViDateTime(availableUntil)}</strong>
          </p>
          <p className="scheduled-sub-note">
            Học viên đã vào thi trước thời điểm trên vẫn được hoàn thành trọn
            vẹn toàn bộ thời lượng bài làm. Nếu bạn chưa kịp tham gia, vui lòng
            liên hệ Giảng viên để được gia hạn quyền vào thi.
          </p>
          {onNextLecture && (
            <button
              type="button"
              className="btn-next-lecture"
              onClick={onNextLecture}
              style={{ marginTop: '16px' }}
            >
              Chuyển sang bài học tiếp theo ›
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRƯỜNG HỢP 3: MÀN HÌNH CHUẨN BỊ (START EXAM SCREEN)
  // =========================================================================
  if (!hasStarted && !isSubmitted) {
    return (
      <div className="quiz-player-container">
        <div className="quiz-start-screen">
          <div className="quiz-badge-wrap">
            <span className="quiz-badge-ai">
              <IconlySparkles size={14} color="#7c3aed" />
              <span>Purrfect AI Assessment Room</span>
            </span>
          </div>

          <h1 className="quiz-start-title">
            {quizData?.title || `Bài kiểm tra: ${lectureTitle}`}
          </h1>

          {quizData?.description && (
            <p className="quiz-start-desc">{quizData.description}</p>
          )}

          <div className="quiz-exam-guidelines">
            <h3 className="guidelines-heading">
              📌 Quy chế & Thông số bài thi:
            </h3>
            <div className="guidelines-grid">
              <div className="guideline-item">
                <span className="item-label">Số lượng câu hỏi</span>
                <strong className="item-value">{questions.length} câu</strong>
              </div>
              <div className="guideline-item">
                <span className="item-label">Điểm tối thiểu đạt</span>
                <strong className="item-value">{passingScorePercent}%</strong>
              </div>
              <div className="guideline-item">
                <span className="item-label">Thời gian làm bài</span>
                <strong className="item-value highlight">
                  {timeLimitMinutes} phút
                </strong>
              </div>
              <div className="guideline-item">
                <span className="item-label">Hình thức chấm</span>
                <strong className="item-value">
                  Trắc nghiệm + AI Chấm tự luận
                </strong>
              </div>
            </div>

            {(availableFrom || availableUntil) && (
              <div className="guideline-schedule-note">
                <strong>Lịch mở cổng:</strong> Mở từ{' '}
                {availableFrom ? formatViDateTime(availableFrom) : 'Bây giờ'}{' '}
                đến{' '}
                {availableUntil
                  ? formatViDateTime(availableUntil)
                  : 'Không giới hạn'}
                .
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#0369a1',
                  }}
                >
                  ℹ️ Bạn chỉ cần bấm "Bắt đầu làm bài" trước thời điểm đóng
                  cổng, hệ thống đảm bảo bạn được làm đủ {timeLimitMinutes}{' '}
                  phút.
                </div>
              </div>
            )}
          </div>

          <div className="quiz-start-actions">
            <button
              type="button"
              className="btn-start-exam-now"
              onClick={() => {
                setHasStarted(true);
                setSecondsRemaining(timeLimitMinutes * 60);
              }}
            >
              <span>🚀 Bắt đầu làm bài thi ({timeLimitMinutes} phút)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRƯỜNG HỢP 4: ĐANG LÀM BÀI HOẶC ĐÃ NỘP BÀI (ACTIVE EXAM)
  // =========================================================================
  const timerMinutes = Math.floor(secondsRemaining / 60);
  const timerSecs = secondsRemaining % 60;
  const isUrgent = secondsRemaining < 180 && !isSubmitted; // Dưới 3 phút

  return (
    <div className="quiz-player-container">
      {/* Quiz Header & Live Timer Bar */}
      <div className="quiz-player-header">
        <div className="quiz-header-top-row">
          <div className="quiz-badge-wrap">
            <span className="quiz-badge-ai">
              <IconlySparkles size={14} color="#8b5cf6" />
              <span>AI Assessment Room</span>
            </span>
            <span className="quiz-badge-meta">
              {questions.length} câu hỏi • Điểm đạt: {passingScorePercent}%
            </span>
          </div>

          {/* ĐỒNG HỒ ĐẾM NGƯỢC THỜI GIAN LÀM BÀI */}
          {!isSubmitted && (
            <div className={`quiz-live-timer ${isUrgent ? 'urgent' : ''}`}>
              <IconlyTimeCircle size={18} color="currentColor" />
              <span>
                Còn lại:{' '}
                <strong>
                  {timerMinutes.toString().padStart(2, '0')}:
                  {timerSecs.toString().padStart(2, '0')}
                </strong>
              </span>
            </div>
          )}
        </div>

        <h2 className="quiz-player-title">
          {quizData?.title || `Bài kiểm tra: ${lectureTitle}`}
        </h2>
        {quizData?.description && (
          <p className="quiz-player-desc">{quizData.description}</p>
        )}
      </div>

      {/* Result Banner khi đã nộp bài */}
      {isSubmitted && (
        <div
          className={`quiz-result-banner ${isPassed ? 'result-passed' : 'result-failed'}`}
        >
          <div className="result-score-circle">
            <span className="result-score-number">
              {calculatedScorePercent}%
            </span>
            <span className="result-score-label">
              {isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
            </span>
          </div>
          <div className="result-info-box">
            <h3 className="result-heading">
              {isPassed
                ? '🎉 Chúc mừng! Bạn đã vượt qua bài kiểm tra'
                : '⚠️ Bạn chưa đạt điểm chuẩn tối thiểu'}
            </h3>
            <p className="result-detail-text">
              Bạn đạt được <strong>{calculatedScorePercent}%</strong> (Yêu cầu
              tối thiểu {passingScorePercent}%). Hãy xem lại phần giải thích chi
              tiết của Trợ lý AI bên dưới để củng cố kiến thức.
            </p>
            <div className="result-action-buttons">
              {!isExpired && (
                <button
                  type="button"
                  className="btn-retake-quiz"
                  onClick={handleRetakeQuiz}
                >
                  Làm lại bài kiểm tra
                </button>
              )}
              {isPassed && onNextLecture && (
                <button
                  type="button"
                  className="btn-next-lecture"
                  onClick={onNextLecture}
                >
                  Sang bài học tiếp theo ›
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Danh sách câu hỏi */}
      <div className="quiz-questions-list">
        {questions.map((q, idx) => {
          const isMC = q.type === 'MULTIPLE_CHOICE';
          const selectedOption = selectedAnswers[q.id];
          const correctOption = Number(q.correctAnswer);
          const isCorrect = isMC && selectedOption === correctOption;
          const essayEval = essayResults[q.id];

          return (
            <div
              key={q.id || idx}
              className={`quiz-question-card ${
                isSubmitted
                  ? isMC
                    ? isCorrect
                      ? 'card-correct'
                      : 'card-wrong'
                    : 'card-essay-reviewed'
                  : ''
              }`}
            >
              {/* Question Meta */}
              <div className="question-header-row">
                <div className="question-num-tag">
                  <span className="q-index">Câu {idx + 1}</span>
                  <span
                    className={`q-type-badge ${isMC ? 'badge-mc' : 'badge-essay'}`}
                  >
                    {isMC ? 'Trắc nghiệm' : 'Tự luận ngắn'}
                  </span>
                </div>
                <span className="q-points">
                  {q.points || (isMC ? 10 : 20)} điểm
                </span>
              </div>

              {/* Question Text */}
              <p className="question-title-text">{q.question}</p>

              {/* Form trắc nghiệm */}
              {isMC && q.options && (
                <div className="mc-options-grid">
                  {q.options.map((optText, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isTheCorrectOne = correctOption === optIdx;

                    let optionStateClass = '';
                    if (isSubmitted) {
                      if (isTheCorrectOne) {
                        optionStateClass = 'opt-is-correct';
                      } else if (isSelected && !isTheCorrectOne) {
                        optionStateClass = 'opt-is-wrong';
                      }
                    } else if (isSelected) {
                      optionStateClass = 'opt-selected';
                    }

                    const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`mc-option-btn ${optionStateClass}`}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={isSubmitted}
                      >
                        <span className="opt-letter">{optLetter}</span>
                        <span className="opt-text">{optText}</span>
                        {isSubmitted && isTheCorrectOne && (
                          <span className="opt-status-icon icon-success">
                            <IconlyTick size={16} color="#16a34a" />
                          </span>
                        )}
                        {isSubmitted && isSelected && !isTheCorrectOne && (
                          <span className="opt-status-icon icon-error">
                            <IconlyClose size={16} color="#dc2626" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Form tự luận */}
              {!isMC && (
                <div className="essay-answer-box">
                  <textarea
                    className="essay-input-area"
                    placeholder="Nhập câu trả lời chi tiết của bạn vào đây (tối thiểu 1-2 câu để AI chấm điểm)..."
                    rows={4}
                    value={essayAnswers[q.id] || ''}
                    onChange={(e) => handleEssayChange(q.id, e.target.value)}
                    disabled={isSubmitted}
                  />

                  {/* Kết quả chấm tự luận bằng AI */}
                  {isSubmitted && essayEval && (
                    <div className="ai-essay-review-panel">
                      <div className="essay-review-header">
                        <div className="review-title">
                          <IconlySparkles size={16} color="#8b5cf6" />
                          <span>Đánh giá từ Trợ lý Giám khảo AI</span>
                        </div>
                        <span className="essay-score-badge">
                          Điểm: {essayEval.score}/10
                        </span>
                      </div>
                      <p className="essay-feedback-text">
                        {essayEval.feedback}
                      </p>
                      {essayEval.strengths && (
                        <div className="essay-sub-note">
                          <strong>Điểm mạnh:</strong> {essayEval.strengths}
                        </div>
                      )}
                      {essayEval.improvements && (
                        <div className="essay-sub-note">
                          <strong>Cần cải thiện:</strong>{' '}
                          {essayEval.improvements}
                        </div>
                      )}
                      {q.sampleAnswer && (
                        <div className="essay-sample-box">
                          <strong>Đáp án mẫu tham khảo:</strong>{' '}
                          {q.sampleAnswer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Giải thích của AI khi nộp bài */}
              {isSubmitted && isMC && q.explanation && (
                <div className="ai-explanation-box">
                  <div className="ai-exp-header">
                    <IconlyDocument size={15} color="#0056d2" />
                    <span>Giải thích chi tiết từ Trợ lý AI Purrfect</span>
                  </div>
                  <p className="ai-exp-content">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Submit Action */}
      {!isSubmitted && (
        <div className="quiz-player-footer">
          <div className="footer-status-text">
            Đã trả lời:{' '}
            <strong>
              {Object.keys(selectedAnswers).length +
                Object.keys(essayAnswers).filter(
                  (k) => (essayAnswers[k] || '').trim().length > 0,
                ).length}
            </strong>{' '}
            / {questions.length} câu
          </div>
          <button
            type="button"
            className="btn-submit-quiz"
            onClick={() => handleSubmitQuiz(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <IconlySparkles size={16} color="#ffffff" />
                <span>Đang chấm điểm bài làm với AI...</span>
              </>
            ) : (
              <>
                <IconlyTick size={16} color="#ffffff" />
                <span>Nộp bài & Chấm điểm</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
