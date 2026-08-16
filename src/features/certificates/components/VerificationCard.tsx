import { Card, Icon } from '@/shared/components';
import type { CertificateVerificationDto } from '../types';

// SCR-F7-05 §10: standalone verification display. Green checkmark for valid
// certificates, red X for invalid. Plain-text validity statement, no pills.

interface VerificationCardProps {
  verification: CertificateVerificationDto;
}

export function VerificationCard({ verification }: VerificationCardProps) {
  const valid = verification.isValid;
  return (
    <Card className="verification-card" highlighted={valid}>
      <div
        className={`verification-card__badge ${
          valid ? 'verification-card__badge--valid' : 'verification-card__badge--invalid'
        }`}
      >
        <Icon name={valid ? 'roles' : 'x-circle'} size={30} />
      </div>
      <h1 className="verification-card__heading">
        {valid ? 'Certificate Valid' : 'Certificate Invalid'}
      </h1>
      <p className="verification-card__statement">
        {valid
          ? 'This certificate was issued by DevOps Mentor and is genuine.'
          : 'This certificate number is no longer valid.'}
      </p>

      <dl className="verification-card__details">
        <div className="verification-card__row">
          <dt>Certificate number</dt>
          <dd>{verification.certificateNumber}</dd>
        </div>
        <div className="verification-card__row">
          <dt>Issued to</dt>
          <dd>{verification.holderName}</dd>
        </div>
        <div className="verification-card__row">
          <dt>Course</dt>
          <dd>{verification.courseTitle}</dd>
        </div>
        <div className="verification-card__row">
          <dt>Issued</dt>
          <dd>
            {new Date(verification.issuedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export default VerificationCard;
