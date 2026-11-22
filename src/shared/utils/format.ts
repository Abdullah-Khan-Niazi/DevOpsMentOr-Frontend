// Display formatting helpers (locale aware, ASCII hyphen-minus for signs).

const numberFormatter = new Intl.NumberFormat();

export function formatNumber(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return numberFormatter.format(value);
}

/** `+25` / `-5` / `0` (ASCII hyphen-minus, grouped digits). */
export function formatSigned(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  const abs = numberFormatter.format(Math.abs(value));
  return value > 0 ? `+${abs}` : `-${abs}`;
}

export function pluralize(count: number, one: string, many: string): string {
  return `${formatNumber(count)} ${count === 1 ? one : many}`;
}

interface DurationInput {
  hours?: number;
  minutes?: number;
  seconds?: number;
}

/** Compact duration such as `1 h 20 min`, `45 min`, `30 s`. Empty string for no/zero input. */
export function formatDuration({ hours = 0, minutes = 0, seconds = 0 }: DurationInput): string {
  const total = Math.round(
    (Number.isFinite(hours) ? hours : 0) * 3600 +
      (Number.isFinite(minutes) ? minutes : 0) * 60 +
      (Number.isFinite(seconds) ? seconds : 0),
  );
  if (total <= 0) return '';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} h`);
  if (m > 0) parts.push(`${m} min`);
  if (h === 0 && m === 0 && s > 0) parts.push(`${s} s`);
  return parts.join(' ');
}

/** `mm:ss` (or `h:mm:ss` from one hour) for a countdown in seconds. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
];

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

/** `3 minutes ago`, `in 2 days`; empty string for invalid input. */
export function formatRelativeTime(
  iso: string | number | Date | null | undefined,
  now = Date.now(),
): string {
  if (iso === null || iso === undefined) return '';
  const time =
    iso instanceof Date ? iso.getTime() : typeof iso === 'number' ? iso : Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const diffSeconds = Math.round((time - now) / 1000);
  if (Math.abs(diffSeconds) < 45) return relativeFormatter.format(0, 'second');
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= size) {
      return relativeFormatter.format(Math.round(diffSeconds / size), unit);
    }
  }
  return relativeFormatter.format(diffSeconds, 'second');
}
