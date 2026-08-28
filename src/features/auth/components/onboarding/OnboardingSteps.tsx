import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input, PasswordInput, toast } from '@/shared/components';
import type { ApiError } from '@/shared/types';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useOAuthLogin } from '../../hooks/useOAuth';
import { useVerifyEmail, useResendVerification } from '../../hooks/useVerifyEmail';
import { authService } from '../../services';
import { OAuthButton } from '../OAuthButton';
import { OtpInputGroup } from '../OtpInputGroup';
import type {
  AccountType,
  LoginResponse,
  MessageResponse,
  OrganizationInput,
  SignupCredentials,
} from '../../types';

// Must match backend env.OTP_TTL_MINUTES (currently 2 minutes).
const OTP_TTL_SECONDS = 120;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onDone?: () => void;
  onVerified?: (data: LoginResponse) => void;
  password?: string;
  onPasswordChange?: (value: string) => void;
}

export function AccountTypeStep({ onNext }: StepProps) {
  const setAccountType = useOnboardingStore((s) => s.setAccountType);
  const [value, setValue] = useState<AccountType>('individual');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const options: Array<{ value: AccountType; label: string; desc: string }> = [
    {
      value: 'individual',
      label: 'Individual',
      desc: 'Learn on your own with free individual access.',
    },
    {
      value: 'organization',
      label: 'Organization',
      desc: 'Create a workspace and invite your team.',
    },
    {
      value: 'member',
      label: 'Student / Instructor',
      desc: 'You are part of an organization: join with an invitation code.',
    },
  ];

  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const choose = (next: AccountType) => {
    setValue(next);
    setAccountType(next);
    setOpen(false);
  };

  const submit = () => {
    setAccountType(value);
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="auth-field">
        <label className="auth-label" htmlFor="account-type">
          What defines you best?
        </label>
        <div className="auth-select-wrap" ref={wrapRef}>
          <button
            id="account-type"
            type="button"
            className="auth-select-trigger"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((state) => !state)}
          >
            <span className="auth-select-trigger__value">{selected.label}</span>
            <span
              className={`auth-select-trigger__chevron${open ? ' is-open' : ''}`}
              aria-hidden="true"
            />
          </button>
          {open ? (
            <ul className="auth-select-menu" role="listbox" aria-label="What defines you best">
              {options.map((option) => (
                <li key={option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    className={`auth-select-option${option.value === value ? ' is-selected' : ''}`}
                    onClick={() => choose(option.value)}
                  >
                    <span className="auth-select-option__label">{option.label}</span>
                    <span className="auth-select-option__desc">{option.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="auth-select__hint">{selected.desc}</p>
      </div>

      <Button type="button" className="w-full" onClick={submit}>
        Continue
      </Button>
    </div>
  );
}

export function CredentialsStep({ onNext, password = '', onPasswordChange }: StepProps) {
  const email0 = useOnboardingStore((s) => s.email);
  const username0 = useOnboardingStore((s) => s.username);
  const fullName0 = useOnboardingStore((s) => s.fullName);
  const flow = useOnboardingStore((s) => s.flow);
  const setCredentials = useOnboardingStore((s) => s.setCredentials);
  const { initiateOAuth, feedback } = useOAuthLogin();
  const [username, setUsername] = useState(username0 ?? '');
  const [fullName, setFullName] = useState(fullName0 ?? '');
  const [email, setEmail] = useState(email0 ?? '');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (username.trim().length < 3) next.username = 'Username must be at least 3 characters.';
    if (fullName.trim().length < 2) next.fullName = 'Full name is required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setCredentials(email.trim(), username.trim(), fullName.trim());
    onNext();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Username"
          placeholder="johndoe"
          value={username}
          error={errors.username}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
        />
        <Input
          label="Full name"
          placeholder="John Doe"
          value={fullName}
          error={errors.fullName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setFullName(event.target.value)}
        />
      </div>
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={email}
        error={errors.email}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <PasswordInput
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          error={errors.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onPasswordChange?.(event.target.value)
          }
        />
        <PasswordInput
          label="Confirm password"
          placeholder="Re-enter password"
          value={confirm}
          error={errors.confirm}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirm(event.target.value)}
        />
      </div>

      <Button type="button" className="w-full" onClick={submit}>
        Continue
      </Button>

      {flow === 'email' ? (
        <>
          <div className="auth-divider" aria-hidden="true">
            <span className="auth-divider__label">or continue with</span>
          </div>
          <div className="flex flex-col gap-3">
            <OAuthButton provider="google" onClick={() => initiateOAuth('google')} />
            <OAuthButton provider="github" onClick={() => initiateOAuth('github')} />
          </div>
        </>
      ) : null}

      {feedback ? (
        <p className="auth-alert" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

export function OrganizationStep({ onNext }: StepProps) {
  const setOrganization = useOnboardingStore((s) => s.setOrganization);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [billing, setBilling] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Organization name is required.';
    if (!SLUG_PATTERN.test(slug.trim())) next.slug = 'Use lowercase letters, numbers and hyphens.';
    if (website.trim() && !/^https?:\/\/.+/.test(website.trim()))
      next.website = 'Enter a valid URL.';
    if (billing.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(billing.trim()))
      next.billing = 'Enter a valid email.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const organization: OrganizationInput = {
      name: name.trim(),
      slug: slug.trim(),
      website: website.trim() || undefined,
      industry: industry.trim() || undefined,
      billingEmail: billing.trim() || undefined,
    };
    setOrganization(organization);
    onNext();
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Organization name"
        placeholder="Acme University"
        value={name}
        error={errors.name}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setName(event.target.value);
          if (!slugTouched) setSlug(slugify(event.target.value));
        }}
      />
      <Input
        label="Slug"
        placeholder="acme-university"
        value={slug}
        error={errors.slug}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setSlugTouched(true);
          setSlug(event.target.value);
        }}
      />
      <p className="auth-account-slug-preview">
        Workspace URL: app.devopsmentor.io/org/{slug || 'your-organization'}
      </p>
      <Input
        label="Website"
        placeholder="https://acme.edu"
        value={website}
        error={errors.website}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setWebsite(event.target.value)}
      />
      <Input
        label="Industry"
        placeholder="Education"
        value={industry}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setIndustry(event.target.value)}
      />
      <Input
        label="Billing email"
        placeholder="billing@acme.edu"
        value={billing}
        error={errors.billing}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setBilling(event.target.value)}
      />

      <Button type="button" className="w-full" onClick={submit}>
        Continue
      </Button>
    </div>
  );
}

export function InvitationStep({ onNext }: StepProps) {
  const setInvitationCode = useOnboardingStore((s) => s.setInvitationCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (code.trim().length < 1) {
      setError('Invitation code is required.');
      return;
    }
    setInvitationCode(code.trim());
    onNext();
  };

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Invitation code"
        placeholder="Paste the code from your invitation email"
        value={code}
        error={error ?? undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value)}
      />
      <p className="auth-account-slug-preview">
        The invitation must match the email you use to sign up.
      </p>

      <Button type="button" className="w-full" onClick={submit}>
        Continue
      </Button>
    </div>
  );
}

export function VerifyEmailStep({ onVerified, password = '' }: StepProps) {
  const email = useOnboardingStore((s) => s.email) ?? '';
  const username = useOnboardingStore((s) => s.username) ?? '';
  const fullName = useOnboardingStore((s) => s.fullName) ?? '';
  const accountType = useOnboardingStore((s) => s.accountType) ?? 'individual';
  const organization = useOnboardingStore((s) => s.organization);
  const invitationCode = useOnboardingStore((s) => s.invitationCode);
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState<number>(() => Date.now() + OTP_TTL_SECONDS * 1000);
  const [remaining, setRemaining] = useState(OTP_TTL_SECONDS);
  const started = useRef(false);

  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const signup = useMutation<MessageResponse, ApiError, SignupCredentials>({
    mutationFn: (credentials) => authService.signup(credentials),
    onSuccess: () => {
      setInfo(null);
      setExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
    },
    onError: () => {
      // Account may already exist (e.g. the user went back). Deliver a fresh code.
      resend.mutate(
        { email },
        { onSuccess: () => setInfo(null), onError: (err) => setInfo(err.message) },
      );
    },
  });

  useEffect(() => {
    if (started.current || !email || !password) return;
    started.current = true;
    signup.mutate({
      username,
      email,
      password,
      fullName,
      accountType,
      organization: organization ?? undefined,
      invitationCode: invitationCode ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tick = () => {
      setRemaining(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submitCode = () => {
    if (code.length < 6) return;
    verify.mutate(
      { email, code },
      {
        onSuccess: (data) => onVerified?.(data),
        onError: (err) => setInfo(err.message),
      },
    );
  };

  const resendCode = () => {
    if (cooldown > 0) return;
    resend.mutate(
      { email },
      {
        onSuccess: () => {
          setCooldown(30);
          setExpiresAt(Date.now() + OTP_TTL_SECONDS * 1000);
          toast.success('Verification code sent.');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const clock = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-4">
      {signup.isPending ? (
        <p className="auth-status">Creating your account…</p>
      ) : null}
      {info ? (
        <p className="auth-alert auth-alert--error" role="alert">
          {info}
        </p>
      ) : null}
      <p className="auth-account-slug-preview">
        We sent a 6-digit code to {email || 'your email'}.
      </p>
      <OtpInputGroup value={code} onChange={setCode} autoFocus />
      <p className="auth-otp-timer" role="status">
        {remaining > 0
          ? `This code expires in ${clock}.`
          : 'This code has expired. Request a new one below.'}
      </p>
      <Button
        type="button"
        className="w-full"
        isLoading={verify.isPending}
        disabled={code.length < 6}
        onClick={submitCode}
      >
        Verify email
      </Button>
      <button
        type="button"
        className="auth-link auth-link--end"
        onClick={resendCode}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
      </button>
    </div>
  );
}
