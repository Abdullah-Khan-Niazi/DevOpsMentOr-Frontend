import type { ReactNode } from 'react';
import './ProductFrame.css';

// §3.6 — Product Frame: two sanctioned chrome variants, chosen by content type.
//  - 'app'     (app-window): traffic dots + right-aligned label, body --color-bg-sunken.
//              Used for the Lab Terminal (conceptually a native/terminal surface).
//  - 'browser' (browser-style): traffic dots + centered URL-bar pill (mono, bg-sunken —
//              the ONE sanctioned pill shape on the site, because it depicts a real
//              browser affordance). Body --color-bg-void. Used for dashboards/analytics.
// No third chrome style exists anywhere on the site.

type ProductFrameVariant = 'app' | 'browser';

interface ProductFrameProps {
  variant?: ProductFrameVariant;
  label?: string; // app-window right-aligned label, e.g. "bash — devopsmentor"
  url?: string; // browser URL-bar content, e.g. "app.devopsmentor.io/dashboard"
  children: ReactNode; // the content rendered in the frame body
  className?: string;
}

export function ProductFrame({
  variant = 'app',
  label = 'bash — devopsmentor',
  url = 'app.devopsmentor.io',
  children,
  className = '',
}: ProductFrameProps) {
  return (
    <div className={`pf-frame pf-frame--${variant} ${className}`.trim()}>
      {/* 3-dot header bar */}
      <div className="pf-bar" role="presentation">
        <div className="pf-dots" aria-hidden="true">
          <span className="pf-dot" />
          <span className="pf-dot" />
          <span className="pf-dot" />
        </div>
        {variant === 'browser' ? (
          <span className="pf-urlbar" aria-hidden="true">
            {url}
          </span>
        ) : (
          label && (
            <span className="pf-label" aria-hidden="true">
              {label}
            </span>
          )
        )}
      </div>
      {/* Frame body */}
      <div className="pf-body">{children}</div>
    </div>
  );
}
