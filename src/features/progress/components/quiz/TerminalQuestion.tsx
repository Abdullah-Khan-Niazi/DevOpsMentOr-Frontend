import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLabEnvironment } from '@/features/labs/hooks/useLabEnvironment';
import {
  EnvironmentPanel,
  type EnvironmentPanelState,
} from '@/features/labs/components/workspace/EnvironmentPanel';
import type { ActiveInstanceDto } from '@/features/labs/types';
import { useStageTerminal } from '@/features/progress/hooks/useQuiz';
import type { LearnerQuizQuestionDto } from '@/features/progress/types';
import { Button, EmptyState, ErrorState, Icon, Skeleton } from '@/shared/components';
import { ERROR_CODES, ROUTES } from '@/shared/constants';
import { hasCode, LONG_REQUEST_TIMEOUT_MS } from '@/shared/services';
import { QuestionView } from './QuestionView';
import type { QuizAnswerDraft } from './QuestionResponses';

/** FE§4.5: client budget for one staging request (the same 120 s as the server call). */
const STAGE_TIMEOUT_MS = LONG_REQUEST_TIMEOUT_MS;

export interface TerminalQuestionProps {
  attemptId: number;
  question: LearnerQuizQuestionDto;
  /** Local answer draft of this question (check mode keeps no draft). */
  value: QuizAnswerDraft;
  onChange: (next: QuizAnswerDraft) => void;
  /** Locks the answer editor and the check button: a submit is pending or the question is answered. */
  disabled: boolean;
  /** Submits the question through the runner; in check mode this sends `terminal_check`. */
  onCheck: () => void;
  checkPending: boolean;
  /** Changes when an answer was refused with TERMINAL_NOT_STAGED, so the environment is staged once more. */
  restageToken: number;
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 items-center justify-center p-6">{children}</div>;
}

/** Shown only while a stage request is in flight (never for a non-terminal question). */
function PreparingEnvironment() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <Skeleton className="min-h-0 flex-1 rounded-md" />
      <p className="text-sm text-muted-foreground">Preparing lab environment</p>
    </div>
  );
}

/** Maps the learner's instance status onto the presentational environment pane states. */
function environmentStateOf(instance: ActiveInstanceDto): EnvironmentPanelState {
  switch (instance.status) {
    case 'pending':
      return 'pending';
    case 'running':
      return 'running';
    case 'stopped':
    case 'terminated':
      return 'stopped';
    default:
      return 'error';
  }
}

/**
 * Terminal quiz question: the statement and response on the left, the learner's lab environment
 * on the right. Stages the environment once per attempt and question (ref guard, StrictMode safe)
 * and never for answered questions. Rendered only for `questionType === 'terminal'` by the runner.
 */
export function TerminalQuestion({
  attemptId,
  question,
  value,
  onChange,
  disabled,
  onCheck,
  checkPending,
  restageToken,
}: TerminalQuestionProps) {
  const terminal = question.terminal;
  const environment = useLabEnvironment(terminal?.labId ?? 0);
  const stage = useStageTerminal(attemptId);
  const stageMutate = stage.mutate;
  const stageIsPending = stage.isPending;
  const [stageRun, setStageRun] = useState(0);
  const [stageTimedOut, setStageTimedOut] = useState(false);
  const firedKey = useRef<string | null>(null);

  const questionId = question.questionId;
  const answered = question.response !== null;
  const staged = terminal?.staged ?? null;
  const instance = environment.instance;
  const ready = staged !== null && instance !== null && instance.instanceId === staged.instanceId;
  const otherInstance = environment.otherInstance;
  const activeLoading = environment.isLoading;
  const isCheck = terminal?.mode === 'check';
  const checkReady = ready && instance?.status === 'running';

  const startStage = useCallback(() => {
    setStageTimedOut(false);
    setStageRun((run) => run + 1);
    stageMutate({ questionId });
  }, [stageMutate, questionId]);

  // Fire once per attempt and question (plus one explicit restage token). Never for answered
  // questions, never while the active instance is still loading, and not while another lab runs.
  useEffect(() => {
    if (!terminal || answered || ready) return;
    if (activeLoading || otherInstance !== null) return;
    const key = `${attemptId}:${questionId}:${restageToken}`;
    if (firedKey.current === key) return;
    firedKey.current = key;
    startStage();
  }, [
    terminal,
    answered,
    ready,
    activeLoading,
    otherInstance,
    attemptId,
    questionId,
    restageToken,
    startStage,
  ]);

  // Client timeout for the pending stage request (FE§4.5: 120 s).
  useEffect(() => {
    if (!stageIsPending) return undefined;
    const id = window.setTimeout(() => setStageTimedOut(true), STAGE_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [stageIsPending, stageRun]);

  const timedOut = stageIsPending && stageTimedOut;
  const preparing = stageIsPending && !stageTimedOut;
  const stageError = stageIsPending ? null : stage.error;
  const accessDenied = hasCode(stageError, ERROR_CODES.LAB_ACCESS_DENIED);

  const retryEnvironment = () => {
    if (!instance || instance.status === 'error') {
      startStage();
      return;
    }
    environment.refetch();
    environment.reconnect();
  };

  const endOther = () => {
    if (otherInstance) environment.end(otherInstance.instanceId);
  };

  const panel = (state: EnvironmentPanelState) => (
    <EnvironmentPanel
      state={state}
      instance={instance}
      error={null}
      onStart={startStage}
      onRestart={startStage}
      onRetry={retryEnvironment}
      startPending={stageIsPending}
      otherActive={otherInstance ? { labName: otherInstance.labName } : null}
      onEndOther={endOther}
      reloadKey={environment.reconnectKey}
    />
  );

  let pane: ReactNode;
  if (accessDenied) {
    pane = (
      <Centered>
        <EmptyState
          icon="lock"
          title="This lab needs a plan"
          action={
            <Link to={ROUTES.BILLING} className="btn btn--primary btn--md motion-press">
              <span className="btn__content">
                <span className="btn__icon" aria-hidden="true">
                  <Icon name="rocket" size={18} />
                </span>
                <span className="btn__label">Upgrade</span>
              </span>
            </Link>
          }
        />
      </Centered>
    );
  } else if (ready && instance) {
    pane = panel(environmentStateOf(instance));
  } else if (timedOut) {
    pane = (
      <Centered>
        <ErrorState title="The lab environment did not get ready." onRetry={startStage} />
      </Centered>
    );
  } else if (preparing) {
    pane = <PreparingEnvironment />;
  } else if (stageError) {
    pane = (
      <Centered>
        <ErrorState compact error={stageError} onRetry={startStage} />
      </Centered>
    );
  } else if (activeLoading) {
    pane = panel('pending');
  } else if (answered) {
    pane = (
      <Centered>
        <EmptyState icon="terminal" title="No lab environment for this question" />
      </Centered>
    );
  } else if (staged && !instance) {
    pane = panel('pending');
  } else {
    // No environment yet, or another lab's is active: the panel offers Start or End-other.
    pane = panel('none');
  }

  return (
    <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-2">
      <div className="flex min-h-0 min-w-0 flex-col gap-6">
        <QuestionView question={question} value={value} onChange={onChange} disabled={disabled} />
        {isCheck ? (
          <div>
            <Button onClick={onCheck} isLoading={checkPending} disabled={disabled || !checkReady}>
              Check my work
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex min-h-[24rem] min-w-0 flex-1 flex-col overflow-hidden rounded-md bg-card">
        {pane}
      </div>
    </div>
  );
}

export default TerminalQuestion;
