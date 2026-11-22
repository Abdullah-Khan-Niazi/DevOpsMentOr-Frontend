import { z } from 'zod';
import {
  Button,
  FieldError,
  IconButton,
  Input,
  Select,
  type SelectOptionItem,
} from '@/shared/components';
import type { AdminQuestionDto, CreateQuestionPayload } from '@/features/curriculum/types/admin';
import { StringListField } from '../fields/StringListField';
import { QuestionFrame } from './ChoiceEditor';
import {
  ANSWER_TEXT_MAX,
  BUCKET_NAME_MAX,
  answerTextRule,
  commonEmpty,
  commonFromDto,
  commonPayload,
  commonSchemaShape,
  indexedErrors,
  nextKey,
  penaltyConfig,
  readRecord,
  type BucketCardRow,
  type BucketSortForm,
} from './types';

// Bucket sort (C§6.1: buckets 2..8 in config.buckets, cards 1..40). Each card picks its
// bucket; the answer order is the 1-based bucket index (D25).

const CARD_MIN = 1;
const CARD_MAX = 40;
const BUCKET_MIN = 2;
const BUCKET_MAX = 8;

function bucketOptions(buckets: string[]): SelectOptionItem[] {
  return buckets.map((name, index) => ({
    value: String(index + 1),
    label: name.trim() || `Bucket ${index + 1}`,
  }));
}

/**
 * Maps each old 1-based bucket index to its index after a list edit, so cards follow
 * their bucket when one is removed or moved (Alt+Arrow swaps two neighbours). A removed
 * bucket maps to null; renames and additions keep every index.
 */
function bucketIndexMap(previous: string[], next: string[]): (order: number) => number | null {
  if (next.length === previous.length - 1) {
    let removed = next.findIndex((name, index) => name !== previous[index]);
    if (removed < 0) removed = previous.length - 1;
    const removedOrder = removed + 1;
    return (order) => (order === removedOrder ? null : order > removedOrder ? order - 1 : order);
  }
  if (next.length === previous.length) {
    const changed = previous.flatMap((name, index) => (name !== next[index] ? [index] : []));
    if (
      changed.length === 2 &&
      changed[1] === changed[0] + 1 &&
      previous[changed[0]] === next[changed[1]] &&
      previous[changed[1]] === next[changed[0]]
    ) {
      const [a, b] = [changed[0] + 1, changed[1] + 1];
      return (order) => (order === a ? b : order === b ? a : order);
    }
  }
  return (order) => order;
}

export function BucketSortEditor({
  value,
  onChange,
  errors,
}: {
  value: BucketSortForm;
  onChange(next: BucketSortForm): void;
  errors: Record<string, string>;
}) {
  const options = bucketOptions(value.buckets);
  const cards = value.answers;

  function updateCard(index: number, patch: Partial<BucketCardRow>) {
    onChange({
      ...value,
      answers: cards.map((card, position) => (position === index ? { ...card, ...patch } : card)),
    });
  }

  return (
    <QuestionFrame value={value} onChange={onChange} errors={errors}>
      <StringListField
        label="Buckets"
        required
        values={value.buckets}
        maxItems={BUCKET_MAX}
        maxLength={BUCKET_NAME_MAX}
        placeholder="Bucket name"
        addLabel="Add bucket"
        errors={indexedErrors(errors, 'buckets', value.buckets.length)}
        error={errors.buckets}
        onChange={(buckets) => {
          const remap = bucketIndexMap(value.buckets, buckets);
          onChange({
            ...value,
            buckets,
            answers: cards.map((card) => ({
              ...card,
              answerOrder: card.answerOrder === null ? null : remap(card.answerOrder),
            })),
          });
        }}
      />

      <div className="flex flex-col gap-3">
        <span className="input-label">
          Cards
          <span className="text-signal ml-0.5" aria-hidden="true">
            *
          </span>
        </span>
        <div className="flex flex-col gap-2">
          {cards.map((card, index) => (
            <div key={card.key} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <Input
                  aria-label={`Card ${index + 1}`}
                  placeholder="Card text"
                  maxLength={ANSWER_TEXT_MAX}
                  value={card.answerText}
                  error={errors[`answers.${index}.answerText`]}
                  onChange={(event) => updateCard(index, { answerText: event.target.value })}
                />
              </div>
              <div className="w-full sm:w-52">
                <Select
                  aria-label={`Bucket for card ${index + 1}`}
                  placeholder="Choose a bucket"
                  required
                  options={options}
                  value={card.answerOrder === null ? '' : String(card.answerOrder)}
                  error={errors[`answers.${index}.answerOrder`]}
                  onChange={(event) =>
                    updateCard(index, {
                      answerOrder: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                />
              </div>
              <IconButton
                icon="delete"
                label={`Remove card ${index + 1}`}
                tone="danger"
                className="sm:mt-1"
                onClick={() =>
                  onChange({ ...value, answers: cards.filter((_, position) => position !== index) })
                }
              />
            </div>
          ))}
        </div>
        <FieldError message={errors.answers} />
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconName="plus"
            disabled={cards.length >= CARD_MAX}
            onClick={() =>
              onChange({
                ...value,
                answers: [...cards, { key: nextKey(), answerText: '', answerOrder: null }],
              })
            }
          >
            Add card
          </Button>
        </div>
      </div>
    </QuestionFrame>
  );
}

export const bucketSortSchema = z
  .object({
    ...commonSchemaShape,
    buckets: z
      .array(
        z
          .string({ error: 'Enter a bucket name.' })
          .trim()
          .min(1, { error: 'Enter a bucket name.' })
          .max(BUCKET_NAME_MAX, { error: `Use ${BUCKET_NAME_MAX} characters or fewer.` }),
      )
      .min(BUCKET_MIN, { error: `Add at least ${BUCKET_MIN} buckets.` })
      .max(BUCKET_MAX, { error: `Use ${BUCKET_MAX} buckets or fewer.` }),
    answers: z
      .array(
        z.object({
          key: z.string(),
          answerText: answerTextRule,
          answerOrder: z.number().nullable(),
        }),
      )
      .min(CARD_MIN, { error: `Add at least ${CARD_MIN} card.` })
      .max(CARD_MAX, { error: `Use ${CARD_MAX} cards or fewer.` }),
  })
  .superRefine((value, ctx) => {
    value.answers.forEach((card, index) => {
      const bucket = card.answerOrder;
      if (bucket === null || bucket < 1 || bucket > value.buckets.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['answers', index, 'answerOrder'],
          message: 'Choose a bucket for this card.',
        });
      }
    });
  });

export function bucketSortEmpty(): BucketSortForm {
  return {
    ...commonEmpty(),
    buckets: ['', ''],
    answers: [{ key: nextKey(), answerText: '', answerOrder: null }],
  };
}

export function bucketSortToPayload(value: BucketSortForm): CreateQuestionPayload {
  return {
    ...commonPayload(value),
    questionType: 'bucket_sort',
    config: {
      ...penaltyConfig(value, false),
      buckets: value.buckets.map((name) => name.trim()),
    },
    answers: value.answers.map((card) => ({
      answerText: card.answerText.trim(),
      isCorrect: true,
      answerOrder: card.answerOrder ?? Number.NaN,
    })),
  };
}

export function bucketSortFromDto(question: AdminQuestionDto): BucketSortForm {
  const config = readRecord(question.config);
  const buckets = Array.isArray(config.buckets)
    ? config.buckets.filter((name): name is string => typeof name === 'string')
    : [];
  return {
    ...commonFromDto(question),
    buckets,
    answers: question.answers.map((answer) => ({
      key: nextKey(),
      answerText: answer.answerText,
      answerOrder: answer.answerOrder,
    })),
  };
}
