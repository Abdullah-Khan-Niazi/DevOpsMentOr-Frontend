import { useId, useState } from 'react';
import { Icon } from '@/shared/components/Icon';
import { Collapsible } from '@/shared/components/Collapsible';
import { Markdown } from '@/shared/components/Markdown';

export interface ScenarioPanelProps {
  /** `scenarioIntro` from the server (Markdown). */
  markdown: string;
  defaultOpen: boolean;
}

/** Collapsible scenario intro. Renders nothing when the lab has no scenario text. */
export function ScenarioPanel({ markdown, defaultOpen }: ScenarioPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  if (!markdown.trim()) return null;

  return (
    <section>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 py-1 text-left text-base font-semibold text-card-foreground"
        >
          Scenario
          <span className="chevron-rotate inline-flex shrink-0" data-open={open ? 'true' : 'false'}>
            <Icon name="chevron-down" size={20} />
          </span>
        </button>
      </h2>
      <Collapsible open={open} id={contentId}>
        <div className="pt-3">
          <Markdown variant="prose">{markdown}</Markdown>
        </div>
      </Collapsible>
    </section>
  );
}
