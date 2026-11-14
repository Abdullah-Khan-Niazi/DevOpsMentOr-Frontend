import { useEffect, type ReactNode } from 'react';

interface CurriculumDrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
  /** Small mono label above the title, e.g. `CREATE · MODULE`. */
  eyebrow: string;
  title: string;
  children: ReactNode;
}

/**
 * Shared slide-over shell for every curriculum drawer task (create/edit track,
 * attach course, create/edit curriculum nodes). Esc and the backdrop always
 * close the drawer, including while a mutation is pending.
 */
export function CurriculumDrawerShell({
  isOpen,
  onClose,
  eyebrow,
  title,
  children,
}: CurriculumDrawerShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="presentation">
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="flex w-screen max-w-2xl flex-col overflow-y-auto rounded-l-md border-l border-border bg-card p-6 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div className="min-w-0">
              <span className="block font-mono text-micro font-bold uppercase tracking-wider text-muted">
                {eyebrow}
              </span>
              <h2 className="truncate text-lg font-bold text-card-foreground">{title}</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xs p-1.5 text-muted transition-colors hover:text-card-foreground"
              aria-label="Close drawer"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="pt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default CurriculumDrawerShell;
