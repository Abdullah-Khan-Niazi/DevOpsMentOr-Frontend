import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

type OAuthProvider = 'google' | 'github' | 'linkedin';

const providerConfig: Record<OAuthProvider, { label: string; mark: string }> = {
  google: { label: 'Google', mark: 'G' },
  github: { label: 'GitHub', mark: 'GH' },
  linkedin: { label: 'LinkedIn', mark: 'in' },
};

export interface OAuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: OAuthProvider;
}

// §3.3 secondary-variant button, token-driven — provider mark is a plain
// glyph, not a badge/pill component (§2.2/§8).
export function OAuthButton({ provider, className, disabled, ...props }: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <button type="button" disabled={disabled} className={cn('auth-oauth', className)} {...props}>
      <span className="auth-oauth__mark" aria-hidden="true">
        {config.mark}
      </span>
      Continue with {config.label}
    </button>
  );
}
