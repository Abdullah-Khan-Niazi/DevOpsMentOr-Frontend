import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

type OAuthProvider = 'google' | 'github' | 'linkedin';

const providerConfig: Record<
  OAuthProvider,
  { label: string; bg: string; hover: string; text: string; icon: string }
> = {
  google: {
    label: 'Google',
    bg: 'bg-chalk-white',
    hover: 'hover:bg-chalk-white-200',
    text: 'text-deep-onyx',
    icon: 'G',
  },
  github: {
    label: 'GitHub',
    bg: 'bg-deep-onyx',
    hover: 'hover:bg-deep-onyx-800',
    text: 'text-chalk-white',
    icon: 'GH',
  },
  linkedin: {
    label: 'LinkedIn',
    bg: 'bg-[#0a66c2]',
    hover: 'hover:bg-[#004182]',
    text: 'text-white',
    icon: 'in',
  },
};

export interface OAuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: OAuthProvider;
}

export function OAuthButton({ provider, className, disabled, ...props }: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spring-green focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        config.bg,
        config.hover,
        config.text,
        className,
      )}
      {...props}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-current/10 text-[10px] font-bold leading-none">
        {config.icon}
      </span>
      {config.label}
    </button>
  );
}
