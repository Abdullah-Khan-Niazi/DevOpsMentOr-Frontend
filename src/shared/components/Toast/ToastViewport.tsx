import { useToastStore } from './toastStore';
import './Toast.css';

// ToastNotification — top-right stack, 3px semantic left border, 4000ms
// auto-dismiss (F1 REUSE catalogue §11 matrix).

export function ToastViewport() {
  const items = useToastStore((state) => state.items);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div className="toast-viewport" role="status" aria-live="polite" aria-atomic="false">
      {items.map((item) => (
        <div key={item.id} className={`toast toast--${item.type}`} role="alert">
          <span className="toast__message">{item.message}</span>
          <button
            type="button"
            className="toast__dismiss"
            onClick={() => dismiss(item.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
