import { Icon } from '@/shared/components';
import type { LabSpecIssue } from '@/features/labs/types/labSpec';

// Server issues (blocking, mapped from paths to readable locations) and warnings
// (non-blocking lint from the server). Renders nothing when there is neither.

export interface SpecIssuesProps {
  issues: ReadonlyArray<LabSpecIssue>;
  warnings: ReadonlyArray<string>;
  /** Step titles by position, to name steps in messages. */
  stepTitles: ReadonlyArray<string>;
}

const FIELD_LABELS: Record<string, string> = {
  mode: 'Mode',
  scenario: 'Scenario',
  intro: 'Introduction',
  setup: 'Setup',
  completionBonus: 'Completion bonus',
  steps: 'Steps',
  id: 'Id',
  title: 'Title',
  instructions: 'Instructions',
  kind: 'Kind',
  check: 'Check',
  answer: 'Answer',
  accepted: 'Accepted answers',
  normalize: 'Matching',
  hints: 'Hints',
  text: 'Text',
  points: 'Points',
  hintCost: 'Hint cost',
  wrongPenalty: 'Wrong answer cost',
  guessPenalty: 'Guess cost',
  command: 'Command',
  path: 'Path',
  port: 'Port',
  expect: 'Expect',
  value: 'Value',
  timeoutMs: 'Timeout',
};

const LIST_ITEM_PARENTS = new Set(['setup', 'accepted', 'hints']);

/** `steps.2.check.command` -> `Step 3 "Title", Check, Command`. */
function describeIssuePath(path: string, stepTitles: ReadonlyArray<string>): string {
  if (path === '') return 'Spec';
  const segments = path.split('.');
  const parts: string[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const previous = segments[index - 1];
    if (/^\d+$/.test(segment)) {
      const position = Number(segment) + 1;
      if (previous === 'steps') {
        const title = stepTitles[Number(segment)];
        parts.push(title ? `Step ${position} "${title}"` : `Step ${position}`);
      } else if (previous === 'hints') {
        parts.push(`Hint ${position}`);
      } else if (previous !== undefined && LIST_ITEM_PARENTS.has(previous)) {
        parts.push(`Item ${position}`);
      } else {
        parts.push(String(position));
      }
    } else {
      parts.push(FIELD_LABELS[segment] ?? segment);
    }
  }
  return parts.join(', ');
}

export function SpecIssues({ issues, warnings, stepTitles }: SpecIssuesProps) {
  if (issues.length === 0 && warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {issues.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-card-foreground">Fix before saving</h3>
          <ul className="flex flex-col gap-2">
            {issues.map((issue, index) => (
              <li key={`${issue.path}-${index}`} className="flex items-start gap-2 text-sm">
                <Icon name="error" size={18} className="mt-0.5 shrink-0 text-signal" />
                <span className="min-w-0 break-words text-card-foreground">
                  <span className="font-medium">{describeIssuePath(issue.path, stepTitles)}</span>
                  {': '}
                  {issue.message}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {warnings.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-card-foreground">Warnings</h3>
          <ul className="flex flex-col gap-2">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`} className="flex items-start gap-2 text-sm">
                <Icon name="warning" size={18} className="mt-0.5 shrink-0 text-warning" />
                <span className="min-w-0 break-words text-card-foreground">{warning}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
