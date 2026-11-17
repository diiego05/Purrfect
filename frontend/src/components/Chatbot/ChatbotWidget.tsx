import { useState, useEffect, useRef, Fragment, type MouseEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChatbot } from '../../context/ChatbotContext';
import { aiChatApi } from '../../services/aiChatApi';
import type { ChatMessage, ChatSuggestedCourse } from '../../types/aiChat';
import {
  IconlyArrowRight,
  IconlyAward,
  IconlyBot,
  IconlyBulb,
  IconlyChevronDown,
  IconlyChevronUp,
  IconlyClose,
  IconlyDocument,
  IconlyInfoCircle,
  IconlyRefresh,
  IconlySend,
} from '../Onboarding/IconlyIcons';
import './ChatbotWidget.css';

let msgSeq = 0;
const getMsgId = (prefix: string) => `${prefix}_${++msgSeq}`;

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là **Trợ lý AI của Purrfect**.\n\nTôi có thể giúp bạn:\n- Gợi ý khóa học phù hợp với nhu cầu và trình độ\n- Tư vấn lộ trình học tập từ cơ bản đến nâng cao\n- Giải đáp chính sách hoàn tiền, chứng chỉ, thanh toán\n\nBạn cần hỗ trợ gì hôm nay?',
  timestamp: new Date(),
};

const DEFAULT_QUICK_SUGGESTIONS = [
  'Gợi ý khóa học cho người mới bắt đầu',
  'Chính sách hoàn tiền như thế nào?',
  'Làm sao để nhận chứng chỉ?',
  'Có khóa học miễn phí nào không?',
  'Gợi ý lộ trình học lập trình Web',
];

export const ChatbotWidget = () => {
  const { navigate, currentPath } = useAuth();
  const {
    isOpen,
    isMinimized,
    setIsMinimized,
    closeChat,
    inputText,
    setInputText,
  } = useChatbot();
  const [messages, setMessages] = useState<ChatMessage[]>([
    DEFAULT_WELCOME_MESSAGE,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(
    DEFAULT_QUICK_SUGGESTIONS,
  );
  const [fallbackInfo, setFallbackInfo] = useState<{
    message: string;
    supportEmail?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tự động cuộn xuống cuối tin nhắn
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus ô nhập khi mở chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Tải danh sách câu hỏi gợi ý nhanh
  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      try {
        const suggRes = await aiChatApi.getSuggestions();
        if (
          !cancelled &&
          suggRes.success &&
          suggRes.data &&
          suggRes.data.length > 0
        ) {
          setSuggestions(suggRes.data);
        }
      } catch {
        // Sử dụng mặc định nếu lỗi
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Xử lý gửi tin nhắn dạng Server-Sent Events (SSE) Token Streaming (< 3s)
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsgId = getMsgId('user');
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    const assistantMsgId = getMsgId('ai');
    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg, newAssistantMsg]);
    setInputText('');
    setIsLoading(true);
    setFallbackInfo(null);

    await aiChatApi.sendMessageStream(query, {
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + token }
              : msg,
          ),
        );
      },
      onDone: ({ suggestedCourses }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, suggestedCourses } : msg,
          ),
        );
        setIsLoading(false);
      },
      onError: (errorMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    errorMessage ||
                    'Trợ lý AI đang bận phản hồi. Bạn có thể tham khảo Danh mục khóa học nổi bật hoặc gửi yêu cầu tới bộ phận Hỗ trợ khách hàng.',
                }
              : msg,
          ),
        );
        setFallbackInfo({
          message: errorMessage || 'Dịch vụ AI đang gặp gián đoạn tạm thời.',
          supportEmail: 'support@purrfect.com',
        });
        setIsLoading(false);
      },
    });
  };

  // Nhấn Enter để gửi
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Xóa lịch sử chat để bắt đầu cuộc trò chuyện mới
  const handleResetChat = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setFallbackInfo(null);
  };

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      href.startsWith('/') ||
      href.startsWith(window.location.origin) ||
      /^(?:https?:\/\/[^/]+)?\/courses\/[^/\s]+/.test(href)
    ) {
      e.preventDefault();
      const internalPath = href.replace(/^https?:\/\/[^/]+/, '');
      navigate(
        internalPath.startsWith('/') ? internalPath : `/${internalPath}`,
      );
      setIsMinimized(true);
    }
  };

  // Định dạng nội dung tin nhắn dạng Markdown cơ bản (đậm, link markdown, link thô)
  const renderFormattedLine = (line: string, lineKey: number) => {
    const tokenRegex =
      /(\[[^\]]+\]\([^)]+\)|\*\*.*?\*\*|https?:\/\/[^\s<)]+|\/courses\/[a-zA-Z0-9_-]+)/g;
    const parts = line.split(tokenRegex);

    return (
      <span key={lineKey} className="chatbot-text-line">
        {parts.map((part, pIdx) => {
          if (!part) return null;

          const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (mdMatch) {
            const [, label, href] = mdMatch;
            return (
              <a
                key={pIdx}
                href={href}
                className="chatbot-inline-link"
                onClick={(e) => handleLinkClick(e, href)}
              >
                {label}
              </a>
            );
          }

          if (
            part.startsWith('**') &&
            part.endsWith('**') &&
            part.length >= 4
          ) {
            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
          }

          if (
            part.startsWith('http://') ||
            part.startsWith('https://') ||
            part.startsWith('/courses/')
          ) {
            return (
              <a
                key={pIdx}
                href={part}
                className="chatbot-inline-link"
                onClick={(e) => handleLinkClick(e, part)}
              >
                {part}
              </a>
            );
          }

          return part;
        })}
      </span>
    );
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => (
      <Fragment key={idx}>
        {renderFormattedLine(line, idx)}
        {idx < lines.length - 1 && <br />}
      </Fragment>
    ));
  };

  // Ẩn chatbot khi chưa mở hoặc trên phân hệ Quản trị viên (Admin)
  if (currentPath.startsWith('/admin') || !isOpen) {
    return null;
  }

  return (
    <aside
      className="chatbot-widget-container"
      aria-label="Khung Trợ lý AI tư vấn"
    >
      {/* Cửa sổ chat */}
      <div
        className={`chatbot-window ${isMinimized ? 'chatbot-window--minimized' : ''}`}
        role="dialog"
        aria-labelledby="chatbot-header-title"
      >
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar-badge" aria-hidden="true">
              <IconlyBot size={20} color="#ffffff" />
              <span
                className="chatbot-status-dot"
                title="Sẵn sàng hỗ trợ"
              ></span>
            </div>
            <div>
              <h3 id="chatbot-header-title" className="chatbot-title">
                Trợ lý AI Purrfect
              </h3>
              <span className="chatbot-subtitle">
                Tư vấn RAG & Lộ trình học tập
              </span>
            </div>
          </div>

          <div className="chatbot-header-actions">
            {/* Nút Reset */}
            <button
              type="button"
              className="chatbot-header-btn"
              onClick={handleResetChat}
              title="Làm mới cuộc trò chuyện"
              aria-label="Làm mới cuộc trò chuyện"
            >
              <IconlyRefresh size={16} color="currentColor" />
            </button>

            {/* Nút Thu nhỏ / Phóng to */}
            <button
              type="button"
              className="chatbot-header-btn"
              onClick={() => setIsMinimized((prev) => !prev)}
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
              aria-label={
                isMinimized ? 'Mở rộng cửa sổ chat' : 'Thu nhỏ cửa sổ chat'
              }
            >
              {isMinimized ? (
                <IconlyChevronUp size={16} color="currentColor" />
              ) : (
                <IconlyChevronDown size={16} color="currentColor" />
              )}
            </button>

            {/* Nút Đóng */}
            <button
              type="button"
              className="chatbot-header-btn chatbot-header-btn--close"
              onClick={closeChat}
              title="Đóng cửa sổ"
              aria-label="Đóng cửa sổ chat"
            >
              <IconlyClose size={16} color="currentColor" />
            </button>
          </div>
        </div>

        {/* Body tin nhắn (ẩn khi minimized) */}
        {!isMinimized && (
          <>
            <div className="chatbot-messages" role="log" aria-live="polite">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chatbot-message-row chatbot-message-row--${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="chatbot-msg-avatar" aria-hidden="true">
                      <IconlyBot size={18} color="#4f46e5" />
                    </div>
                  )}

                  <div className="chatbot-msg-content-wrapper">
                    <div
                      className={`chatbot-bubble chatbot-bubble--${msg.role}`}
                    >
                      {msg.content ? (
                        <>
                          {renderFormattedText(msg.content)}
                          {isLoading &&
                            msg.role === 'assistant' &&
                            msg.id === messages[messages.length - 1]?.id && (
                              <span className="chatbot-streaming-cursor">
                                ▍
                              </span>
                            )}
                        </>
                      ) : (
                        <div className="chatbot-bubble--loading">
                          <span className="chatbot-dot"></span>
                          <span className="chatbot-dot"></span>
                          <span className="chatbot-dot"></span>
                        </div>
                      )}
                    </div>

                    {/* Danh sách thẻ khóa học gợi ý */}
                    {msg.suggestedCourses &&
                      msg.suggestedCourses.length > 0 && (
                        <div className="chatbot-courses-container">
                          <span className="chatbot-courses-label">
                            <IconlyAward size={15} color="#4f46e5" />
                            <span>Khóa học phù hợp gợi ý cho bạn:</span>
                          </span>
                          <div className="chatbot-courses-list">
                            {msg.suggestedCourses.map(
                              (c: ChatSuggestedCourse) => (
                                <div
                                  key={c._id}
                                  className="chatbot-course-card"
                                >
                                  {c.thumbnailUrl ? (
                                    <img
                                      src={c.thumbnailUrl}
                                      alt={c.title}
                                      className="chatbot-course-thumb"
                                    />
                                  ) : (
                                    <div className="chatbot-course-thumb-placeholder">
                                      <IconlyDocument
                                        size={22}
                                        color="#4f46e5"
                                      />
                                    </div>
                                  )}
                                  <div className="chatbot-course-info">
                                    <div
                                      className="chatbot-course-title"
                                      title={c.title}
                                    >
                                      {c.title}
                                    </div>
                                    <div className="chatbot-course-meta">
                                      {c.level && (
                                        <span className="chatbot-course-level">
                                          {c.level}
                                        </span>
                                      )}
                                      <span className="chatbot-course-price">
                                        {c.price === 0
                                          ? 'Miễn phí'
                                          : `${(c.discountPrice || c.price || 0).toLocaleString('vi-VN')}đ`}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className="chatbot-course-btn"
                                      onClick={() => {
                                        const target = (
                                          c.slug ||
                                          c._id ||
                                          ''
                                        ).replace(/^\/+/, '');
                                        if (!target) return;
                                        navigate(
                                          target.startsWith('courses/')
                                            ? `/${target}`
                                            : `/courses/${encodeURIComponent(target)}`,
                                        );
                                        setIsMinimized(true);
                                      }}
                                    >
                                      <span>Xem chi tiết</span>
                                      <IconlyArrowRight
                                        size={13}
                                        color="currentColor"
                                      />
                                    </button>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    <span className="chatbot-msg-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Fallback trợ giúp khi gặp Exception 3a */}
              {fallbackInfo && (
                <div className="chatbot-fallback-box">
                  <div className="chatbot-fallback-title">
                    <IconlyInfoCircle size={15} color="currentColor" />
                    <span>Cần thêm hỗ trợ trực tiếp?</span>
                  </div>
                  <p className="chatbot-fallback-desc">
                    Bạn có thể gửi câu hỏi tới email{' '}
                    <strong>
                      {fallbackInfo.supportEmail || 'support@purrfect.com'}
                    </strong>{' '}
                    hoặc hotline <strong>1900-xxxx</strong> (8:00 - 22:00) để
                    được đội ngũ CSKH phản hồi trực tiếp.
                  </p>
                  <button
                    type="button"
                    className="chatbot-fallback-btn"
                    onClick={() => navigate('/')}
                  >
                    Khám phá danh mục khóa học nổi bật
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Gợi ý câu hỏi nhanh (Alternative Flow 2a) */}
            {suggestions.length > 0 && (
              <div className="chatbot-suggestions">
                <span className="chatbot-suggestions-title">
                  <IconlyBulb size={14} color="#64748b" />
                  <span>Gợi ý nhanh:</span>
                </span>
                <div className="chatbot-suggestions-scroll">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chatbot-suggestion-chip"
                      onClick={() => handleSendMessage(sug)}
                      disabled={isLoading}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Khung nhập tin nhắn */}
            <div className="chatbot-input-container">
              <input
                ref={inputRef}
                type="text"
                className="chatbot-input"
                placeholder="Nhập câu hỏi cần tư vấn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                aria-label="Nội dung câu hỏi tư vấn"
              />
              <button
                type="button"
                className="chatbot-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                aria-label="Gửi tin nhắn"
              >
                <IconlySend size={17} color="currentColor" />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
