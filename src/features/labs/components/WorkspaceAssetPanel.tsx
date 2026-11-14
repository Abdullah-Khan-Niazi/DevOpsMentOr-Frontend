import { useEffect, useState } from 'react';
import { Button } from '@/shared/components';

export type WorkspaceAssetKind = 'slides' | 'walkthroughs';

interface WorkspaceAssetPanelProps {
  /** Asset collection served by the Labs engine (`/assets/slides/:slug`). */
  kind: WorkspaceAssetKind;
  /** Lesson slug used to match the deck; `null` when the lesson has none yet. */
  slug: string | null;
  /** Lesson title used in labels and iframe titles. */
  lessonTitle: string;
}

interface KindCopy {
  label: string;
  labelPlural: string;
}

const KIND_COPY: Record<WorkspaceAssetKind, KindCopy> = {
  slides: { label: 'slide deck', labelPlural: 'Slides' },
  walkthroughs: { label: 'walkthrough', labelPlural: 'Walkthrough' },
};

/**
 * `VITE_LABS_ASSETS_URL` is declared as an optional env var following the
 * `.env` convention; the Labs engine default is used when it is absent.
 */
function resolveLabsAssetsBaseUrl(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env.VITE_LABS_ASSETS_URL ?? 'http://localhost:5050/assets').replace(/\/+$/, '');
}

const LABS_ASSETS_BASE_URL = resolveLabsAssetsBaseUrl();

type ResolvedStatus = 'ready' | 'not-found' | 'invalid' | 'unreachable';
type AssetStatus = 'checking' | ResolvedStatus;

interface AssetProbeResult {
  url: string;
  attempt: number;
  status: ResolvedStatus;
}

/**
 * W11: Slides / Walkthrough tab body. Preflights the Labs asset URL (HEAD)
 * so a 404 or an unreachable engine surfaces a clear fallback with an
 * "Open in new tab" escape hatch and an explicit retry instead of a blank
 * iframe. Missing slugs render a distinct, actionless state.
 */
export function WorkspaceAssetPanel({ kind, slug, lessonTitle }: WorkspaceAssetPanelProps) {
  const copy = KIND_COPY[kind];
  const assetUrl = slug ? `${LABS_ASSETS_BASE_URL}/${kind}/${slug}` : null;

  const [attempt, setAttempt] = useState(0);
  const [probe, setProbe] = useState<AssetProbeResult | null>(null);
  const [loadedFrameKey, setLoadedFrameKey] = useState<string | null>(null);
  const frameKey = assetUrl ? `${assetUrl}#${attempt}` : null;

  useEffect(() => {
    if (!assetUrl) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    fetch(assetUrl, { method: 'HEAD', signal: controller.signal })
      .then((response) => {
        if (cancelled) return;
        let status: ResolvedStatus = 'unreachable';
        if (response.ok) {
          status = 'ready';
        } else if (response.status === 404) {
          status = 'not-found';
        } else if (response.status === 400) {
          status = 'invalid';
        }
        setProbe({ url: assetUrl, attempt, status });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setProbe({ url: assetUrl, attempt, status: 'unreachable' });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assetUrl, attempt]);

  // Derive the visible status without setState-in-effect: a stale probe (old
  // URL or pre-retry attempt) renders as "checking".
  const status: AssetStatus = !assetUrl
    ? 'not-found'
    : probe && probe.url === assetUrl && probe.attempt === attempt
      ? probe.status
      : 'checking';

  // No slug: the lesson simply has no deck wired up yet.
  if (!assetUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 bg-ink-deep text-pearl-100 text-center">
        <div className="w-12 h-12 rounded-full bg-pearl-100/10 border border-pearl-100/15 flex items-center justify-center text-pearl-100/60">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="18" x2="12" y2="21" />
          </svg>
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-sm font-mono font-bold text-pearl-100">
            No {copy.labelPlural.toLowerCase()} for this lesson yet
          </h3>
          <p className="text-xs font-mono text-pearl-100/60 leading-relaxed">
            {lessonTitle} has no slug, so the {copy.label} cannot be matched to a PDF asset. Set a
            lesson slug in the curriculum editor to connect the {copy.label}.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="font-mono text-xs"
          title={`A lesson slug is required before ${copy.labelPlural.toLowerCase()} can be opened.`}
        >
          Open in new tab
        </Button>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 p-8 bg-ink-deep text-pearl-100"
        role="status"
        aria-live="polite"
      >
        <div className="w-10 h-10 rounded-full border-2 border-pearl-100/20 border-t-pearl-100 animate-spin" />
        <p className="text-xs font-mono text-pearl-100/60">
          Loading {copy.label} for {lessonTitle}…
        </p>
      </div>
    );
  }

  if (status === 'ready') {
    const frameLoaded = loadedFrameKey === frameKey;
    return (
      <div className="flex-1 relative min-h-0 bg-ink-deep">
        {!frameLoaded && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink-deep text-pearl-100"
            role="status"
            aria-live="polite"
          >
            <div className="w-10 h-10 rounded-full border-2 border-pearl-100/20 border-t-pearl-100 animate-spin" />
            <p className="text-xs font-mono text-pearl-100/60">Rendering {copy.label}…</p>
          </div>
        )}
        <iframe
          key={frameKey}
          src={assetUrl}
          title={`${lessonTitle} — ${copy.labelPlural}`}
          referrerPolicy="no-referrer"
          onLoad={() => setLoadedFrameKey(frameKey)}
          className="w-full h-full border-0 bg-pearl-100"
        />
      </div>
    );
  }

  // `not-found` (404), `invalid` (400) and `unreachable` (engine down) share
  // the same recovery actions; only the message differs.
  const failureMessage =
    status === 'not-found'
      ? `The Labs engine has no ${copy.label} registered for slug "${slug}" (HTTP 404). The lesson slug may be out of date.`
      : status === 'invalid'
        ? `The Labs engine rejected the lesson slug "${slug}" (HTTP 400). Slugs must use lowercase letters, numbers, and hyphens.`
        : `Could not reach the Labs asset server at ${LABS_ASSETS_BASE_URL}. Start the Labs engine or set VITE_LABS_ASSETS_URL.`;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-ink-deep text-pearl-100 text-center">
      <div className="w-12 h-12 rounded-full bg-error/10 border border-error/30 flex items-center justify-center text-error">
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-1 max-w-lg">
        <h3 className="text-sm font-mono font-bold text-pearl-100">
          {status === 'not-found'
            ? `${copy.labelPlural} PDF not found`
            : status === 'invalid'
              ? 'Asset slug rejected'
              : 'Asset server unreachable'}
        </h3>
        <p className="text-xs font-mono text-pearl-100/60 leading-relaxed" role="alert">
          {failureMessage}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setAttempt((value) => value + 1)}
          className="font-mono text-xs"
        >
          Retry
        </Button>
        <a
          href={assetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--secondary btn--sm font-mono text-xs"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );
}

export default WorkspaceAssetPanel;
