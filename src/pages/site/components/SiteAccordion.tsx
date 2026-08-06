import { useState, type ReactNode } from 'react';
import './SiteAccordion.css';

export interface AccordionItemData {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface SiteAccordionProps {
  items: AccordionItemData[];
  className?: string;
  allowMultiple?: boolean;
  defaultExpandedIds?: string[];
}

export function SiteAccordion({
  items,
  className = '',
  allowMultiple = false,
  defaultExpandedIds = [],
}: SiteAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpandedIds);

  const toggleItem = (id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (allowMultiple) {
        return [...prev, id];
      }
      return [id];
    });
  };

  return (
    <div className={`site-accordion ${className}`.trim()}>
      {items.map((item) => {
        const isExpanded = expandedIds.includes(item.id);
        const buttonId = `accordion-btn-${item.id}`;
        const panelId = `accordion-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className={`site-accordion__item ${isExpanded ? 'site-accordion__item--expanded' : ''}`}
          >
            <button
              type="button"
              id={buttonId}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={() => toggleItem(item.id)}
              className="site-accordion__trigger"
            >
              <span className="site-accordion__question">{item.question}</span>
              <span className="site-accordion__icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isExpanded}
              className="site-accordion__panel"
            >
              <div className="site-accordion__content">
                <p className="site-accordion__answer">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
