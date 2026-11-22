import { cn } from '@/shared/utils';
import { ICON_PATHS, type IconName } from './icons';
import './Icon.css';

interface IconProps {
  name: IconName;
  /**
   * Icon size expressed as px at the 16px base scale. Internally converted to
   * rem so every icon scales with the fluid root type scale (and therefore
   * with the viewport), staying proportional to surrounding rem-based content.
   */
  size?: number;
  className?: string;
  /** Use the filled variant when the symbol ships one (falls back to outlined). */
  filled?: boolean;
  /**
   * Active state: filled glyph, accent colour, heavier stroke and a soft spring
   * scale. Components that know their active item pass it (nav, tabs, tree rows,
   * toggles, pressed icon buttons).
   */
  selected?: boolean;
  /** Accessible name. Without it the icon is decorative (`aria-hidden`). */
  title?: string;
}

export function Icon({
  name,
  size = 20,
  className = '',
  filled = false,
  selected = false,
  title,
}: IconProps) {
  const rem = `${size / 16}rem`;
  const paths = ICON_PATHS[name];
  const d = (filled || selected) && paths.filled ? paths.filled : paths.outlined;

  return (
    <svg
      className={cn('icon', selected && 'icon--selected', className)}
      width={rem}
      height={rem}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}
