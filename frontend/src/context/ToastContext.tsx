import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type FC,
  type ReactNode,
} from 'react';
import {
  IconlyTick,
  IconlyDanger,
  IconlyInfoCircle,
  IconlySparkles,
  IconlyClose,
} from '../components/Onboarding/IconlyIcons';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ModalItem {
  isOpen: boolean;
  title: string;
  message: string;
  type: ToastType;
  confirmText?: string;
  onConfirm?: () => void;
}

export interface ConfirmModalOptions {
  title?: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ToastType;
  confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    title?: string,
    duration?: number,
  ) => void;
  showModal: (
    message: string,
    title?: string,
    type?: ToastType,
    confirmText?: string,
  ) => void;
  confirm: (
    optionsOrMessage: string | ConfirmModalOptions,
    title?: string,
    type?: ToastType,
  ) => Promise<boolean>;
  closeToast: (id: string) => void;
  closeModal: () => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  ai: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Singleton reference for global calls outside React components
type ToastHandler = (
  message: string,
  type?: ToastType,
  title?: string,
  duration?: number,
) => void;
type ModalHandler = (
  message: string,
  title?: string,
  type?: ToastType,
  confirmText?: string,
) => void;
const DANGER_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const WARNING_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const INFO_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0056d2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
const SUCCESS_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

// eslint-disable-next-line react-refresh/only-export-components
export function showDirectConfirmModal(
  optionsOrMessage: string | ConfirmModalOptions,
  customTitle?: string,
  customType: ToastType = 'warning',
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let opts: ConfirmModalOptions;
    if (typeof optionsOrMessage === 'string') {
      const parts = optionsOrMessage.split('\n\n');
      const mainMsg = parts[0];
      const subMsg = parts.slice(1).join('\n\n');
      const isDestructive = /xóa|chặn|hủy/i.test(optionsOrMessage);
      opts = {
        message: mainMsg,
        subMessage: subMsg || undefined,
        title:
          customTitle ||
          (isDestructive ? 'Xác nhận thao tác' : 'Thông báo xác nhận'),
        type: isDestructive ? 'error' : customType,
        confirmText: /xóa/i.test(optionsOrMessage)
          ? 'Xóa'
          : isDestructive
            ? 'Xác nhận'
            : 'Đồng ý',
        cancelText: 'Hủy bỏ',
        confirmVariant: isDestructive ? 'danger' : 'primary',
      };
    } else {
      opts = optionsOrMessage;
    }

    const title = opts.title || 'Xác nhận thao tác';
    const message = opts.message || '';
    const subMessage = opts.subMessage || '';
    const confirmText = opts.confirmText || 'Xác nhận';
    const cancelText = opts.cancelText || 'Hủy bỏ';
    const type =
      opts.type || (opts.confirmVariant === 'danger' ? 'error' : 'warning');
    const variant =
      opts.confirmVariant || (type === 'error' ? 'danger' : 'primary');

    let iconSvg = INFO_SVG;
    if (type === 'error') iconSvg = DANGER_SVG;
    else if (type === 'warning') iconSvg = WARNING_SVG;
    else if (type === 'success') iconSvg = SUCCESS_SVG;

    const overlay = document.createElement('div');
    overlay.className = 'purr-modal-backdrop';
    overlay.id = `purr-confirm-dialog-${Date.now()}`;

    const card = document.createElement('div');
    card.className = `purr-modal-card purr-modal-${type}`;
    card.setAttribute('role', 'alertdialog');
    card.setAttribute('aria-modal', 'true');

    const escapeHtml = (str: string) =>
      str.replace(
        /[&<>"']/g,
        (m) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[m] || m,
      );

    let subMsgHtml = '';
    if (subMessage) {
      subMsgHtml = `<div class="purr-modal-submessage">${escapeHtml(subMessage)}</div>`;
    }

    card.innerHTML = `
      <div class="purr-modal-icon-badge">${iconSvg}</div>
      <h3 class="purr-modal-title">${escapeHtml(title)}</h3>
      <p class="purr-modal-message">${escapeHtml(message)}</p>
      ${subMsgHtml}
      <div class="purr-modal-actions">
        <button type="button" class="purr-modal-btn-cancel">${escapeHtml(cancelText)}</button>
        <button type="button" class="purr-modal-btn-confirm ${variant}">${escapeHtml(confirmText)}</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    let isCleanedUp = false;
    const cleanup = (confirmed: boolean) => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      window.removeEventListener('keydown', handleKey);
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      resolve(confirmed);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup(false);
      }
    };
    window.addEventListener('keydown', handleKey);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(false);
      }
    });

    const cancelBtn = card.querySelector('.purr-modal-btn-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => cleanup(false));
    }

    const confirmBtn = card.querySelector('.purr-modal-btn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => cleanup(true));
      (confirmBtn as HTMLButtonElement).focus();
    }
  });
}

// Chặn hoàn toàn hộp thoại window.confirm mặc định của trình duyệt ("localhost:5173 cho biết")
if (typeof window !== 'undefined') {
  window.confirm = (msg?: string) => {
    showDirectConfirmModal(String(msg || ''));
    return false;
  };
}

let globalShowToast: ToastHandler | null = null;
let globalShowModal: ModalHandler | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  success: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast(message, 'success', title || 'Thành công');
    }
  },
  error: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast(message, 'error', title || 'Có lỗi xảy ra');
    }
  },
  warning: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast(message, 'warning', title || 'Cảnh báo');
    }
  },
  info: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast(message, 'info', title || 'Thông báo');
    }
  },
  ai: (message: string, title?: string) => {
    if (globalShowToast) {
      globalShowToast(message, 'ai', title || 'Trợ lý AI Purrfect');
    }
  },
  modal: (
    message: string,
    title?: string,
    type?: ToastType,
    confirmText?: string,
  ) => {
    if (globalShowModal) {
      globalShowModal(
        message,
        title || 'Thông báo',
        type || 'info',
        confirmText,
      );
    }
  },
  confirm: (
    optionsOrMessage: string | ConfirmModalOptions,
    title?: string,
    type?: ToastType,
  ): Promise<boolean> => {
    return showDirectConfirmModal(optionsOrMessage, title, type);
  },
};

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalItem>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      title?: string,
      duration: number = 3800,
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let defaultTitle = title;
      if (!defaultTitle) {
        if (type === 'success') defaultTitle = 'Thành công';
        else if (type === 'error') defaultTitle = 'Có lỗi xảy ra';
        else if (type === 'warning') defaultTitle = 'Cảnh báo';
        else if (type === 'ai') defaultTitle = 'Purrfect AI';
        else defaultTitle = 'Thông báo';
      }

      setToasts((prev) => [
        ...prev.slice(-4), // Giữ tối đa 5 toast cùng lúc để không choán màn hình
        { id, message, type, title: defaultTitle, duration },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          closeToast(id);
        }, duration);
      }
    },
    [closeToast],
  );

  const showModal = useCallback(
    (
      message: string,
      title: string = 'Thông báo',
      type: ToastType = 'info',
      confirmText: string = 'Đã hiểu',
    ) => {
      setModal({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
      });
    },
    [],
  );

  const confirm = useCallback(
    (
      optionsOrMessage: string | ConfirmModalOptions,
      title?: string,
      type: ToastType = 'warning',
    ): Promise<boolean> => {
      return showDirectConfirmModal(optionsOrMessage, title, type);
    },
    [],
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, 'success', title),
    [showToast],
  );
  const error = useCallback(
    (message: string, title?: string) => showToast(message, 'error', title),
    [showToast],
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast(message, 'warning', title),
    [showToast],
  );
  const info = useCallback(
    (message: string, title?: string) => showToast(message, 'info', title),
    [showToast],
  );
  const ai = useCallback(
    (message: string, title?: string) => showToast(message, 'ai', title),
    [showToast],
  );

  // Lắng nghe phím ESC để đóng modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal.isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal.isOpen, closeModal]);

  // Gán hàm cho singleton toast
  useEffect(() => {
    globalShowToast = showToast;
    globalShowModal = showModal;

    // Chặn hoàn toàn window.alert mặc định ("localhost:5173 cho biết")
    const originalAlert = window.alert;
    window.alert = (msg?: unknown) => {
      const text = String(msg ?? '');
      // Tự động phân loại dựa trên nội dung câu thông báo
      if (/thành công|hoàn tất|đã tạo|đã lưu|sao chép|được duyệt/i.test(text)) {
        if (/ai|quiz|trắc nghiệm/i.test(text)) {
          showToast(text, 'ai', 'Purrfect AI');
        } else {
          showToast(text, 'success', 'Thành công');
        }
      } else if (/lỗi|thất bại|không thể|vui lòng/i.test(text)) {
        showToast(text, 'error', 'Thông báo lỗi');
      } else {
        showToast(text, 'info', 'Thông báo');
      }
    };

    return () => {
      window.alert = originalAlert;
      globalShowToast = null;
      globalShowModal = null;
    };
  }, [showToast, showModal]);

  const renderIcon = (type: ToastType, size: number = 16) => {
    switch (type) {
      case 'success':
        return <IconlyTick size={size} color="#10b981" />;
      case 'error':
        return <IconlyDanger size={size} color="#ef4444" />;
      case 'warning':
        return <IconlyDanger size={size} color="#f59e0b" />;
      case 'ai':
        return <IconlySparkles size={size} color="#7c3aed" />;
      case 'info':
      default:
        return <IconlyInfoCircle size={size} color="#0056d2" />;
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showModal,
        confirm,
        closeToast,
        closeModal,
        success,
        error,
        warning,
        info,
        ai,
      }}
    >
      {children}

      {/* 1. TOP-RIGHT CORNER TOASTS */}
      <div className="purr-toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`purr-toast-card purr-toast-${t.type}`}
            role="alert"
          >
            <div className="purr-toast-icon-wrap">{renderIcon(t.type, 18)}</div>
            <div className="purr-toast-content">
              {t.title && <div className="purr-toast-title">{t.title}</div>}
              <p className="purr-toast-message">{t.message}</p>
            </div>
            <button
              type="button"
              className="purr-toast-close"
              onClick={() => closeToast(t.id)}
              title="Đóng thông báo"
            >
              <IconlyClose size={14} color="currentColor" />
            </button>
            <div className="purr-toast-progress-bar" />
          </div>
        ))}
      </div>

      {/* 2. CENTER SCREEN MODAL NOTIFICATION */}
      {modal.isOpen && (
        <div
          className="purr-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={`purr-modal-card purr-modal-${modal.type}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="purr-modal-icon-badge">
              {renderIcon(modal.type, 28)}
            </div>
            <h3 className="purr-modal-title">{modal.title}</h3>
            <p className="purr-modal-message">{modal.message}</p>
            <button
              type="button"
              className="purr-modal-btn"
              onClick={closeModal}
              autoFocus
            >
              {modal.confirmText || 'Đã hiểu'}
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
