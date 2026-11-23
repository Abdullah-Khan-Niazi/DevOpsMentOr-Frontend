import { memo, useEffect, useRef } from 'react';
import { safeHttpUrl } from '@/shared/utils';

export interface TerminalFrameProps {
  /** Terminal URL from the active lab environment. Rendered only when it is an absolute http(s) URL. */
  url: string;
  /** Changing this value remounts the frame (the toolbar reconnect action). */
  reloadKey: number;
}

/** Web terminal embed for the running lab environment. The terminal page owns its own session client. */
export const TerminalFrame = memo(function TerminalFrame({ url, reloadKey }: TerminalFrameProps) {
  const src = safeHttpUrl(url);
  const terminalOrigin = src ? new URL(src).origin : null;
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // The pane resizes with the split handle and the window: tell the terminal page to refit.
  // Messages target the terminal origin only (never '*').
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !terminalOrigin || typeof ResizeObserver === 'undefined') return undefined;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frameRef.current?.contentWindow?.postMessage({ type: 'resize' }, terminalOrigin);
      });
    });
    observer.observe(wrap);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [terminalOrigin]);

  if (!src || !terminalOrigin) return null;

  return (
    <div
      ref={wrapRef}
      className="terminal-iframe-wrap relative flex min-h-0 flex-1 overflow-hidden bg-ink-deep"
    >
      <iframe
        key={reloadKey}
        ref={frameRef}
        title="Lab terminal"
        src={src}
        scrolling="no"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms"
        className="terminal-iframe absolute inset-y-0 left-0 h-full border-0 bg-ink-deep"
        onLoad={(event) => {
          event.currentTarget.contentWindow?.postMessage({ type: 'resize' }, terminalOrigin);
        }}
      />
    </div>
  );
});

export default TerminalFrame;
