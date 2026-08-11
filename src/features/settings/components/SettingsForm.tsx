import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input } from '@/shared/components';
import { useUpdateSettings } from '../hooks';
import type { AppSettings } from '../types';

const settingsSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  supportEmail: z.email('Enter a valid support email'),
  timezone: z.string().min(1, 'Timezone is required'),
  notificationsEnabled: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: AppSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const { mutate, isPending, isError, error, isSuccess } = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = (values: SettingsFormValues) => {
    mutate(values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-6"
      noValidate
    >
      <Input
        label="Organization name"
        error={errors.organizationName?.message}
        {...register('organizationName')}
      />
      <Input
        label="Support email"
        type="email"
        error={errors.supportEmail?.message}
        {...register('supportEmail')}
      />
      <Input label="Timezone" error={errors.timezone?.message} {...register('timezone')} />

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border-border"
          {...register('notificationsEnabled')}
        />
        Enable email notifications
      </label>

      {isError ? (
        <p className="text-sm text-danger" role="alert">
          {error.message}
        </p>
      ) : null}

      {isSuccess ? <p className="text-sm text-success">Settings saved successfully.</p> : null}

      <Button type="submit" isLoading={isPending} disabled={!isDirty}>
        Save changes
      </Button>
    </form>
  );
}
