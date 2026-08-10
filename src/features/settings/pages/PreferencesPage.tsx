import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Card, LoadingState, PageHeader, toast } from '@/shared/components';
import { useMySettings, useUpdateMySettings } from '../hooks';
import type { UserSetting } from '../types';

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  timezone: z.string().min(1, 'Timezone is required'),
  notify_email: z.enum(['true', 'false']),
});

type PreferencesValues = z.infer<typeof preferencesSchema>;

const DEFAULTS: PreferencesValues = {
  theme: 'light',
  timezone: 'UTC',
  notify_email: 'true',
};

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Cairo',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

function toForm(preferences: UserSetting[]): PreferencesValues {
  const map = new Map(preferences.map((p) => [p.settingKey, String(p.settingValue)]));
  return {
    theme: map.get('theme') === 'dark' ? 'dark' : 'light',
    timezone: map.get('timezone') || 'UTC',
    notify_email: map.get('notify_email') === 'false' ? 'false' : 'true',
  };
}

export function PreferencesPage() {
  const { data, isLoading, isError } = useMySettings();
  const { mutate, isPending } = useUpdateMySettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: DEFAULTS,
  });

  const preferences = useMemo(() => (data ?? []).filter((p) => p.settingKey in DEFAULTS), [data]);

  useEffect(() => {
    if (preferences) {
      reset(toForm(preferences));
    }
  }, [preferences, reset]);

  const onSubmit = (values: PreferencesValues) => {
    void mutate(
      {
        settings: [
          { key: 'theme', value: values.theme },
          { key: 'timezone', value: values.timezone },
          { key: 'notify_email', value: String(values.notify_email === 'true') },
        ],
      },
      {
        onSuccess: () => toast.success('Preferences saved'),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Preferences"
        description="Theme, timezone and notification defaults for your account."
      />

      {isLoading ? <LoadingState label="Loading preferences…" /> : null}
      {isError ? (
        <p className="auth-alert auth-alert--error" role="alert">
          Unable to load preferences.
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <Card className="max-w-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <fieldset>
              <legend className="input-label">Theme</legend>
              <div className="flex gap-4">
                {(['light', 'dark'] as const).map((theme) => (
                  <label key={theme} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      value={theme}
                      className="size-4 accent-brand-600"
                      {...register('theme')}
                    />
                    {theme === 'light' ? 'Light' : 'Dark'}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="pref-timezone" className="input-label">
                Timezone
              </label>
              <select id="pref-timezone" className="input-field" {...register('timezone')}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              {errors.timezone ? <p className="input-error">{errors.timezone.message}</p> : null}
            </div>

            <fieldset>
              <legend className="input-label">Email notifications</legend>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  value="true"
                  className="size-4 accent-brand-600"
                  {...register('notify_email')}
                />
                Enabled
              </label>
              <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  value="false"
                  className="size-4 accent-brand-600"
                  {...register('notify_email')}
                />
                Disabled
              </label>
            </fieldset>

            <Button type="submit" isLoading={isPending} disabled={!isDirty}>
              Save preferences
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

export default PreferencesPage;
