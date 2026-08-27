import '../styles/labs.css';
import { useState } from 'react';
import { Button, Card, ErrorState, LoadingState, PageHeader } from '@/shared/components';
import { useVpnConfig } from '../hooks';
import type { VpnRegion } from '../types';

/** LAB-10: VPN assignment details with signed .ovpn download link. */
export function VpnSettingsPage() {
  const [region, setRegion] = useState<VpnRegion>('US');
  const { data, isLoading, isError, error, refetch, isFetching } = useVpnConfig();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="vpn-settings">
      <PageHeader
        title="VPN"
        description="Your secure network assignment for lab instances. The config link expires after one hour."
      />

      {isError ? (
        <ErrorState
          title="Could not load VPN config"
          message={error.message}
          onRetry={() => void refetch()}
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
            <p className="vpn-settings__empty">
              You do not have a VPN assignment yet. It is created automatically when you start a
              lab.
            </p>
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
              <a
                className="btn btn--primary btn--md"
                href={data.ovpnConfigUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download OpenVPN config
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default VpnSettingsPage;
