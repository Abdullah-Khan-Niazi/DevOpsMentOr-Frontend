// URL allowlisting for anything rendered from server data (links, images,
// iframes). Only absolute http(s) URLs, `mailto:` and app-relative paths pass.

function parse(value: string, base?: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

/** Absolute `http:`/`https:` URL, else null (rejects `javascript:`, `data:`, relative paths). */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const url = parse(trimmed);
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) return null;
  return url.toString();
}

/** Link target: http(s), `mailto:`, in-page `#anchor` or app-relative `/path`; else null. */
export function safeLinkUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('#')) return trimmed;
  // App-relative path, but not protocol-relative (`//host`) or backslash tricks.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed;
  }
  const url = parse(trimmed);
  if (!url) return null;
  if (url.protocol === 'mailto:') return trimmed;
  if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  return null;
}

/** True when `value` resolves to the current page origin. */
export function isSameOrigin(value: string | null | undefined): boolean {
  if (typeof value !== 'string' || typeof window === 'undefined') return false;
  const url = parse(value, window.location.href);
  return url !== null && url.origin === window.location.origin;
}

/**
 * In-app redirect target from a `?redirect=` / `returnTo` / `next` parameter. Only same-origin
 * absolute paths pass (`/learn?x=1`); protocol-relative (`//host`), backslash tricks, other
 * schemes and control characters return null so callers fall back to their default route.
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  // eslint-disable-next-line no-control-regex
  if (trimmed.includes('\\') || /[\u0000-\u001f\u007f]/.test(trimmed)) return null;
  const url = parse(trimmed, 'http://redirect.invalid');
  if (!url || url.origin !== 'http://redirect.invalid') return null;
  return trimmed;
}
