/**
 * Phân tích JSON an toàn từ Fetch Response, tránh lỗi thô
 * "Unexpected end of JSON input" khi máy chủ hoặc proxy trả phản hồi rỗng/HTML.
 */
export const parseJsonSafe = async <T = unknown>(
  res: Response,
  fallbackErrorMsg = 'Không thể kết nối đến máy chủ hoặc phản hồi không hợp lệ',
): Promise<T> => {
  if (res.status === 204) {
    return {} as T;
  }

  const raw = await res.text();
  if (!raw || !raw.trim()) {
    if (!res.ok) {
      throw new Error(
        `${fallbackErrorMsg} (HTTP ${res.status}). Vui lòng kiểm tra máy chủ và thử lại.`,
      );
    }
    throw new Error(`${fallbackErrorMsg} (Phản hồi rỗng từ máy chủ).`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(
      !res.ok
        ? `${fallbackErrorMsg} (HTTP ${res.status}). Vui lòng thử lại.`
        : `${fallbackErrorMsg} (Dữ liệu phản hồi không phải JSON hợp lệ).`,
    );
  }
};

/**
 * Đọc phản hồi JSON và tự động ném Error với message từ API nếu !res.ok.
 */
export const parseApiJson = async <T = unknown>(
  res: Response,
  fallbackErrorMsg: string,
): Promise<T> => {
  const data = await parseJsonSafe<T>(res, fallbackErrorMsg);
  if (!res.ok) {
    const errMsg =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : undefined;
    throw new Error(errMsg || fallbackErrorMsg);
  }
  return data;
};
