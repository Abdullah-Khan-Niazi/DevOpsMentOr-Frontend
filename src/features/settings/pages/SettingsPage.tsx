import { Card, PageHeader } from '@/shared/components';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components';
import { SettingsForm } from '../components';
import { useSettings } from '../hooks';
import './SettingsPage.css';

const securityLinks = [
  {
    to: ROUTES.SECURITY,
    title: 'Security',
    description: 'Two-factor authentication and account protection.',
  },
  {
    to: ROUTES.LOGIN_HISTORY,
    title: 'Login history',
    description: 'Review your recent sign-in attempts.',
  },
  {
    to: ROUTES.API_TOKENS,
    title: 'API tokens',
    description: 'Personal tokens for programmatic API access.',
  },
] as const;

export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useSettings();

  return (
    <div>
      <PageHeader title="Settings" description="Configure organization preferences." />

      <div className="settings-hub">
        <h2 className="settings-hub__heading">Account security</h2>
        <div className="settings-hub__grid">
          {securityLinks.map((link) => (
            <Link key={link.to} to={link.to} className="settings-hub__link">
              <Card interactive className="settings-hub__card">
                <span className="settings-hub__card-title">{link.title}</span>
                <span className="settings-hub__card-description">{link.description}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="settings-hub">
        <h2 className="settings-hub__heading">Organization</h2>
        {isLoading ? <LoadingState label="Loading settings…" /> : null}

        {isError ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : null}

        {!isLoading && !isError && !data ? (
          <EmptyState
            title="Settings unavailable"
            description="Unable to load settings right now."
          />
        ) : null}

        {!isLoading && !isError && data ? <SettingsForm settings={data} /> : null}
      </div>
    </div>
  );
}
