import { useId } from 'react';
import { Input, NumberInput, TabSwitcher, type TabSwitcherItem } from '@/shared/components';
import type { LabStepKind, LabStepV2 } from '@/features/labs/types/labSpec';
import { LAB_STEP_DEFAULTS } from '../question/defaults';
import { CommandListField } from '../fields/CommandListField';
import { MarkdownField } from '../fields/MarkdownField';
import { PenaltyFields } from '../fields/PenaltyFields';
import { AnswerEditor } from './AnswerEditor';
import { CheckEditor } from './CheckEditor';
import { getCheckIssues } from './checkDraft';
import { HintsEditor } from './HintsEditor';
import {
  emptyCheck,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_SETUP_COMMAND_LENGTH,
  MAX_STEP_SETUP,
  MAX_TITLE_LENGTH,
  rowIssues,
  slugifyStepId,
  STEP_ID_MAX_LENGTH,
  uniqueStepId,
  type StepDraft,
} from './labSpecSchema';
import { TestCheckPanel } from './TestCheckPanel';

// One step of the spec. Task steps carry a check (tested in the admin's lab environment);
// question steps carry accepted answers and penalties. The id follows the title until
// the author edits it (`entry.autoId`). `issues` are messages relative to the step.

export interface StepEditorProps {
  labId: number;
  entry: StepDraft;
  /** Ids of the other steps, for uniqueness. */
  otherIds: ReadonlyArray<string>;
  issues: Record<string, string>;
  disabled?: boolean;
  onChange: (next: StepDraft) => void;
}

const KIND_ITEMS: ReadonlyArray<TabSwitcherItem<LabStepKind>> = [
  { id: 'task', label: 'Task' },
  { id: 'question', label: 'Question' },
];

export function StepEditor({
  labId,
  entry,
  otherIds,
  issues,
  disabled = false,
  onChange,
}: StepEditorProps) {
  const idPrefix = `step-${useId()}`;
  const step = entry.step;

  function setStep(next: LabStepV2) {
    onChange({ ...entry, step: next });
  }

  function changeTitle(title: string) {
    if (entry.autoId) {
      const id = uniqueStepId(slugifyStepId(title), otherIds);
      onChange({ ...entry, step: { ...step, title, id } });
    } else {
      setStep({ ...step, title });
    }
  }

  function changeId(id: string) {
    onChange({ ...entry, autoId: false, step: { ...step, id } });
  }

  function changeKind(kind: LabStepKind) {
    if (kind === step.kind) return;
    if (kind === 'task') {
      setStep({
        ...step,
        kind,
        check: step.check ?? emptyCheck(),
        answer: undefined,
        wrongPenalty: 0,
        guessPenalty: 0,
      });
      return;
    }
    setStep({
      ...step,
      kind,
      check: undefined,
      answer: step.answer ?? { accepted: [''], normalize: 'trim_lower' },
      wrongPenalty: LAB_STEP_DEFAULTS.wrongPenalty,
      guessPenalty: LAB_STEP_DEFAULTS.guessPenalty,
    });
  }

  const check = step.check ?? emptyCheck();
  const setupRowErrors = rowIssues(issues, 'setup', step.setup.length);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-card-foreground">Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id={`${idPrefix}-title`}
            label="Title"
            required
            maxLength={MAX_TITLE_LENGTH}
            value={step.title}
            disabled={disabled}
            error={issues.title}
            onChange={(event) => changeTitle(event.target.value)}
          />
          <Input
            id={`${idPrefix}-id`}
            label="Step id"
            required
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
            maxLength={STEP_ID_MAX_LENGTH}
            value={step.id}
            disabled={disabled}
            error={issues.id}
            onChange={(event) => changeId(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="input-label">Kind</span>
          <TabSwitcher
            items={KIND_ITEMS}
            value={step.kind}
            ariaLabel="Step kind"
            onChange={changeKind}
          />
        </div>

        <MarkdownField
          id={`${idPrefix}-instructions`}
          label="Instructions"
          required
          value={step.instructions}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
          rows={8}
          disabled={disabled}
          error={issues.instructions}
          onChange={(instructions) => setStep({ ...step, instructions })}
        />

        <CommandListField
          id={`${idPrefix}-setup`}
          label="Setup commands"
          values={step.setup}
          maxItems={MAX_STEP_SETUP}
          maxLength={MAX_SETUP_COMMAND_LENGTH}
          addLabel="Add setup command"
          errors={setupRowErrors}
          error={issues.setup}
          disabled={disabled}
          onChange={(setup) => setStep({ ...step, setup })}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-card-foreground">Scoring</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberInput
            id={`${idPrefix}-points`}
            label="Points"
            name="points"
            value={step.points}
            disabled={disabled}
            error={issues.points}
            onValueChange={(points) => setStep({ ...step, points: points ?? Number.NaN })}
          />
          <NumberInput
            id={`${idPrefix}-hint-cost`}
            label="Hint cost"
            name="hintCost"
            value={step.hintCost}
            disabled={disabled}
            error={issues.hintCost}
            onValueChange={(hintCost) => setStep({ ...step, hintCost: hintCost ?? Number.NaN })}
          />
        </div>
        {step.kind === 'question' ? (
          <PenaltyFields
            showGuess
            wrongPenalty={step.wrongPenalty}
            guessPenalty={step.guessPenalty}
            disabled={disabled}
            errors={{ wrongPenalty: issues.wrongPenalty, guessPenalty: issues.guessPenalty }}
            onChange={(next) =>
              setStep({
                ...step,
                wrongPenalty: next.wrongPenalty ?? Number.NaN,
                guessPenalty: next.guessPenalty ?? Number.NaN,
              })
            }
          />
        ) : null}
      </section>

      <HintsEditor
        hints={step.hints}
        issues={issues}
        disabled={disabled}
        onChange={(hints) => setStep({ ...step, hints })}
      />

      {step.kind === 'task' ? (
        <section className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-card-foreground">Check</h3>
          <CheckEditor
            value={check}
            errors={issues}
            disabled={disabled}
            onChange={(next) => setStep({ ...step, check: next })}
          />
          <TestCheckPanel
            labId={labId}
            check={check}
            checkValid={Object.keys(getCheckIssues(check)).length === 0}
            disabled={disabled}
          />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-card-foreground">Answer</h3>
          <AnswerEditor
            answer={step.answer ?? { accepted: [], normalize: 'trim_lower' }}
            issues={issues}
            disabled={disabled}
            onChange={(answer) => setStep({ ...step, answer })}
          />
        </section>
      )}
    </div>
  );
}
