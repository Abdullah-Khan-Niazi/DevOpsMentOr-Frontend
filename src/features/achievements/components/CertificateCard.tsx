import { Button, Card } from '@/shared/components';
import type { CertificateDto } from '../types';

// SCR-F7-01 certificate preview card: course title, certificate number,
// issue date, plain-text validity status (no pills per guidelines), and
// owner-only Download + Copy share link actions.

interface CertificateCardProps {
  certificate: CertificateDto;
  onDownload: (certId: number) => void;
  onCopyLink: (certNumber: string) => void;
}

export function CertificateCard({ certificate, onDownload, onCopyLink }: CertificateCardProps) {
  const issued = new Date(certificate.issuedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="certificate-card">
      <div className="certificate-card__header">
        <h3 className="certificate-card__title">{certificate.courseTitle}</h3>
        <span
          className={`certificate-card__status certificate-card__status--${
            certificate.isValid ? 'valid' : 'invalid'
          }`}
        >
          {certificate.isValid ? 'Valid' : 'Invalidated'}
        </span>
      </div>
      <p className="certificate-card__number">{certificate.certificateNumber}</p>
      <p className="certificate-card__meta">
        Issued {issued}
        {certificate.grade !== null ? ` · Grade ${certificate.grade}%` : ''}
      </p>
      <div className="certificate-card__actions">
        <Button size="sm" onClick={() => onDownload(certificate.certificateId)}>
          Download
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onCopyLink(certificate.certificateNumber)}
        >
          Copy share link
        </Button>
      </div>
    </Card>
  );
}

export default CertificateCard;
