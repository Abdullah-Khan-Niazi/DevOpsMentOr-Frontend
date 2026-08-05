import './SiteSpineList.css';

// §5.7.3 & §5.8.2 — Definition List with a Visual Spine
// Reusable component shared between For Institutions (§5.7) and Security & Trust (§5.8).
// Features a continuous 2px vertical accent rule (--color-accent-500 at 30% opacity),
// tick markers on each row, mono label left, description right, and hairline row separators.

export interface SiteSpineItem {
  label: string;
  description: string;
}

export interface SiteSpineListProps {
  items: SiteSpineItem[];
  className?: string;
}

export function SiteSpineList({ items, className = '' }: SiteSpineListProps) {
  return (
    <div className={`site-spine-list ${className}`.trim()} role="list">
      {/* Continuous 2px vertical accent rule running full height */}
      <div className="site-spine-line" aria-hidden="true" />

      {items.map((item, index) => (
        <div key={index} className="site-spine-row" role="listitem">
          {/* Tick marker rendered directly on the continuous rule */}
          <div className="site-spine-tick" aria-hidden="true" />

          <div className="site-spine-content">
            {/* Mono label left */}
            <div className="site-spine-label">{item.label}</div>

            {/* Description right */}
            <div className="site-spine-description">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
