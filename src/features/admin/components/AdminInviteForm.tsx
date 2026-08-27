import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Input } from '@/shared/components';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  fullName: z.string().min(1, 'Full name is required').max(100),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface AdminInviteFormProps {
  isPending: boolean;
  onSubmit: (values: InviteFormValues) => void;
}

export function AdminInviteForm({ isPending, onSubmit }: AdminInviteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', fullName: '' },
  });

  const submit = (values: InviteFormValues) => {
    onSubmit(values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Full name"
          type="text"
          autoComplete="off"
          placeholder="Jane Doe"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Admin email"
          type="email"
          autoComplete="off"
          placeholder="jane@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <div>
        <Button type="submit" isLoading={isPending} disabled={isPending}>
          Send invitation
        </Button>
      </div>
    </form>
  );
}
