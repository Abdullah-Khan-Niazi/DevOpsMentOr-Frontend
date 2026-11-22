/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GITHUB_CLIENT_ID?: string;
  /** Labs engine static assets (slides/walkthroughs). Defaults to http://localhost:5050/assets. */
  readonly VITE_LABS_ASSETS_URL?: string;
  /** Origin of the R2 endpoint that serves presigned slide decks (CSP frame-src/connect-src). */
  readonly VITE_SLIDES_ORIGIN?: string;
  /**
   * Scheme + host of the Labs terminal (ttyd) host, used by the build-time CSP
   * `frame-src` (ports are dynamic). Defaults to http://localhost.
   */
  readonly VITE_LABS_TERMINAL_ORIGIN?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
