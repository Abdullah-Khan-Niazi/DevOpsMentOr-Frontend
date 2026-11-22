import '../styles/labs.css';
import { useState } from 'react';
import { Button, Card, EmptyState, ErrorState, PageHeader } from '@/shared/components';
import { VpnSettingsSkeleton } from './VpnSettingsSkeleton';
import { useVpnConfig } from '../hooks';
import type { VpnRegion } from '../types';

/** LAB-10: VPN assignment details with signed .ovpn download link. */
export function VpnSettingsPage() {
  const [region, setRegion] = useState<VpnRegion>('US');
  const { data, isLoading, isError, error, refetch, isFetching } = useVpnConfig();

  if (isLoading) {
    return <VpnSettingsSkeleton />;
  }

  return (
    <div className="vpn-settings">
      <PageHeader title="VPN" />

      {isError ? (
        <ErrorState
          title="Could not load VPN config"
          message={error.message}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : (
        <Card className="vpn-settings__card">
          {data ? (
            <dl className="vpn-settings__meta">
              <div>
                <dt>Server</dt>
                <dd>{data.serverName}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{data.serverLocation ?? 'Not disclosed'}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{data.region}</dd>
              </div>
              <div>
                <dt>Assigned</dt>
                <dd>{new Date(data.assignedAt).toLocaleString()}</dd>
              </div>
              {data.expiresAt && (
                <div>
                  <dt>Expires</dt>
                  <dd>{new Date(data.expiresAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          ) : (
            <EmptyState title="No VPN assignment yet" icon="vpn" />
          )}

          <div className="vpn-settings__actions">
            <div className="vpn-settings__region">
              <label className="input-label" htmlFor="vpn-region-settings">
                Request region
              </label>
              <select
                id="vpn-region-settings"
                className="input-field"
                value={region}
                onChange={(e) => setRegion(e.target.value as VpnRegion)}
              >
                {(['US', 'EU', 'ASIA', 'AUSTRALIA', 'SOUTH_AMERICA', 'AFRICA'] as VpnRegion[]).map(
                  (r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ),
                )}
              </select>
              <Button variant="secondary" isLoading={isFetching} onClick={() => void refetch()}>
                Refresh
              </Button>
            </div>
            {data?.ovpnConfigUrl && (
              <Button href={data.ovpnConfigUrl} external>
                Download OpenVPN config
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default VpnSettingsPage;
