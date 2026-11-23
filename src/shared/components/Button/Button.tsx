import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Icon, type IconName } from '@/shared/components/Icon';
import { cn } from '@/shared/utils';
import { safeLinkUrl } from '@/shared/utils/safeUrl';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const SUCCESS_FLASH_MS = 1200;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Screen reader text announced while loading (the visible label stays in place). */
  loadingLabel?: string;
  /** Rising edge shows a check icon for 1.2 s, then the button reverts. */
  isSuccess?: boolean;
  /** Announced politely when `isSuccess` turns true. */
  successLabel?: string;
  withArrow?: boolean;
  /** Material symbol rendered through `Icon` (preferred over `icon`). */
  iconName?: IconName;
  /** Custom icon node (kept for existing call sites). */
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  /** Link mode: renders an anchor styled as a button. The URL is allowlisted (http(s), mailto, app paths). */
  href?: string;
  /** Link mode: open in a new tab with `rel="noopener noreferrer"`. */
  external?: boolean;
  /** Link mode: suggest a download filename (or an empty string for the server default). */
  download?: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 18 };

/** Legacy arrow glyph, rendered only for the preserved marketing site (`.site-root`). */
function SiteArrowGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="btn__arrow-svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingLabel,
  isSuccess = false,
  successLabel = 'Done',
  withArrow = false,
  iconName,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  children,
  type = 'button',
  href,
  external = false,
  download,
  ...props
}: ButtonProps) {
  const [previousSuccess, setPreviousSuccess] = useState(isSuccess);
  const [showSuccess, setShowSuccess] = useState(false);

  if (isSuccess !== previousSuccess) {
    setPreviousSuccess(isSuccess);
    if (isSuccess) setShowSuccess(true);
  }

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), SUCCESS_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const iconNode = showSuccess ? (
    <Icon name="check" size={ICON_SIZE[size]} />
  ) : iconName ? (
    <Icon name={iconName} size={ICON_SIZE[size]} />
  ) : (
    icon
  );
  const placeRight = iconPosition === 'right' && !showSuccess;

  const linkUrl = href !== undefined ? safeLinkUrl(href) : null;
  const isLink = href !== undefined && linkUrl !== null && !disabled && !isLoading;
  const Root = (isLink ? 'a' : 'button') as 'button';
  const rootProps = isLink
    ? ({
        href: linkUrl,
        download,
        ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
        ...props,
      } as unknown as ButtonHTMLAttributes<HTMLButtonElement>)
    : { type, disabled: disabled || href !== undefined || isLoading, ...props };

  const hasLoadingLabel = isLoading && Boolean(loadingLabel);

  return (
    <Root
      {...rootProps}
      className={cn(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        isLoading && 'btn--loading',
        hasLoadingLabel && 'btn--has-loading-label',
        showSuccess && 'btn--success',
        className,
      )}
      aria-busy={isLoading || undefined}
    >
      <span className="btn__content">
        {iconNode && !placeRight ? (
          <span className="btn__icon" aria-hidden="true">
            {iconNode}
          </span>
        ) : null}

        <span className="btn__label">{children}</span>

        {iconNode && placeRight ? (
          <span className="btn__icon" aria-hidden="true">
            {iconNode}
          </span>
        ) : null}

        {withArrow ? (
          <span className="btn__arrow" aria-hidden="true">
            <Icon name="arrow-right" size={14} className="btn__arrow-icon" />
            <SiteArrowGlyph />
          </span>
        ) : null}
      </span>

      {isLoading ? (
        <span className="btn__spinner-wrap" role={loadingLabel ? 'status' : undefined} aria-live={loadingLabel ? 'polite' : undefined}>
          <span className="spin-ring btn__spinner" aria-hidden="true" />
          {loadingLabel ? <span className="btn__loading-label">{loadingLabel}</span> : null}
        </span>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {showSuccess ? successLabel : ''}
      </span>
    </Root>
  );
}
