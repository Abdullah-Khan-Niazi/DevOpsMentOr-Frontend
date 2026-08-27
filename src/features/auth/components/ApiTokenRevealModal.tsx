import { useState } from 'react';
import { Button, Modal } from '@/shared/components';

// ApiTokenRevealModal — one-time raw token display with copy button.
// The raw token cannot be recovered after close; the modal warns accordingly.

interface ApiTokenRevealModalProps {
  open: boolean;
  tokenName: string;
  rawToken: string;
  onClose: () => void;
}

export function ApiTokenRevealModal({
  open,
  tokenName,
  rawToken,
  onClose,
}: ApiTokenRevealModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawToken);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="API token created">
      <p className="modal-panel__body">
        Copy your token now — for security, it is shown only once and cannot be retrieved again.
      </p>

      <div className="token-reveal">
        <span className="token-reveal__name">{tokenName}</span>
        <code className="token-reveal__value">{rawToken}</code>
        <Button type="button" variant="secondary" className="w-full" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy token'}
        </Button>
      </div>

      <div className="modal-panel__actions">
        <Button type="button" variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
