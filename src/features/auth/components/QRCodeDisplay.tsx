import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// QRCodeDisplay — renders a TOTP otpauth URI as a scannable QR code
// (contract §10: `qrcode` npm package).

interface QRCodeDisplayProps {
  otpAuthUri: string;
  className?: string;
}

export function QRCodeDisplay({ otpAuthUri, className = '' }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(otpAuthUri, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#16191D', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [otpAuthUri]);

  if (error) {
    return <p className="auth-alert auth-alert--error">Unable to render the QR code.</p>;
  }

  if (!dataUrl) {
    return <p className="auth-status">Generating QR code…</p>;
  }

  return (
    <img
      src={dataUrl}
      alt="Scan this code with your authenticator app (TOTP)"
      className={`qr-code ${className}`.trim()}
      width={220}
      height={220}
    />
  );
}
