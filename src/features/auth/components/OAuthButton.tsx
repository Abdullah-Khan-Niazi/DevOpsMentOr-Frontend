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

// §3.3 secondary-variant button, token-driven — provider mark uses authentic SVG icons from project assets
export function OAuthButton({ provider, className, ...props }: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button type="button" variant="secondary" className={`w-full ${className ?? ''}`} {...props}>
      <span className="auth-oauth__mark" aria-hidden="true">
        {config.icon}
      </span>
      Continue with {config.label}
    </Button>
  );
}
