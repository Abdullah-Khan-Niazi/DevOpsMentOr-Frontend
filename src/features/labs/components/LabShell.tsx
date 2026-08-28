import { useState } from 'react';
import { Button, ConfirmDialog } from '@/shared/components';
import type { ActiveInstanceDto } from '../types';
import { AiMentorDrawer } from './AiMentorDrawer';
import { LabTimerCountdown } from './LabTimerCountdown';

interface LabShellProps {
  instance: ActiveInstanceDto;
  labSlug: string;
  onTerminate: (instanceId: number) => void;
  onExtend: (instanceId: number) => void;
  assertionSidebar?: React.ReactNode;
  aiMentorLessonId?: number;
  aiMentorLabId?: number;
}

/**
 * SCR-F6-02 full-bleed layout: top bar with timer/actions, terminal main
 * panel, assertion sidebar, and the AI Mentor drawer button (fixed
 * bottom-right). Navigation chrome is hidden to maximize workspace.
 */
export function LabShell({
  instance,
  labSlug,
  onTerminate,
  onExtend,
  assertionSidebar,
  aiMentorLessonId,
  aiMentorLabId,
}: LabShellProps) {
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [extendPromptOpen, setExtendPromptOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);

  return (
    <div className="lab-shell" data-testid="lab-shell">
      <header className="lab-shell__topbar">
        <div className="lab-shell__identity">
          <span className="lab-shell__lab-name">{instance.labName}</span>
          <span className="lab-shell__slug">/{labSlug}</span>
        </div>
        <div className="lab-shell__controls">
          <LabTimerCountdown
            expiresAt={instance.expiresAt}
            onLowTime={() => setExtendPromptOpen(true)}
          />
          <Button variant="secondary" size="sm" onClick={() => onExtend(instance.instanceId)}>
            Extend
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmTerminate(true)}>
            Terminate
          </Button>
        </div>
      </header>

      <div className="lab-shell__main">
        <main className="lab-shell__terminal" data-testid="lab-terminal">
          {instance.terminalWsUrl ? (
            <iframe
              className="terminal-iframe"
              title="Lab Terminal"
              src={instance.terminalWsUrl}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <p className="lab-shell__terminal-empty">
              {instance.status === 'running'
                ? 'Terminal is connecting…'
                : `Instance is ${instance.status}.`}
            </p>
          )}
        </main>
        {assertionSidebar && <aside className="lab-shell__sidebar">{assertionSidebar}</aside>}
      </div>

      {aiMentorLessonId && (
        <>
          <button
            type="button"
            className="lab-shell__mentor-fab"
            onClick={() => setMentorOpen((open) => !open)}
          >
            AI Mentor
          </button>
          {mentorOpen && (
            <AiMentorDrawer
              lessonId={aiMentorLessonId}
              labId={aiMentorLabId}
              onClose={() => setMentorOpen(false)}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmTerminate}
        title="Terminate lab session?"
        message="All progress in this lab session will be lost."
        confirmLabel="Terminate"
        onCancel={() => setConfirmTerminate(false)}
        onConfirm={() => {
          setConfirmTerminate(false);
          onTerminate(instance.instanceId);
        }}
      />
      <ConfirmDialog
        open={extendPromptOpen}
        title="Less than 5 minutes remaining"
        message="Extend your lab session to keep working."
        confirmLabel="Extend session"
        onCancel={() => setExtendPromptOpen(false)}
        onConfirm={() => {
          onExtend(instance.instanceId);
          setExtendPromptOpen(false);
        }}
      />
    </div>
  );
}

export default LabShell;
