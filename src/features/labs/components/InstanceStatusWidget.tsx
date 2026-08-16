import { Button, Card } from '@/shared/components';
import type { ActiveInstanceDto } from '../types';
import { LabTimerCountdown } from './LabTimerCountdown';

interface InstanceStatusWidgetProps {
  instance: ActiveInstanceDto;
  isBusy?: boolean;
  onStop?: (instanceId: number) => void;
  onTerminate?: (instanceId: number) => void;
  onExtend?: (instanceId: number) => void;
}

/** SCR-F6-01: compact active-instance panel (status, IP, timer, actions). */
export function InstanceStatusWidget({
  instance,
  isBusy = false,
  onStop,
  onTerminate,
  onExtend,
}: InstanceStatusWidgetProps) {
  return (
    <Card className="instance-status-widget" data-testid="instance-status-widget">
      <div className="instance-status-widget__row">
        <span className={`instance-status-badge instance-status-badge--${instance.status}`}>
          {instance.status}
        </span>
        {instance.assignedIp && (
          <span className="instance-status-widget__ip">{instance.assignedIp}</span>
        )}
      </div>
      <div className="instance-status-widget__row">
        <span className="instance-status-widget__label">Time remaining</span>
        <LabTimerCountdown expiresAt={instance.expiresAt} />
      </div>
      <div className="instance-status-widget__row">
        <span className="instance-status-widget__label">
          {instance.ramGb} GB RAM · {instance.cpuCores} vCPU · {instance.diskGb} GB disk
        </span>
      </div>
      <div className="instance-status-widget__actions">
        {instance.status === 'running' && onStop && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={isBusy}
            onClick={() => onStop(instance.instanceId)}
          >
            Stop
          </Button>
        )}
        {instance.status === 'running' && onExtend && (
          <Button
            variant="secondary"
            size="sm"
            isLoading={isBusy}
            onClick={() => onExtend(instance.instanceId)}
          >
            Extend
          </Button>
        )}
        {onTerminate && (
          <Button
            variant="danger"
            size="sm"
            isLoading={isBusy}
            onClick={() => onTerminate(instance.instanceId)}
          >
            Terminate
          </Button>
        )}
      </div>
    </Card>
  );
}

export default InstanceStatusWidget;
