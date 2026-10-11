/**
 * Auto-identifies and extracts an invitation token from either:
 * - A raw token string (UUID or custom slug, e.g. 'test-invite-token-cs401')
 * - A full invitation URL (e.g. 'http://localhost:5173/enroll/accept?token=...')
 * - A URL containing ?code=... or ?invite=...
 * - A path parameter like /enroll/accept/some-token
 */
export function extractInvitationToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Check if the input is a URL or has query parameters
  if (trimmed.includes('?') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? new URL(trimmed)
        : new URL(trimmed, 'https://gateway.local');
      const param =
        url.searchParams.get('token') ||
        url.searchParams.get('code') ||
        url.searchParams.get('invite');
      if (param) return param.trim();
    } catch {
      // fallback regex
    }

    const match = trimmed.match(/[?&](?:token|code|invite)=([^&#\s]+)/i);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  }

  // Check for path like /enroll/accept/some-token
  const pathMatch = trimmed.match(/\/enroll\/accept\/([^/?#\s]+)/i);
  if (pathMatch && pathMatch[1]) {
    return decodeURIComponent(pathMatch[1]).trim();
  }

  return trimmed;
}
