import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ConfirmDialog } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import type { ActiveInstanceDto } from '../types';
import { AiMentorDrawer } from './AiMentorDrawer';
import { LabTimerCountdown } from './LabTimerCountdown';
import { LabLearningPanel } from './LabLearningPanel';
import { LabTerminalPanel } from './LabTerminalPanel';

interface LabShellProps {
  instance: ActiveInstanceDto;
  labSlug: string;
  onTerminate: (instanceId: number) => void;
  onExtend: (instanceId: number) => void;
  aiMentorLessonId?: number;
  aiMentorLabId?: number;
  assertions?: Array<{ name: string; passed: boolean; message: string | null }>;
  isChecking?: boolean;
  hasRunChecks?: boolean;
  onRunChecks?: () => void;
  assertionSidebar?: React.ReactNode;
}

/**
 * DataCamp-Style Full-Bleed 2-Pane Learning Workspace:
 * - Top bar: Course navigation, lab identity, active countdown, session controls.
 * - Left Pane: Structured scenario instructions, unguided & break-fix tasks, live checkpoints, and interactive quiz.
 * - Right Pane: Interactive web terminal console with accurate dark theme and SSH controls.
 */
export function LabShell({
  instance,
  labSlug,
  onTerminate,
  onExtend,
  aiMentorLessonId,
  aiMentorLabId,
  assertions = [],
  isChecking = false,
  hasRunChecks = false,
  onRunChecks = () => {},
}: LabShellProps) {
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [extendPromptOpen, setExtendPromptOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col bg-paper overflow-hidden" data-testid="lab-shell">
      {/* Top Navigation & Workspace Control Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-pearl-100 px-4">
        {/* Left: Breadcrumb & Lab Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={ROUTES.CURRICULUM}
            className="flex items-center gap-1.5 font-mono text-xs text-muted hover:text-ink transition-colors"
          >
            <span>←</span>
            <span>Curriculum</span>
          </Link>

          <span className="text-paper-line" aria-hidden="true">
            |
          </span>

          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="truncate text-sm font-semibold text-card-foreground">
              {instance.labName}
            </h1>
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
              /{labSlug}
            </span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1.5 rounded border border-border bg-paper-dim px-2 py-0.5 font-mono text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Running
          </span>
        </div>

        {/* Right: Controls & Timer */}
        <div className="flex items-center gap-2.5">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMentorOpen((open) => !open)}
            className="font-mono text-xs"
          >
            AI Mentor
          </Button>
        </div>
      </header>

      {/* Main 2-Pane DataCamp Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Pane: Learning Panel (Tasks, Objectives, Quiz) */}
        <aside className="w-[460px] lg:w-[500px] xl:w-[540px] shrink-0 border-r border-border bg-paper flex flex-col h-full overflow-hidden">
          <LabLearningPanel
            labSlug={labSlug}
            labName={instance.labName}
            assertions={assertions}
            isChecking={isChecking}
            hasRunChecks={hasRunChecks}
            onRunChecks={onRunChecks}
          />
        </aside>

        {/* Right Pane: Interactive Terminal Console */}
        <main className="flex-1 h-full min-w-0 flex flex-col overflow-hidden bg-[#0d1117]">
          <LabTerminalPanel
            terminalWsUrl={instance.terminalWsUrl}
            status={instance.status}
            sshPort={instance.sshPort}
          />
        </main>
      </div>

      {/* AI Mentor Drawer */}
      {mentorOpen && (
        <AiMentorDrawer
          lessonId={aiMentorLessonId ?? 1}
          labId={aiMentorLabId ?? instance.labId}
          onClose={() => setMentorOpen(false)}
        />
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmTerminate}
        title="Terminate lab session?"
        message="All progress and uncommitted container modifications will be lost."
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
        message="Extend your lab session to keep your container running without interruption."
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
