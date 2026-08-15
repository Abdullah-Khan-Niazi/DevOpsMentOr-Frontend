import type { ContentType } from '../types';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: 'Text',
  video: 'Video',
  interactive: 'Interactive',
  lab: 'Lab',
};

interface ContentTypeIconProps {
  type: ContentType;
}

/** F4: content-type icon for lesson rows and headers. */
export function ContentTypeIcon({ type }: ContentTypeIconProps) {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center text-muted"
      title={CONTENT_TYPE_LABELS[type]}
    >
      {type === 'text' ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6h16M4 12h10M4 18h13" />
        </svg>
      ) : null}
      {type === 'video' ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="14" height="14" rx="2" />
          <path d="M22 8l-6 4 6 4V8z" />
        </svg>
      ) : null}
      {type === 'interactive' ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 9l3 3-3 3M13 15h4" />
          <rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
      ) : null}
      {type === 'lab' ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
        </svg>
      ) : null}
    </span>
  );
}

export { CONTENT_TYPE_LABELS };
