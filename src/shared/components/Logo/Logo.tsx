import dmIconText from '@/shared/assets/logos/dm-icon-text.svg?raw';
import dmIcon from '@/shared/assets/logos/dm-icon-only.svg?raw';
import dmText from '@/shared/assets/logos/dm-text-only.svg?raw';
import './Logo.css';

// Global brand logo lockup (migrated from the marketing site).
// White fill is recast to currentColor so the mark adapts to both themes —
// dark renders near-white, light renders near-black; the green brand hue stays fixed.
// dm-icon-text.svg is the stacked lockup (mark above wordmark) — available as
// `icon-text`; header/footer use the composed horizontal lockup (mark + wordmark)
// which reads better at nav scale.

interface LogoProps {
  variant: 'mark' | 'wordmark' | 'icon-text';
  className?: string;
}

function logoSource(variant: LogoProps['variant']): string {
  if (variant === 'mark') return dmIcon;
  if (variant === 'wordmark') return dmText;
  return dmIconText;
}

export function Logo({ variant, className = '' }: LogoProps) {
  return (
    <span
      className={`logo logo--${variant} ${className}`.trim()}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: logoSource(variant) }}
    />
  );
}

// Composed horizontal lockup — icon mark + wordmark side by side.
export function SiteLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`logo--full ${className}`.trim()}>
      <Logo variant="mark" />
      <Logo variant="wordmark" />
    </span>
  );
}
