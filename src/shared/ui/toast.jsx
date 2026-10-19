'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/shared/utils/cn.js';

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: {
    container: 'border-success/30 bg-white',
    dot: 'bg-success',
    label: 'Thành công',
  },
  error: {
    container: 'border-sale/30 bg-white',
    dot: 'bg-sale',
    label: 'Lỗi',
  },
  warning: {
    container: 'border-accent-active/40 bg-white',
    dot: 'bg-accent-active',
    label: 'Cảnh báo',
  },
  info: {
    container: 'border-primary/30 bg-white',
    dot: 'bg-primary',
    label: 'Thông tin',
  },
};

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * [SHARED] Toast item — dùng trực tiếp khi cần render tĩnh, thường dùng qua useToast().
 */
export function Toast({ tone = 'info', title, children, onClose, className }) {
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.info;

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-sm border p-4 shadow-lift',
        styles.container,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', styles.dot)}
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-s font-semibold text-ink">{title || styles.label}</p>
        {children ? <div className="mt-0.5 text-body-s text-slate">{children}</div> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-sm text-slate transition-colors duration-250 hover:bg-fog/60 hover:text-ink"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

/**
 * [SHARED] ToastProvider — hàng đợi toast góc phải dưới, tự đóng sau 5 giây.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const remove = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, options = {}) => {
      const id = createToastId();
      const item = {
        id,
        tone,
        message,
        title: options.title,
        duration: options.duration ?? 5000,
      };

      setToasts((current) => [...current, item]);

      if (item.duration > 0) {
        const timer = setTimeout(() => remove(id), item.duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [remove],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const api = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            tone={toast.tone}
            title={toast.title}
            onClose={() => remove(toast.id)}
          >
            {toast.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải nằm trong <ToastProvider>.');
  }
  return context;
}
