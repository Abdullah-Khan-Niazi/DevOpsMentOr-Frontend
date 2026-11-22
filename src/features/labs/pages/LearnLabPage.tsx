import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AiMentorDrawer } from '@/features/labs/components/AiMentorDrawer';
import { MentorOrb } from '@/features/labs/components/MentorOrb';
import { EnvironmentPane } from '@/features/labs/components/workspace/EnvironmentPane';
import { StepsPane } from '@/features/labs/components/workspace/StepsPane';
import { useLabDetail } from '@/features/labs/hooks/useLabs';
import { useLabSteps } from '@/features/labs/hooks/useLabSteps';
import {
  Button,
  EmptyState,
  ErrorState,
  TabSwitcher,
  type TabSwitcherItem,
} from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { getStatusCode, hasCode } from '@/shared/services';
import { cn } from '@/shared/utils';
import { LabWorkspacePageSkeleton } from './LabWorkspacePageSkeleton';

type PaneId = 'steps' | 'environment';

const PANE_TABS: ReadonlyArray<TabSwitcherItem<PaneId>> = [
  { id: 'steps', label: 'Steps', icon: 'checklist' },
  { id: 'environment', label: 'Environment', icon: 'terminal' },
];

/** Left pane width bounds in percent of the workspace width (keyboard and pointer). */
const SPLIT_MIN = 25;
const SPLIT_MAX = 75;
const SPLIT_DEFAULT = 42;
const SPLIT_KEY_STEP = 2;
const SPLIT_STORAGE_KEY = 'lab-split';

function clampSplit(value: number): number {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

/** Saved split (a convenience only); unavailable storage falls back to the default. */
function readStoredSplit(): number {
  try {
    const raw = window.localStorage.getItem(SPLIT_STORAGE_KEY);
    const value = raw === null ? Number.NaN : Number(raw);
    return Number.isFinite(value) ? clampSplit(value) : SPLIT_DEFAULT;
  } catch {
    return SPLIT_DEFAULT;
  }
}

function storeSplit(value: number): void {
  try {
    window.localStorage.setItem(SPLIT_STORAGE_KEY, String(value));
  } catch {
    // Storage unavailable: the split is simply not remembered.
  }
}

function parseItemId(raw: string | null): number | null {
  const parsed = raw === null ? Number.NaN : Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

interface LabGateProps {
  /** Query error that blocks the workspace; null for an invalid lab id. */
  error: unknown;
  onRetry: () => void;
}

/** Full-page states that replace the workspace: unavailable, not found, no access, failure. */
function LabGate({ error, onRetry }: LabGateProps) {
  const navigate = useNavigate();
  const back = (
    <Button variant="secondary" iconName="arrow-left" onClick={() => navigate(ROUTES.LEARN)}>
      Back to Learn
    </Button>
  );

  let body: ReactNode;
  if (error === null) {
    body = <EmptyState icon="lab" title="Lab not found" action={back} />;
  } else if (hasCode(error, ERROR_CODES.LAB_NOT_READY, ERROR_CODES.LAB_MISCONFIGURED)) {
    body = <EmptyState icon="lab" title="This lab is not available yet" action={back} />;
  } else if (hasCode(error, ERROR_CODES.LAB_NOT_FOUND)) {
    body = <EmptyState icon="lab" title="Lab not found" action={back} />;
  } else if (hasCode(error, ERROR_CODES.LAB_ACCESS_DENIED)) {
    body = <EmptyState icon="lock" title="Upgrade to access this lab" action={back} />;
  } else if (hasCode(error, ERROR_CODES.COURSE_ACCESS_DENIED)) {
    body = <EmptyState icon="lock" title="You do not have access to this course" action={back} />;
  } else if (getStatusCode(error) === 403) {
    body = <EmptyState icon="lock" title="You do not have access to this lab" action={back} />;
  } else {
    body = (
      <div className="flex flex-col items-center gap-4">
        <ErrorState error={error} onRetry={onRetry} />
        {back}
      </div>
    );
  }

  return <div className="flex min-h-0 flex-1 items-center justify-center p-6">{body}</div>;
}

/**
 * Lab workspace (`/learn/labs/:labId?itemId=`): steps on the left, the lab environment
 * (terminal, slides, walkthrough) on the right, and the AI mentor. Full viewport height;
 * the panes are split by a keyboard and pointer resizable separator, stacked below 1024 px.
 */
export function LearnLabPage() {
  const { labId: labIdParam = '' } = useParams<{ labId: string }>();
  const [searchParams] = useSearchParams();
  const labId = Number(labIdParam);
  const validLab = Number.isInteger(labId) && labId > 0;
  const itemId = parseItemId(searchParams.get('itemId'));

  const detail = useLabDetail(labIdParam, validLab);
  const labSteps = useLabSteps(labId, validLab);

  const [split, setSplit] = useState(readStoredSplit);
  const [pane, setPane] = useState<PaneId>('steps');
  const [mentorOpen, setMentorOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  function updateSplit(next: number) {
    setSplit(clampSplit(next));
  }

  function handleSeparatorPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    updateSplit(((event.clientX - rect.left) / rect.width) * 100);
  }

  function handleSeparatorPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    storeSplit(split);
  }

  function handleSeparatorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
        next = split - SPLIT_KEY_STEP;
        break;
      case 'ArrowRight':
        next = split + SPLIT_KEY_STEP;
        break;
      case 'Home':
        next = SPLIT_MIN;
        break;
      case 'End':
        next = SPLIT_MAX;
        break;
      default:
        return;
    }
    event.preventDefault();
    const clamped = clampSplit(next);
    updateSplit(clamped);
    storeSplit(clamped);
  }

  if (detail.isLoading || labSteps.steps.isLoading) {
    return <LabWorkspacePageSkeleton />;
  }

  const gateError = validLab ? (detail.error ?? labSteps.steps.error) : null;
  if (!validLab || gateError) {
    return (
      <LabGate
        error={validLab ? gateError : null}
        onRetry={() => {
          void detail.refetch();
          void labSteps.steps.refetch();
        }}
      />
    );
  }

  return (
    <div
      data-testid="unified-lab-workspace"
      className="fixed inset-0 z-(--z-workspace) flex min-h-0 flex-col bg-paper text-card-foreground"
    >
      <div className="shrink-0 px-5 pt-3 lg:hidden">
        <TabSwitcher
          items={PANE_TABS}
          value={pane}
          onChange={setPane}
          ariaLabel="Lab workspace panes"
        />
      </div>

      <div ref={rowRef} className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-col max-lg:flex-1 lg:w-(--lab-split) lg:shrink-0',
            pane === 'environment' && 'max-lg:hidden',
          )}
          style={{ '--lab-split': `${split}%` } as CSSProperties}
        >
          <StepsPane key={`${labId}:${itemId ?? 'lab'}`} labId={labId} itemId={itemId} />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panes"
          aria-valuemin={SPLIT_MIN}
          aria-valuemax={SPLIT_MAX}
          aria-valuenow={Math.round(split)}
          tabIndex={0}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={handleSeparatorPointerMove}
          onPointerUp={handleSeparatorPointerUp}
          onPointerCancel={handleSeparatorPointerUp}
          onKeyDown={handleSeparatorKeyDown}
          className="hidden w-2 shrink-0 cursor-col-resize touch-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:block"
        />

        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            pane === 'steps' && 'max-lg:hidden',
          )}
        >
          <EnvironmentPane labId={labId} itemId={itemId} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setMentorOpen((open) => !open)}
        aria-label="AI Mentor"
        aria-haspopup="dialog"
        aria-expanded={mentorOpen}
        className="fixed right-5 bottom-5 z-(--z-workspace-fab) inline-flex size-14 cursor-pointer items-center justify-center rounded-full bg-card shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <MentorOrb state={mentorOpen ? 'listening' : 'rest'} size="md" />
      </button>

      <AiMentorDrawer
        open={mentorOpen}
        onClose={() => setMentorOpen(false)}
        labId={labId}
        lessonId={itemId ?? undefined}
      />
    </div>
  );
}

export default LearnLabPage;
