import { useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '@/shared/components';
import { MinimalVerificationLayout } from '../components/MinimalVerificationLayout';
import { VerificationCard } from '../components/VerificationCard';
import { useVerifyCertificate } from '../hooks/useCertificate';

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return 'No certificate matches this number.';
}

/** SCR-F7-05: public certificate verification by certificate number. */
export function VerifyCertificatePage() {
  const { certNumber } = useParams<{ certNumber: string }>();
  const verification = useVerifyCertificate(certNumber);

  return (
    <MinimalVerificationLayout>
      {verification.isLoading ? (
        <LoadingState label="Verifying certificate…" />
      ) : verification.isError || !verification.data ? (
        <ErrorState title="Certificate not found" message={errorMessage(verification.error)} />
      ) : (
        <VerificationCard verification={verification.data} />
      )}
    </MinimalVerificationLayout>
  );
}

export default VerifyCertificatePage;
