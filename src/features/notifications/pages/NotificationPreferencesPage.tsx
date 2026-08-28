import '../styles/notifications.css';
import { useMemo, useState } from 'react';
import { Button, Card, ErrorState, LoadingState, PageHeader, toast } from '@/shared/components';
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from '../hooks/useNotifications';
import type { NotificationPreferenceDto, NotificationType } from '../types';

// SCR-F8-02: per-channel preference switches for every notification type.
// Validation rule: at least one channel must stay enabled per type — the
// save is blocked client-side and the backend enforces the same rule.

const CHANNELS = ['emailEnabled', 'pushEnabled', 'inAppEnabled'] as const;
type Channel = (typeof CHANNELS)[number];

const CHANNEL_LABELS: Record<Channel, string> = {
  emailEnabled: 'Email',
  pushEnabled: 'Push',
  inAppEnabled: 'In-app',
};

function channelKey(type: NotificationType, channel: Channel): string {
  return `${type}:${channel}`;
}

export function NotificationPreferencesPage() {
  const { data, isLoading, isError } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    if (!data) return null;
    return data.map((preference) => {
      const overridden = CHANNELS.some(
        (channel) => overrides[channelKey(preference.type, channel)] !== undefined,
      );
      const valueFor = (channel: Channel) =>
        overrides[channelKey(preference.type, channel)] ?? preference[channel];
      return {
        preference,
        dirty: overridden,
        emailEnabled: valueFor('emailEnabled'),
        pushEnabled: valueFor('pushEnabled'),
        inAppEnabled: valueFor('inAppEnabled'),
      };
    });
  }, [data, overrides]);

  const toggle = (type: NotificationType, channel: Channel) => {
    setOverrides((current) => {
      const key = channelKey(type, channel);
      const base = data?.find((preference) => preference.type === type);
      const baseValue = base ? base[channel] : false;
      const currentValue = current[key] ?? baseValue;
      return { ...current, [key]: !currentValue };
    });
  };

  const saveRow = (preference: NotificationPreferenceDto) => {
    const row = rows?.find((entry) => entry.preference.type === preference.type);
    if (!row) return;
    if (!row.emailEnabled && !row.pushEnabled && !row.inAppEnabled) {
      toast.error('At least one channel must remain enabled per notification type.');
      return;
    }
    updatePreference.mutate(
      {
        type: preference.type,
        emailEnabled: row.emailEnabled,
        pushEnabled: row.pushEnabled,
        inAppEnabled: row.inAppEnabled,
      },
      {
        onSuccess: () => {
          toast.success('Preferences saved.');
          setOverrides((current) => {
            const next = { ...current };
            for (const channel of CHANNELS) {
              delete next[channelKey(preference.type, channel)];
            }
            return next;
          });
        },
        onError: () => toast.error('Could not save preferences.'),
      },
    );
  };

  if (isError) {
    return <ErrorState title="Could not load preferences" message="Please try again later." />;
  }
  if (isLoading || !rows) {
    return <LoadingState />;
  }

  return (
    <div className="preferences-page">
      <PageHeader
        title="Notification preferences"
        description="Choose which channels each notification type is delivered on."
      />

      <div className="preferences-page__list">
        {rows.map(({ preference, dirty, emailEnabled, pushEnabled, inAppEnabled }) => (
          <Card key={preference.type} className="preferences-page__row">
            <div className="preferences-page__row-head">
              <h3 className="preferences-page__type">{preference.type}</h3>
              {dirty ? <span className="preferences-page__dirty">Unsaved</span> : null}
            </div>
            <div className="preferences-page__channels">
              <label className="preferences-page__channel">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={() => toggle(preference.type, 'emailEnabled')}
                />
                <span>{CHANNEL_LABELS.emailEnabled}</span>
              </label>
              <label className="preferences-page__channel">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={() => toggle(preference.type, 'pushEnabled')}
                />
                <span>{CHANNEL_LABELS.pushEnabled}</span>
              </label>
              <label className="preferences-page__channel">
                <input
                  type="checkbox"
                  checked={inAppEnabled}
                  onChange={() => toggle(preference.type, 'inAppEnabled')}
                />
                <span>{CHANNEL_LABELS.inAppEnabled}</span>
              </label>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={!dirty}
              isLoading={updatePreference.isPending}
              onClick={() => saveRow(preference)}
            >
              Save
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default NotificationPreferencesPage;
