import { memo } from 'react';

interface TerminalIframeProps {
  terminalWsUrl: string;
  title?: string;
}

/**
 * SCR-F6-02: full-viewport terminal embed. The iframe origin owns the
 * xterm.js WebSocket client (never wrapped here); the parent only sets the
 * `src` from the provision response and forwards postMessage resize events.
 */
export const TerminalIframe = memo(function TerminalIframe({
  terminalWsUrl,
  title = 'Lab Terminal',
}: TerminalIframeProps) {
  return (
    <div className="terminal-iframe-wrap">
      <iframe
        className="terminal-iframe"
        title={title}
        src={terminalWsUrl}
        scrolling="no"
        sandbox="allow-scripts allow-same-origin"
        onLoad={(event) => {
          event.currentTarget.contentWindow?.postMessage({ type: 'resize' }, '*');
        }}
      />
    </div>
  );
});

export default TerminalIframe;
