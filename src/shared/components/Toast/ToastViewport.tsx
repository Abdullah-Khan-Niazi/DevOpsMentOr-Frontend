import { useToastStore, type ToastType } from './toastStore';
import './Toast.css';

// ToastNotification — top-right stack, semantic indicator, status icon, auto-dismiss

function ToastStatusIcon({ type }: { type: ToastType }) {
  if (type === 'success') {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="toast__icon toast__icon--success"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="8" />
        <path d="m6.5 10 2.5 2.5 4.5-4.5" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="toast__icon toast__icon--error"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="8" />
        <line x1="12" y1="8" x2="8" y2="12" />
        <line x1="8" y1="8" x2="12" y2="12" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="toast__icon toast__icon--warning"
        aria-hidden="true"
      >
        <path d="m10 2.5 7.5 13.5H2.5L10 2.5z" />
        <line x1="10" y1="8" x2="10" y2="11.5" />
        <circle cx="10" cy="14" r="0.75" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="toast__icon toast__icon--info"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8" />
      <line x1="10" y1="9" x2="10" y2="14" />
      <circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="toast-viewport" role="status" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div key={item.id} className={`toast toast--${item.type}`} role="alert">
          <ToastStatusIcon type={item.type} />
          <span className="toast__message">{item.message}</span>
          <button
            type="button"
            className="toast__dismiss"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss notification"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="toast__dismiss-icon"
              aria-hidden="true"
            >
              <line x1="14" y1="6" x2="6" y2="14" />
              <line x1="6" y1="6" x2="14" y2="14" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
