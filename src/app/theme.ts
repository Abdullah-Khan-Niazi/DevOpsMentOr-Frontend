// §1.2 Theme resolution — reads prefers-color-scheme on load, re-evaluates on
// live OS theme change without a page reload. Sets [data-theme] on :root.
// There is no per-page override and no third "auto-per-section" state.

export function initTheme(): void {
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(): void {
    document.documentElement.setAttribute('data-theme', darkQuery.matches ? 'dark' : 'light');
  }

  applyTheme();
  darkQuery.addEventListener('change', applyTheme);
}
