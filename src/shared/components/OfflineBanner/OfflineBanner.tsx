import { Icon } from '@/shared/components/Icon';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';

/** Bar shown under the top bar while the browser is offline (`.app-chrome__offline`). */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="app-chrome__offline motion-fade-in" role="status" aria-live="polite">
      <Icon name="offline" size={16} />
      <span>You are offline. Changes will not be saved until you reconnect.</span>
    </div>
  );
}
