import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, toast } from '@/shared/components';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth';
import { useOnboardingStore, getStepOrder } from '../stores/onboardingStore';
import { useOAuthComplete } from '../hooks/useOAuth';
import { AuthLayout } from '../components/AuthLayout';
import {
  AccountTypeStep,
  CredentialsStep,
  OrganizationStep,
  InvitationStep,
  VerifyEmailStep,
} from '../components/onboarding/OnboardingSteps';
import type { AccountType, LoginResponse, OAuthProvider } from '../types';
import '../styles/auth.css';

interface OAuthPending {
  pendingToken: string;
  provider: OAuthProvider;
  email: string;
  name: string;
}

interface OnboardingCopy {
  title: string;
  subtitle: string;
}

function getOnboardingCopy(
  flow: 'email' | 'oauth' | null | undefined,
  step: string,
): OnboardingCopy {
  if (flow === 'oauth') {
    switch (step) {
      case 'account-type':
        return { title: 'One last step', subtitle: 'Tell us how you will use DevOpsMentor.' };
      case 'organization':
        return {
          title: 'Name your organization',
          subtitle: 'Workspaces keep your team’s projects in one place.',
        };
      case 'invitation':
        return {
          title: 'Join your organization',
          subtitle: 'Enter the invitation code from your email.',
        };
      default:
        return { title: 'Finishing up', subtitle: 'Securing your account.' };
    }
  }

  switch (step) {
    case 'credentials':
      return { title: 'Create your account', subtitle: 'Start with your login details.' };
    case 'account-type':
      return {
        title: 'What best describes you?',
        subtitle: 'This tailors your workspace to how you work.',
      };
    case 'organization':
      return { title: 'Set up your organization', subtitle: 'Tell us a little about your team.' };
    case 'invitation':
      return {
        title: 'Join your organization',
        subtitle: 'Enter the invitation code from your email.',
      };
    default:
      return { title: 'Verify your email', subtitle: 'Enter the 6-digit code we just sent.' };
  }
}

function FinishStep({
  oauth,
  accountType,
  complete,
  reset,
  navigate,
}: {
  oauth: OAuthPending;
  accountType: AccountType | null;
  complete: ReturnType<typeof useOAuthComplete>;
  reset: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  useEffect(() => {
    const state = useOnboardingStore.getState();
    const common = { pendingToken: oauth.pendingToken, fullName: oauth.name };
    if (accountType === 'organization') {
      complete.mutate({
        ...common,
        accountType: 'organization',
        organization: state.organization!,
      });
    } else if (accountType === 'member') {
      complete.mutate({
        ...common,
        accountType: 'member',
        invitationCode: state.invitationCode!,
      });
    } else {
      complete.mutate({ ...common, accountType: 'individual' });
    }
  }, [oauth, accountType, complete]);

  return (
    <div className="flex flex-col gap-4">
      <p className="auth-status">Finishing your account…</p>
      {complete.isError ? (
        <p className="auth-alert auth-alert--error" role="alert">
          {complete.error.message}
        </p>
      ) : null}
      {complete.isError ? (
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            reset();
            void navigate(ROUTES.LOGIN, { replace: true });
          }}
        >
          Start over
        </Button>
      ) : null}
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const flow = useOnboardingStore((s) => s.flow);
  const oauth = useOnboardingStore((s) => s.oauth);
  const accountType = useOnboardingStore((s) => s.accountType);
  const step = useOnboardingStore((s) => s.step);
  const setStep = useOnboardingStore((s) => s.setStep);
  const reset = useOnboardingStore((s) => s.reset);
  const complete = useOAuthComplete();
  const [password, setPassword] = useState('');

  const order = getStepOrder(flow ?? 'email', accountType ?? 'individual');
  const currentIndex = Math.max(0, order.indexOf(step));

  if (flow !== 'oauth' && !oauth && flow !== 'email') {
    void navigate(ROUTES.LOGIN, { replace: true });
    return null;
  }

  if (step === 'verify' && !password) {
    setStep('credentials');
  }

  const goNext = () => {
    const ord = getStepOrder(flow ?? 'email', useOnboardingStore.getState().accountType);
    const index = ord.indexOf(step);
    setStep(ord[index + 1] ?? step);
  };
  const goBack = () => {
    const ord = getStepOrder(flow ?? 'email', useOnboardingStore.getState().accountType);
    const index = ord.indexOf(step);
    if (index > 0) setStep(ord[index - 1]);
  };

  const onVerified = (data: LoginResponse) => {
    useAuthStore.getState().setSession(data);
    reset();
    toast.success('Email verified. You are signed in.');
    void navigate(ROUTES.DASHBOARD, { replace: true });
  };

  const renderStep = () => {
    if (step === 'account-type') return <AccountTypeStep onNext={goNext} />;
    if (step === 'credentials')
      return (
        <CredentialsStep
          onNext={goNext}
          onBack={goBack}
          password={password}
          onPasswordChange={setPassword}
        />
      );
    if (step === 'organization') return <OrganizationStep onNext={goNext} onBack={goBack} />;
    if (step === 'invitation') return <InvitationStep onNext={goNext} onBack={goBack} />;
    if (step === 'verify')
      return (
        <VerifyEmailStep
          onVerified={onVerified}
          password={password}
          onBack={goBack}
          onNext={() => {}}
        />
      );
    if (oauth)
      return (
        <FinishStep
          oauth={oauth}
          accountType={accountType}
          complete={complete}
          reset={reset}
          navigate={navigate}
        />
      );
    return null;
  };

  return (
    <AuthLayout
      title={getOnboardingCopy(flow, step).title}
      subtitle={getOnboardingCopy(flow, step).subtitle}
    >
      <div className="auth-onboarding-body">{renderStep()}</div>

      {step !== 'finish' ? (
        <>
          {step !== 'credentials' ? (
            <button
              type="button"
              className="auth-link auth-link--end"
              onClick={() => {
                if (currentIndex > 0) {
                  goBack();
                  return;
                }
                reset();
                void navigate(ROUTES.LOGIN, { replace: true });
              }}
            >
              Back
            </button>
          ) : null}
          <p className="auth-link-row">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="auth-link">
              Sign in
            </Link>
          </p>
        </>
      ) : null}
    </AuthLayout>
  );
}
