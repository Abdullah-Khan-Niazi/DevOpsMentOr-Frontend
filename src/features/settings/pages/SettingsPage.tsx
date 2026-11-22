import { Card, PageHeader } from '@/shared/components';
import { SettingsSkeleton } from './SettingsSkeleton';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import { EmptyState, ErrorState } from '@/shared/components';
import { SettingsForm } from '../components';
import { useSettings } from '../hooks';
import './SettingsPage.css';

const securityLinks = [
  {
    to: ROUTES.PREFERENCES,
    title: 'Preferences',
  },
  {
    to: ROUTES.SECURITY,
    title: 'Security',
  },
  {
    to: ROUTES.LOGIN_HISTORY,
    title: 'Login history',
  },
  {
    to: ROUTES.API_TOKENS,
    title: 'API tokens',
  },
  {
    to: ROUTES.VPN_SETTINGS,
    title: 'VPN',
  },
  {
    to: ROUTES.BILLING,
    title: 'Billing',
  },
] as const;

export default function SettingsPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useSettings();

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="settings-hub">
        <h2 className="settings-hub__heading">Account security</h2>
        <div className="settings-hub__grid">
          {securityLinks.map((link) => (
            <Link key={link.to} to={link.to} className="settings-hub__link">
              <Card interactive className="settings-hub__card">
                <span className="settings-hub__card-title">{link.title}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="settings-hub">
        <h2 className="settings-hub__heading">Organization</h2>
        {isError ? (
          <ErrorState
            message={error.message}
            onRetry={() => void refetch()}
            retrying={isRefetching}
          />
        ) : null}

        {!isError && !data ? <EmptyState title="Settings unavailable" icon="settings" /> : null}

        {!isError && data ? <SettingsForm settings={data} /> : null}
      </div>
    </div>
  );
}
