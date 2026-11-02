'use client';

import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn.js';
import Button from '@/shared/ui/button.jsx';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

function subscribeNoop() {
  return () => {};
}

const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * [SHARED] Modal — giữ focus trong dialog, đóng bằng Esc/backdrop (Blueprint §4.2).
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = panel?.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusables && focusables.length > 0) {
      focusables[0].focus();
    } else {
      panel?.focus();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const nodes = panel?.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!nodes || nodes.length === 0) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white shadow-lift outline-none sm:rounded-lg',
          SIZES[size] ?? SIZES.md,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-fog px-5 py-4">
          <div>
            {title ? (
              <h2 id={titleId} className="font-heading text-h4 text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descriptionId} className="mt-1 text-body-s text-slate">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="icon"
            size="sm"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="-mr-2 -mt-1"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>

        <div className="px-5 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-fog px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
