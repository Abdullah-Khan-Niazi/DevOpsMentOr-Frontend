import { z } from 'zod';
import {
  ErrorState,
  Icon,
  Select,
  TabSwitcher,
  type SelectOptionItem,
  type TabSwitcherItem,
} from '@/shared/components';
import { useAdminLabs } from '@/features/labs/hooks';
import type { LabStepCheck } from '@/features/labs/types/labSpec';
import type {
  AdminQuestionDto,
  CreateQuestionPayload,
  TerminalQuestionConfig,
} from '@/features/curriculum/types/admin';
import { CheckEditor } from '../labSpec/CheckEditor';
import { CommandListField } from '../fields/CommandListField';
import { MarkdownField } from '../fields/MarkdownField';
import {
  INSTRUCTIONS_MAX,
  SETUP_COMMAND_MAX,
  answerRowSchema,
  blankRows,
  commonEmpty,
  commonFromDto,
  commonPayload,
  commonSchemaShape,
  defaultCheck,
  indexedErrors,
  penaltyConfig,
  penaltyRule,
  readRecord,
  rowsFromDto,
  rowsPayload,
  type TerminalAnswerFormat,
  type TerminalForm,
  type TerminalMode,
} from './types';
import { OptionRows, QuestionFrame } from './ChoiceEditor';
import { getCheckIssues } from '../labSpec/checkDraft';

// Terminal question (C§4.4). A lab environment is staged for the learner; the question is
// answered in one of two modes:
//   answer: the learner answers a choice or types text (guess penalty applies)
//   check:  the learner's shell state is checked by a LabStepCheck (no answers)

const MODE_ITEMS: ReadonlyArray<TabSwitcherItem<TerminalMode>> = [
  { id: 'answer', label: 'Answer', icon: 'edit' },
  { id: 'check', label: 'Check', icon: 'terminal' },
];

const FORMAT_ITEMS: ReadonlyArray<TabSwitcherItem<TerminalAnswerFormat>> = [
  { id: 'choice', label: 'Choice', icon: 'checklist' },
  { id: 'text', label: 'Text', icon: 'lesson' },
];

const SETUP_MAX = 10;
const CHOICE_MIN = 2;
const CHOICE_MAX = 10;
const TEXT_MAX = 20;

/** Mode switch: check drops the answers, answer starts from two blank options again. */
function withMode(value: TerminalForm, mode: TerminalMode): TerminalForm {
  if (mode === value.mode) return value;
  if (mode === 'check') return { ...value, mode, answers: [] };
  return {
    ...value,
    mode,
    answers: value.answers.length > 0 ? value.answers : blankRows(2),
  };
}

/** Format switch: text answers are all correct; a choice needs a new correct pick. */
function withFormat(value: TerminalForm, answerFormat: TerminalAnswerFormat): TerminalForm {
  const isCorrect = answerFormat === 'text';
  return {
    ...value,
    answerFormat,
    answers: value.answers.map((row) => ({ ...row, isCorrect })),
  };
}

export function TerminalEditor({
  value,
  onChange,
  errors,
}: {
  value: TerminalForm;
  onChange(next: TerminalForm): void;
  errors: Record<string, string>;
}) {
  const labsQuery = useAdminLabs();
  const labs = labsQuery.data ?? [];
  const selectedLab = labs.find((lab) => lab.labId === value.labId);
  const labOptions: SelectOptionItem[] = labs.map((lab) => ({
    value: String(lab.labId),
    label: `${lab.slug}  ${lab.labName}`,
  }));
  const isAnswer = value.mode === 'answer';
  const isText = value.answerFormat === 'text';

  return (
    <QuestionFrame value={value} onChange={onChange} errors={errors} showGuess={isAnswer}>
      <div className="flex flex-col gap-3">
        {labsQuery.isError ? (
          <ErrorState
            compact
            title="Labs could not be loaded"
            error={labsQuery.error}
            onRetry={() => void labsQuery.refetch()}
          />
        ) : (
          <Select
            label="Lab"
            required
            placeholder={labsQuery.isPending ? 'Loading labs' : 'Select a lab'}
            disabled={labsQuery.isPending}
            options={labOptions}
            value={value.labId === null ? '' : String(value.labId)}
            error={errors.labId}
            onChange={(event) =>
              onChange({
                ...value,
                labId: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        )}
        {selectedLab?.isPremium ? (
          <p role="status" className="flex items-center gap-2 text-sm text-signal">
            <Icon name="warning" size={16} />
            <span>Premium lab. Learners without premium access cannot answer this question.</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2">
          <span className="input-label">Mode</span>
          <TabSwitcher
            size="sm"
            ariaLabel="Terminal question mode"
            items={MODE_ITEMS}
            value={value.mode}
            onChange={(mode) => onChange(withMode(value, mode))}
          />
        </div>
        {isAnswer ? (
          <div className="flex flex-col gap-2">
            <span className="input-label">Answer format</span>
            <TabSwitcher
              size="sm"
              ariaLabel="Terminal answer format"
              items={FORMAT_ITEMS}
              value={value.answerFormat}
              onChange={(format) => onChange(withFormat(value, format))}
            />
          </div>
        ) : null}
      </div>

      <MarkdownField
        label="Instructions"
        rows={4}
        maxLength={INSTRUCTIONS_MAX}
        value={value.instructions}
        error={errors.instructions}
        onChange={(instructions) => onChange({ ...value, instructions })}
      />

      <CommandListField
        label="Setup commands"
        values={value.setup}
        maxItems={SETUP_MAX}
        maxLength={SETUP_COMMAND_MAX}
        placeholder="Shell command"
        addLabel="Add command"
        errors={indexedErrors(errors, 'setup', value.setup.length)}
        error={errors.setup}
        onChange={(setup) => onChange({ ...value, setup })}
      />

      {isAnswer ? (
        <OptionRows
          label={isText ? 'Accepted answers' : 'Options'}
          noun={isText ? 'Accepted answer' : 'Option'}
          addLabel={isText ? 'Add accepted answer' : 'Add option'}
          placeholder={isText ? 'Accepted answer text' : 'Option text'}
          rows={value.answers}
          marker={isText ? 'none' : 'radio'}
          max={isText ? TEXT_MAX : CHOICE_MAX}
          errors={errors}
          onChange={(answers) => onChange({ ...value, answers })}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <span className="input-label">Check</span>
          <CheckEditor
            value={value.check}
            errors={errors}
            onChange={(check: LabStepCheck) => onChange({ ...value, check })}
          />
        </div>
      )}
    </QuestionFrame>
  );
}

const answerRule = z
  .array(answerRowSchema)
  .max(TEXT_MAX, { error: `Use ${TEXT_MAX} answers or fewer.` });

export const terminalSchema = z
  .object({
    ...commonSchemaShape,
    instructions: z.string().max(INSTRUCTIONS_MAX, {
      error: `Use ${INSTRUCTIONS_MAX} characters or fewer.`,
    }),
    labId: z
      .number({ error: 'Choose a lab.' })
      .int({ error: 'Choose a lab.' })
      .positive({ error: 'Choose a lab.' }),
    mode: z.enum(['answer', 'check']),
    answerFormat: z.enum(['choice', 'text']),
    setup: z
      .array(
        z
          .string({ error: 'Enter a command or remove the row.' })
          .trim()
          .min(1, { error: 'Enter a command or remove the row.' })
          .max(SETUP_COMMAND_MAX, { error: `Use ${SETUP_COMMAND_MAX} characters or fewer.` }),
      )
      .max(SETUP_MAX, { error: `Use ${SETUP_MAX} commands or fewer.` }),
    answers: answerRule,
    check: z.custom<LabStepCheck>(() => true),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'answer') {
      if (!penaltyRule.safeParse(value.guessPenalty).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['guessPenalty'],
          message: 'Use a whole number from 0 to 1000.',
        });
      }
      if (value.answerFormat === 'choice') {
        if (value.answers.length < CHOICE_MIN) {
          ctx.addIssue({
            code: 'custom',
            path: ['answers'],
            message: `Add at least ${CHOICE_MIN} options.`,
          });
        }
        if (value.answers.filter((row) => row.isCorrect).length !== 1) {
          ctx.addIssue({
            code: 'custom',
            path: ['answers'],
            message: 'Mark exactly one correct option.',
          });
        }
      } else if (value.answers.length < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['answers'],
          message: 'Add at least 1 accepted answer.',
        });
      }
    } else {
      // Check questions carry no answers; the check's own messages are keyed by path.
      for (const [path, message] of Object.entries(getCheckIssues(value.check))) {
        ctx.addIssue({ code: 'custom', path: path.split('.'), message });
      }
    }
  });

export function terminalEmpty(): TerminalForm {
  return {
    ...commonEmpty(),
    instructions: '',
    labId: null,
    mode: 'answer',
    answerFormat: 'choice',
    setup: [],
    answers: blankRows(2),
    check: defaultCheck(),
  };
}

export function terminalToPayload(value: TerminalForm): CreateQuestionPayload {
  const isCheck = value.mode === 'check';
  const instructions = value.instructions.trim();
  const terminal: TerminalQuestionConfig['terminal'] = {
    labId: value.labId ?? Number.NaN,
    mode: value.mode,
    answerFormat: isCheck ? null : value.answerFormat,
    setup: value.setup.map((command) => command.trim()),
    ...(isCheck ? { check: value.check } : {}),
  };
  const config: TerminalQuestionConfig = {
    ...(instructions ? { instructions } : {}),
    ...penaltyConfig(value, !isCheck),
    terminal,
  };
  return {
    ...commonPayload(value),
    questionType: 'terminal',
    config,
    answers: isCheck ? [] : rowsPayload(value.answers, value.answerFormat === 'text'),
  };
}

export function terminalFromDto(question: AdminQuestionDto): TerminalForm {
  const config = readRecord(question.config);
  const terminal = readRecord(config.terminal);
  return {
    ...commonFromDto(question),
    instructions: typeof config.instructions === 'string' ? config.instructions : '',
    labId: typeof terminal.labId === 'number' ? terminal.labId : null,
    mode: terminal.mode === 'check' ? 'check' : 'answer',
    answerFormat: terminal.answerFormat === 'text' ? 'text' : 'choice',
    setup: Array.isArray(terminal.setup)
      ? terminal.setup.filter((command): command is string => typeof command === 'string')
      : [],
    answers: rowsFromDto(question.answers),
    check: (terminal.check ?? defaultCheck()) as LabStepCheck,
  };
}
