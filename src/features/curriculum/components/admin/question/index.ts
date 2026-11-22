import type { AdminQuestionType } from '@/features/curriculum/types/admin';
import {
  ChoiceEditor,
  choiceEmpty,
  choiceFromDto,
  choiceSchema,
  choiceToPayload,
} from './ChoiceEditor';
import {
  TrueFalseEditor,
  trueFalseEmpty,
  trueFalseFromDto,
  trueFalseSchema,
  trueFalseToPayload,
} from './TrueFalseEditor';
import {
  MultiSelectEditor,
  multiSelectEmpty,
  multiSelectFromDto,
  multiSelectSchema,
  multiSelectToPayload,
} from './MultiSelectEditor';
import {
  FillBlankEditor,
  fillBlankEmpty,
  fillBlankFromDto,
  fillBlankSchema,
  fillBlankToPayload,
} from './FillBlankEditor';
import {
  OrderingEditor,
  orderingEmpty,
  orderingFromDto,
  orderingSchema,
  orderingToPayload,
} from './OrderingEditor';
import {
  BucketSortEditor,
  bucketSortEmpty,
  bucketSortFromDto,
  bucketSortSchema,
  bucketSortToPayload,
} from './BucketSortEditor';
import {
  TerminalEditor,
  terminalEmpty,
  terminalFromDto,
  terminalSchema,
  terminalToPayload,
} from './TerminalEditor';
import { eraseModule, type AnyQuestionEditorModule } from './types';

// Registry of the seven question editors, keyed by question type (contract C§6.1).

export { type QuestionEditorModule, type AnyQuestionEditorModule } from './types';

export const QUESTION_EDITORS: Record<AdminQuestionType, AnyQuestionEditorModule> = {
  multiple_choice: eraseModule({
    type: 'multiple_choice',
    label: 'Multiple choice',
    icon: 'circle',
    Editor: ChoiceEditor,
    schema: choiceSchema,
    empty: choiceEmpty,
    toPayload: choiceToPayload,
    fromDto: choiceFromDto,
  }),
  true_false: eraseModule({
    type: 'true_false',
    label: 'True or false',
    icon: 'check-circle',
    Editor: TrueFalseEditor,
    schema: trueFalseSchema,
    empty: trueFalseEmpty,
    toPayload: trueFalseToPayload,
    fromDto: trueFalseFromDto,
  }),
  multiple_select: eraseModule({
    type: 'multiple_select',
    label: 'Multiple select',
    icon: 'checklist',
    Editor: MultiSelectEditor,
    schema: multiSelectSchema,
    empty: multiSelectEmpty,
    toPayload: multiSelectToPayload,
    fromDto: multiSelectFromDto,
  }),
  fill_blank: eraseModule({
    type: 'fill_blank',
    label: 'Fill in the blank',
    icon: 'edit',
    Editor: FillBlankEditor,
    schema: fillBlankSchema,
    empty: fillBlankEmpty,
    toPayload: fillBlankToPayload,
    fromDto: fillBlankFromDto,
  }),
  ordering: eraseModule({
    type: 'ordering',
    label: 'Ordering',
    icon: 'numbered',
    Editor: OrderingEditor,
    schema: orderingSchema,
    empty: orderingEmpty,
    toPayload: orderingToPayload,
    fromDto: orderingFromDto,
  }),
  bucket_sort: eraseModule({
    type: 'bucket_sort',
    label: 'Bucket sort',
    icon: 'layers',
    Editor: BucketSortEditor,
    schema: bucketSortSchema,
    empty: bucketSortEmpty,
    toPayload: bucketSortToPayload,
    fromDto: bucketSortFromDto,
  }),
  terminal: eraseModule({
    type: 'terminal',
    label: 'Terminal',
    icon: 'terminal',
    Editor: TerminalEditor,
    schema: terminalSchema,
    empty: terminalEmpty,
    toPayload: terminalToPayload,
    fromDto: terminalFromDto,
  }),
};

/** Question types in the order the "Add question" menu lists them. */
export const QUESTION_TYPES: AdminQuestionType[] = [
  'multiple_choice',
  'true_false',
  'multiple_select',
  'fill_blank',
  'ordering',
  'bucket_sort',
  'terminal',
];

export function getEditor(type: AdminQuestionType): AnyQuestionEditorModule {
  return QUESTION_EDITORS[type];
}
