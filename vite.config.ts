import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Origin (`scheme://host[:port]`) of a configured URL, or null when unset/invalid. */
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** `scheme://host` without a port (ttyd ports are dynamic, so `:*` is appended). */
function hostOriginOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return null;
  }
}

function unique(values: Array<string | null>): string {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).join(' ');
}

/**
 * Build-time Content-Security-Policy meta tag (XSS backstop: the access token is
 * memory-only and the refresh token is an httpOnly cookie, so XSS cannot read a stored
 * credential, but it could still act as the user). Origins come from the build env. The dev server is left
 * untouched because HMR needs inline scripts and eval. `frame-ancestors`
 * cannot be set from a meta tag and must be sent as a header by the host.
 */
function contentSecurityPolicy(env: Record<string, string>): Plugin {
  const apiOrigin = originOf(env.VITE_API_BASE_URL);
  const labsAssetsOrigin = originOf(env.VITE_LABS_ASSETS_URL || 'http://localhost:5050/assets');
  const slidesOrigin = originOf(env.VITE_SLIDES_ORIGIN);
  const terminalHost = hostOriginOf(env.VITE_LABS_TERMINAL_ORIGIN || 'http://localhost');
  const terminalOrigins = terminalHost ? `${terminalHost} ${terminalHost}:*` : null;

  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': "'self' https://js.stripe.com",
    // 'unsafe-inline' for styles only: React `style` attributes and chart libraries.
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src': "'self' https://fonts.gstatic.com",
    'img-src': unique(["'self'", 'data:', 'blob:', 'https:', apiOrigin]),
    'media-src': unique(["'self'", 'https:', apiOrigin]),
    'connect-src': unique(["'self'", apiOrigin, labsAssetsOrigin, slidesOrigin, 'https://api.stripe.com']),
    'frame-src': unique([
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      labsAssetsOrigin,
      slidesOrigin,
      terminalOrigins,
    ]),
    'object-src': "'none'",
    'base-uri': "'none'",
    'form-action': "'self'",
  };

  const policy = Object.entries(directives)
    .map(([name, value]) => `${name} ${value}`)
    .join('; ');

  return {
    name: 'devopsmentor-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react(), tailwindcss(), contentSecurityPolicy(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
