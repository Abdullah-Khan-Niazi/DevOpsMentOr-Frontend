import type { ButtonHTMLAttributes } from 'react';
import { Button } from '@/shared/components';

type OAuthProvider = 'google' | 'github';

const providerConfig: Record<OAuthProvider, { label: string; mark: string }> = {
  google: { label: 'Google', mark: 'G' },
  github: { label: 'GitHub', mark: 'GH' },
};

export interface OAuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: OAuthProvider;
}

// §3.3 secondary-variant button, token-driven — provider mark is a plain
// glyph, not a badge/pill component (§2.2/§8).
export function OAuthButton({ provider, className, ...props }: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <Button type="button" variant="secondary" className={`w-full ${className ?? ''}`} {...props}>
      <span className="auth-oauth__mark" aria-hidden="true">
        {config.mark}
      </span>
      Continue with {config.label}
    </Button>
  );
}
