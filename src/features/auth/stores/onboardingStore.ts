import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccountType, OrganizationInput, OAuthProvider } from '../types';

export type OnboardingFlow = 'email' | 'oauth';
export type OnboardingStep =
  'account-type' | 'credentials' | 'organization' | 'invitation' | 'verify' | 'finish';

export const STEP_LABELS: Record<OnboardingStep, string> = {
  'account-type': 'Account type',
  credentials: 'Your details',
  organization: 'Organization',
  invitation: 'Invitation code',
  verify: 'Verify email',
  finish: 'Finish',
};

export function getStepOrder(
  flow: OnboardingFlow,
  accountType: AccountType | null,
): OnboardingStep[] {
  if (flow === 'oauth') {
    const steps: OnboardingStep[] = ['account-type'];
    if (accountType === 'organization') steps.push('organization');
    if (accountType === 'member') steps.push('invitation');
    steps.push('finish');
    return steps;
  }

  const steps: OnboardingStep[] = ['credentials', 'account-type'];
  if (accountType === 'organization') steps.push('organization');
  if (accountType === 'member') steps.push('invitation');
  steps.push('verify');
  return steps;
}

interface OAuthPending {
  pendingToken: string;
  provider: OAuthProvider;
  email: string;
  name: string;
}

interface OnboardingData {
  accountType: AccountType | null;
  email: string | null;
  fullName: string | null;
  username: string | null;
  organization: OrganizationInput | null;
  invitationCode: string | null;
  oauth: OAuthPending | null;
}

interface OnboardingState extends OnboardingData {
  flow: OnboardingFlow | null;
  step: OnboardingStep;
  startEmail: (data?: Partial<OnboardingData>) => void;
  startOAuth: (oauth: OAuthPending, data?: Partial<OnboardingData>) => void;
  setAccountType: (accountType: AccountType) => void;
  setOrganization: (organization: OrganizationInput) => void;
  setInvitationCode: (invitationCode: string) => void;
  setCredentials: (email: string, username: string, fullName: string) => void;
  setEmail: (email: string) => void;
  setStep: (step: OnboardingStep) => void;
  reset: () => void;
}

const EMPTY: OnboardingData = {
  accountType: null,
  email: null,
  fullName: null,
  username: null,
  organization: null,
  invitationCode: null,
  oauth: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...EMPTY,
      flow: null,
      step: 'account-type',
      startEmail: (data) => set({ ...EMPTY, ...data, flow: 'email', step: 'credentials' }),
      startOAuth: (oauth, data) =>
        set({ ...EMPTY, ...data, oauth, flow: 'oauth', step: 'account-type' }),
      setAccountType: (accountType) => set({ accountType }),
      setOrganization: (organization) => set({ organization }),
      setInvitationCode: (invitationCode) => set({ invitationCode }),
      setCredentials: (email, username, fullName) => set({ email, username, fullName }),
      setEmail: (email) => set({ email }),
      setStep: (step) => set({ step }),
      reset: () => set({ ...EMPTY, flow: null, step: 'account-type' }),
    }),
    {
      name: 'auth-onboarding',
      partialize: (state) => ({
        accountType: state.accountType,
        email: state.email,
        fullName: state.fullName,
        username: state.username,
        organization: state.organization,
        invitationCode: state.invitationCode,
        oauth: state.oauth,
        flow: state.flow,
        step: state.step,
      }),
    },
  ),
);
