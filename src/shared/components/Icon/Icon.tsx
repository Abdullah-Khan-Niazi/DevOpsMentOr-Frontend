import { ICONS, type IconName } from './icons';

interface IconProps {
  name: IconName;
  /**
   * Icon size expressed as px at the 16px base scale. Internally converted to
   * rem so every icon scales with the fluid root type scale (and therefore
   * with the viewport), staying proportional to surrounding rem-based content.
   */
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps) {
  const rem = `${size / 16}rem`;
  return (
    <svg
      className={className}
      width={rem}
      height={rem}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
