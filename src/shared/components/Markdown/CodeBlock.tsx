import { useEffect, useState } from 'react';
import { IconButton } from '@/shared/components/IconButton';
import { toast } from '@/shared/components/Toast';

export interface CodeBlockProps {
  code: string;
  language?: string;
}

const COPIED_MS = 1500;

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for insecure contexts without the async clipboard API.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('Copy failed');
}

/** Fenced code: monospace, horizontal scroll, copy button with a "Copied" state. Never executed. */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="md-code">
      <pre className="md-code__pre" data-language={language || undefined}>
        <code>{code}</code>
      </pre>
      <IconButton
        icon={copied ? 'check' : 'copy'}
        label={copied ? 'Copied' : 'Copy code'}
        size="sm"
        tooltipSide="top"
        className="md-code__copy"
        onClick={() => {
          copyText(code).then(
            () => setCopied(true),
            () => toast.error('Could not copy to the clipboard.'),
          );
        }}
      />
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  );
}
