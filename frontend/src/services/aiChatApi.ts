import { authFetch, getAccessToken } from './authApi';
import type {
  AiChatApiResponse,
  AiQuotaInfo,
  ChatSuggestedCourse,
} from '../types/aiChat';

const API_BASE = '/api/ai';

export const aiChatApi = {
  // 1. Gửi tin nhắn dạng thông thường (REST JSON)
  async sendMessage(message: string): Promise<AiChatApiResponse> {
    const res = await authFetch(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return res.json();
  },

  // 2. Gửi tin nhắn dạng Server-Sent Events (SSE) Token Streaming (< 3s)
  async sendMessageStream(
    message: string,
    callbacks: {
      onToken: (token: string) => void;
      onDone: (data: {
        suggestedCourses: ChatSuggestedCourse[];
        quota?: AiQuotaInfo;
      }) => void;
      onError: (errorMessage: string) => void;
    },
  ): Promise<void> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        let errMessage = 'Không thể kết nối đến Trợ lý AI.';
        try {
          const errData = await response.json();
          if (errData.message) errMessage = errData.message;
        } catch {
          // Bỏ qua lỗi parse
        }
        callbacks.onError(errMessage);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('Trình duyệt không hỗ trợ luồng dữ liệu stream.');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'token') {
                callbacks.onToken(parsed.token);
              } else if (parsed.type === 'done') {
                callbacks.onDone({
                  suggestedCourses: parsed.suggestedCourses || [],
                  quota: parsed.quota,
                });
              } else if (parsed.type === 'error') {
                callbacks.onError(parsed.message || 'Lỗi xử lý phản hồi.');
              }
            } catch {
              // Bỏ qua lỗi parse của chunk
            }
          }
        }
      }
    } catch {
      callbacks.onError('Trợ lý AI đang bận phản hồi. Vui lòng thử lại sau.');
    }
  },

  async getQuota(): Promise<{ success: boolean; data?: AiQuotaInfo }> {
    const res = await authFetch(`${API_BASE}/quota`);
    return res.json();
  },

  async resetQuota(): Promise<{ success: boolean; data?: AiQuotaInfo; message?: string }> {
    const res = await authFetch(`${API_BASE}/quota/reset`, {
      method: 'POST',
    });
    return res.json();
  },

  async getSuggestions(): Promise<{ success: boolean; data?: string[] }> {
    const res = await fetch(`${API_BASE}/suggestions`);
    return res.json();
  },
};
