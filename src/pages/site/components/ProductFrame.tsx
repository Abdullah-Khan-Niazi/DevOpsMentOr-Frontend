import type { ReactNode } from 'react';
import './ProductFrame.css';

// §3.6 — Product Frame: unified window chrome for all product mockups.
// This is the ONE frame component — terminal, student dashboard, instructor
// analytics all use identical chrome. Consistency is what sells "one product."

interface ProductFrameProps {
  label?: string; // right-aligned label in the dot bar, e.g. "bash — devopsmentor"
  children: ReactNode; // the content rendered in the frame body
  className?: string;
}

export function ProductFrame({
  label = 'bash — devopsmentor',
  children,
  className = '',
}: ProductFrameProps) {
  return (
    <div className={`pf-frame ${className}`.trim()}>
      {/* 3-dot header bar */}
      <div className="pf-bar" role="presentation">
        <div className="pf-dots" aria-hidden="true">
          <span className="pf-dot" />
          <span className="pf-dot" />
          <span className="pf-dot" />
        </div>
        {label && (
          <span className="pf-label" aria-hidden="true">
            {label}
          </span>
        )}
      </div>
      {/* Frame body */}
      <div className="pf-body">{children}</div>
    </div>
  );
}
