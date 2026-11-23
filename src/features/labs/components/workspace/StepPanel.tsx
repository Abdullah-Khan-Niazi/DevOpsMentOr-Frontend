import { useId, useState, type FormEvent } from 'react';
import type { LearnerLabStepDto } from '@/features/labs/types';
import { Button } from '@/shared/components/Button';
import { Countdown } from '@/shared/components/Countdown';
import { Input } from '@/shared/components/Input';
import { Markdown } from '@/shared/components/Markdown';
import { Spinner } from '@/shared/components/Spinner';
import { getErrorMessage } from '@/shared/services/apiError';

/** Lab environment as the page sees it: none (not started), pending (provisioning), running, stopped. */
export type StepEnvironment = 'none' | 'pending' | 'running' | 'stopped';

/** Practice re-check result of a passed step (`alreadyPassed` check response). */
export type StepPracticeResult = 'passing' | 'not_passing';

export const MAX_STEP_ANSWER_LENGTH = 500;

export interface StepPanelProps {
  step: LearnerLabStepDto;
  environment: StepEnvironment;
  staging: { pending: boolean; error: unknown | null; onRetry: () => void };
  /** `answer` is sent for question steps only (trimmed, 1..500 characters). */
  onCheck: (answer?: string) => void;
  checkPending: boolean;
  /** Seconds until another check is allowed; null when checks are not throttled. The page clears it when the window ends. */
  retryAfterSeconds: number | null;
  /** Review of a passed step: no new XP can be earned here. */
  readOnly: boolean;
  practiceResult?: StepPracticeResult | null;
  /** Hide the Check action on task steps when the workspace terminal bar owns Run Checks. */
  hideTaskCheckButton?: boolean;
  /** Hide the step title heading when the parent checklist row already displays it. */
  hideTitle?: boolean;
}

const ENVIRONMENT_NOTICE: Record<Exclude<StepEnvironment, 'running'>, string> = {
  none: 'Start the lab environment to check this step.',
  pending: 'The lab environment is starting.',
  stopped: 'The lab environment has stopped. Restart it to check this step.',
};

const PRACTICE_LABEL: Record<StepPracticeResult, string> = {
  passing: 'Still passing',
  not_passing: 'Not passing in this environment',
};

interface QuestionFormProps {
  penalties: LearnerLabStepDto['penalties'];
  ready: boolean;
  checkPending: boolean;
  onCheck: (answer: string) => void;
}

/** Answer input for question steps. Remounted per step (keyed), so typed text never leaks across steps. */
function QuestionForm({ penalties, ready, checkPending, onCheck }: QuestionFormProps) {
  const inputId = useId();
  const [answer, setAnswer] = useState('');
  const trimmed = answer.trim();
  const canSubmit =
    ready && !checkPending && trimmed.length > 0 && trimmed.length <= MAX_STEP_ANSWER_LENGTH;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onCheck(trimmed);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        id={inputId}
        label="Answer"
        name="answer"
        value={answer}
        maxLength={MAX_STEP_ANSWER_LENGTH}
        required
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => setAnswer(event.target.value)}
        className="font-mono"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          isLoading={checkPending}
          loadingLabel="Submitting answer…"
        >
          Submit answer
        </Button>
      </div>
      {penalties.wrongAnswer > 0 || penalties.guess > 0 ? (
        <div className="flex flex-col gap-1 text-sm text-muted">
          {penalties.wrongAnswer > 0 ? (
            <p className="m-0">Wrong answers cost {penalties.wrongAnswer} XP</p>
          ) : null}
          {penalties.guess > 0 ? (
            <p className="m-0">Answering without running a command costs {penalties.guess} XP</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

/** Throttle notice. Counts down from the moment it mounts; the page clears `retryAfterSeconds` when the window ends. */
function RetryNotice({ seconds }: { seconds: number }) {
  const [until] = useState(() => new Date(Date.now() + seconds * 1000).toISOString());
  return (
    <p className="m-0 text-sm text-muted">
      Try again in <Countdown until={until} />
    </p>
  );
}

/**
 * Current step (or a passed step in review). Task steps get a Check button, question steps an
 * answer form. Actions stay disabled until the environment is running and the step is staged.
 */
export function StepPanel({
  step,
  environment,
  staging,
  onCheck,
  checkPending,
  retryAfterSeconds,
  readOnly,
  practiceResult = null,
  hideTaskCheckButton = false,
  hideTitle = false,
}: StepPanelProps) {
  const titleId = useId();

  // A step that needs staging is ready only once it is staged on the active instance. Staging
  // on another instance leaves `stagedOnInstanceId` pointing elsewhere; the page then reports
  // `staging.pending` until the step is staged here.
  // A passed step in review is never staged again (the server refuses to stage a passed step and
  // its practice re-check needs no stage record), so staging never gates "Check again".
  const needsStage = step.requiresStage && !readOnly;
  const stagedReady =
    !needsStage || (step.stagedOnInstanceId !== null && !staging.pending && staging.error === null);
  const ready = environment === 'running' && stagedReady && retryAfterSeconds === null;
  const showStaging = needsStage && staging.pending;
  const showStagingError = needsStage && !staging.pending && staging.error !== null;

  return (
    <section
      aria-labelledby={hideTitle ? undefined : titleId}
      aria-label={hideTitle ? step.title : undefined}
      className="flex flex-col gap-4"
    >
      {!hideTitle ? (
        <h2 id={titleId} className="m-0 text-xl font-semibold tracking-tight text-card-foreground">
          {step.title}
        </h2>
      ) : null}

      {step.instructions ? <Markdown variant="prose">{step.instructions}</Markdown> : null}

      {showStaging ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner />
          <span>Preparing step</span>
        </div>
      ) : null}

      {showStagingError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-error">
          <span>{getErrorMessage(staging.error, 'This step could not be prepared.')}</span>
          <Button variant="secondary" size="sm" onClick={staging.onRetry}>
            Try again
          </Button>
        </div>
      ) : null}

      {environment !== 'running' ? (
        <p className="m-0 text-sm text-muted">{ENVIRONMENT_NOTICE[environment]}</p>
      ) : null}

      {retryAfterSeconds !== null ? (
        <RetryNotice key={retryAfterSeconds} seconds={retryAfterSeconds} />
      ) : null}

      {readOnly ? (
        step.kind === 'task' ? (
          !hideTaskCheckButton || practiceResult ? (
            <div className="flex flex-wrap items-center gap-3">
              {!hideTaskCheckButton ? (
                <Button
                  variant="ghost"
                  onClick={() => onCheck()}
                  disabled={!ready}
                  isLoading={checkPending}
                  loadingLabel="Checking step…"
                >
                  Check again
                </Button>
              ) : null}
              {practiceResult ? (
                <span
                  role="status"
                  className={
                    practiceResult === 'passing'
                      ? 'text-sm font-medium text-check-success'
                      : 'text-sm font-medium text-warning'
                  }
                >
                  {PRACTICE_LABEL[practiceResult]}
                </span>
              ) : null}
            </div>
          ) : null
        ) : null
      ) : step.kind === 'task' ? (
        hideTaskCheckButton ? null : (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => onCheck()}
              disabled={!ready}
              isLoading={checkPending}
              loadingLabel="Checking step…"
            >
              Check
            </Button>
          </div>
        )
      ) : (
        <QuestionForm
          key={step.stepId}
          penalties={step.penalties}
          ready={ready}
          checkPending={checkPending}
          onCheck={onCheck}
        />
      )}
    </section>
  );
}
