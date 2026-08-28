interface AssertionItem {
  name: string;
  passed: boolean;
  message: string | null;
}

interface AssertionChecklistProps {
  items: AssertionItem[];
  isLoading?: boolean;
}

/**
 * SCR-F6-02 sidebar: per-assertion PASS/FAIL/PENDING indicators with the
 * user-facing hint on failure (never raw command output).
 */
export function AssertionChecklist({ items, isLoading = false }: AssertionChecklistProps) {
  if (items.length === 0) {
    return (
      <div className="assertion-checklist" data-testid="assertion-checklist">
        <p className="assertion-checklist__empty">
          Run checks to evaluate this lab&apos;s objectives.
        </p>
      </div>
    );
  }

  return (
    <ol className="assertion-checklist" data-testid="assertion-checklist">
      {items.map((item) => (
        <li
          key={item.name}
          className={`assertion-item assertion-item--${item.passed ? 'pass' : 'fail'}`}
        >
          <span className="assertion-item__icon" aria-hidden="true">
            {item.passed ? '✓' : '✕'}
          </span>
          <div className="assertion-item__body">
            <span className="assertion-item__name">{item.name}</span>
            {!item.passed && item.message && (
              <span className="assertion-item__hint">{item.message}</span>
            )}
          </div>
        </li>
      ))}
      {isLoading && (
        <li className="assertion-item assertion-item--pending" aria-label="Running checks">
          <span className="assertion-item__icon" aria-hidden="true">
            …
          </span>
          <span className="assertion-item__name">Running checks…</span>
        </li>
      )}
    </ol>
  );
}

export default AssertionChecklist;
