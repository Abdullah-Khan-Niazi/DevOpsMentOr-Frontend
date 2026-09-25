// Single light theme — Contract v8
// Dark mode purged entirely. No [data-theme=dark] variant is built or referenced.

export function initTheme(): void {
  document.documentElement.setAttribute('data-theme', 'light');
}

