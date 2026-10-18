import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button, GoogleIcon, GitHubIcon } from '@/shared/components';

type OAuthProvider = 'google' | 'github';

const providerConfig: Record<OAuthProvider, { label: string; icon: ReactNode }> = {
  google: { label: 'Google', icon: <GoogleIcon width={18} height={18} /> },
  github: { label: 'GitHub', icon: <GitHubIcon width={18} height={18} /> },
};

export interface OAuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: OAuthProvider;
}

export function OAuthButton({ provider, className, ...props }: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button
      type="button"
      variant="secondary"
      icon={config.icon}
      className={`w-full justify-center ${className ?? ''}`}
      {...props}
    >
      Continue with {config.label}
    </Button>
  );
}
