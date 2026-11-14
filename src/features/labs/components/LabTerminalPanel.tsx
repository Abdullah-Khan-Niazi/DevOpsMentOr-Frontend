import { useState, useRef } from 'react';

interface LabTerminalPanelProps {
  terminalWsUrl?: string;
  status: string;
  sshPort?: number;
}

export function LabTerminalPanel({
  terminalWsUrl,
  status,
  sshPort = 32771,
}: LabTerminalPanelProps) {
  const [copiedSsh, setCopiedSsh] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sshCommand = `ssh -p ${sshPort} student@localhost`;

  const copySsh = () => {
    void navigator.clipboard.writeText(sshCommand);
    setCopiedSsh(true);
    setTimeout(() => setCopiedSsh(false), 1600);
  };

  const reloadTerminal = () => {
    if (iframeRef.current && terminalWsUrl) {
      iframeRef.current.src = terminalWsUrl;
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#0d1117] overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-full flex-1 min-w-0'
      }`}
    >
      {/* Terminal Top Chrome */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#30363d] bg-[#161b22] px-3 font-mono text-xs text-[#8b949e]">
        {/* Left: Window Dots & Prompt */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#238636] shadow-[0_0_6px_#238636]" />
            <span className="text-[#c9d1d9]">student@devopsmentor-lab:~</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={copySsh}
            title={sshCommand}
            className="flex items-center gap-1 rounded border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors"
          >
            <span>{copiedSsh ? '✓ SSH Copied' : 'Copy SSH'}</span>
          </button>

          <button
            type="button"
            onClick={reloadTerminal}
            title="Reload Terminal Frame"
            className="flex items-center gap-1 rounded border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors"
          >
            <span>↺ Reload</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen"
            className="flex items-center gap-1 rounded border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[#c9d1d9] hover:bg-[#30363d] hover:text-white transition-colors"
          >
            <span>{isFullscreen ? '⤓ Exit Full' : '⤢ Full'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="relative flex-1 bg-[#0d1117] overflow-hidden">
        {terminalWsUrl ? (
          <iframe
            ref={iframeRef}
            className="h-full w-full border-none bg-[#0d1117] block"
            title="Interactive Lab Terminal"
            src={terminalWsUrl}
            allow="clipboard-read; clipboard-write"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            onLoad={(event) => {
              event.currentTarget.contentWindow?.postMessage({ type: 'resize' }, '*');
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117] font-mono text-xs text-[#8b949e]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#30363d] border-t-[#58a6ff] mb-3" />
            <p>
              {status === 'running'
                ? 'Connecting to web terminal...'
                : `Instance container is ${status}...`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LabTerminalPanel;
