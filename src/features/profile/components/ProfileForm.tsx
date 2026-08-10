import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input } from '@/shared/components';
import { toast } from '@/shared/components';
import { useCountries, useUpdateProfile } from '../hooks';
import type { PublicProfile } from '../types';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  displayName: z.string().max(40).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  occupation: z.string().max(60).optional().or(z.literal('')),
  company: z.string().max(60).optional().or(z.literal('')),
  city: z.string().max(60).optional().or(z.literal('')),
  countryId: z.string().optional(),
  website: z.union([z.url('Enter a valid URL'), z.literal('')]),
  githubUrl: z.union([z.url('Enter a valid URL'), z.literal('')]),
  linkedinUrl: z.union([z.url('Enter a valid URL'), z.literal('')]),
  twitterHandle: z.string().max(30).optional().or(z.literal('')),
  discordUsername: z.string().max(40).optional().or(z.literal('')),
  isPublic: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: number;
  initial: PublicProfile;
}

const EMPTY_FORM: ProfileFormValues = {
  fullName: '',
  displayName: '',
  bio: '',
  occupation: '',
  company: '',
  city: '',
  countryId: '',
  website: '',
  githubUrl: '',
  linkedinUrl: '',
  twitterHandle: '',
  discordUsername: '',
  isPublic: true,
};

function toFormValues(profile: PublicProfile): ProfileFormValues {
  return {
    fullName: profile.fullName ?? '',
    displayName: profile.displayName ?? '',
    bio: profile.bio ?? '',
    occupation: profile.occupation ?? '',
    company: profile.company ?? '',
    city: (profile as PublicProfile & { city?: string | null }).city ?? '',
    countryId: profile.country ? String(profile.country.countryId) : '',
    website: profile.website ?? '',
    githubUrl: profile.githubUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    twitterHandle: profile.twitterHandle ?? '',
    discordUsername: profile.discordUsername ?? '',
    isPublic: profile.isPublic,
  };
}

export function ProfileForm({ userId, initial }: ProfileFormProps) {
  const { mutate, isPending } = useUpdateProfile();
  const { data: countries } = useCountries();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, reset]);

  const countryOptions = useMemo(
    () => [...(countries ?? [])].sort((a, b) => a.countryName.localeCompare(b.countryName)),
    [countries],
  );

  const onSubmit = (values: ProfileFormValues) => {
    void mutate(
      {
        fullName: values.fullName,
        displayName: values.displayName || null,
        bio: values.bio || null,
        occupation: values.occupation || null,
        company: values.company || null,
        city: values.city || null,
        countryId: values.countryId ? Number(values.countryId) : null,
        website: values.website || null,
        githubUrl: values.githubUrl || null,
        linkedinUrl: values.linkedinUrl || null,
        twitterHandle: values.twitterHandle || null,
        discordUsername: values.discordUsername || null,
        isPublic: values.isPublic,
      },
      {
        onSuccess: () => toast.success('Profile saved'),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
        <Input
          label="Display name"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
      </div>

      <div>
        <label htmlFor="bio" className="input-label">
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          className="input-field resize-y"
          aria-invalid={Boolean(errors.bio)}
          {...register('bio')}
        />
        {errors.bio ? (
          <p id="bio-error" className="input-error">
            {errors.bio.message}
          </p>
        ) : (
          <p id="bio-hint" className="input-hint">
            Short introduction (max 500 characters)
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Occupation" error={errors.occupation?.message} {...register('occupation')} />
        <Input label="Company" error={errors.company?.message} {...register('company')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input label="City" error={errors.city?.message} {...register('city')} />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Country</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            {...register('countryId')}
          >
            <option value="">Select a country</option>
            {countryOptions.map((c) => (
              <option key={c.countryId} value={c.countryId}>
                {c.flagEmoji ? `${c.flagEmoji} ` : ''}
                {c.countryName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Website"
          type="url"
          error={errors.website?.message}
          {...register('website')}
        />
        <Input
          label="GitHub URL"
          type="url"
          error={errors.githubUrl?.message}
          {...register('githubUrl')}
        />
        <Input
          label="LinkedIn URL"
          type="url"
          error={errors.linkedinUrl?.message}
          {...register('linkedinUrl')}
        />
        <Input
          label="Twitter handle"
          error={errors.twitterHandle?.message}
          {...register('twitterHandle')}
        />
      </div>

      <Input
        label="Discord username"
        error={errors.discordUsername?.message}
        {...register('discordUsername')}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="size-4 rounded border-border" {...register('isPublic')} />
        Make my profile public
      </label>

      <Button type="submit" isLoading={isPending} disabled={!isDirty || userId === 0}>
        Save profile
      </Button>
    </form>
  );
}

export default ProfileForm;
