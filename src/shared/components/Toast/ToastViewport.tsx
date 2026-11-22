import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '@/shared/components/Icon';
import { IconButton } from '@/shared/components/IconButton';
import { useToastStore, type ToastItem, type ToastType } from './toastStore';
import './Toast.css';

// Toast stack (top-right). Portaled into `body` as its own `.overlay-root`, so it
// stays interactive while a drawer or modal makes `#root` inert. Errors are
// announced in an assertive live region, everything else politely.

const ICON_BY_TYPE: Record<ToastType, IconName> = {
  success: 'check-circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(item.durationMs);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (paused || item.exiting) return;
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => dismiss(item.id), remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingRef.current = Math.max(
        1000,
        remainingRef.current - (Date.now() - startedAtRef.current),
      );
    };
  }, [paused, item.exiting, item.id, dismiss]);

  return (
    <div
      className={`toast toast--${item.type}`}
      data-state={item.exiting ? 'closed' : 'open'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <Icon
        name={ICON_BY_TYPE[item.type]}
        size={18}
        filled={item.type === 'success'}
        className={`toast__icon toast__icon--${item.type}`}
      />
      <div className="toast__message">{item.message}</div>
      {item.action ? (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            item.action?.onClick();
            dismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      ) : null}
      <IconButton
        icon="x"
        label="Dismiss notification"
        size="sm"
        showTooltip={false}
        className="toast__dismiss"
        onClick={() => dismiss(item.id)}
      />
    </div>
  );
}

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const errors = items.filter((item) => item.type === 'error');
  const others = items.filter((item) => item.type !== 'error');

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="overlay-root toast-root">
      <div className="toast-viewport">
        <div className="toast-region" role="status" aria-live="polite" aria-relevant="additions">
          {others.map((item) => (
            <ToastCard key={item.id} item={item} />
          ))}
        </div>
        <div className="toast-region" aria-live="assertive" aria-relevant="additions">
          {errors.map((item) => (
            <ToastCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
