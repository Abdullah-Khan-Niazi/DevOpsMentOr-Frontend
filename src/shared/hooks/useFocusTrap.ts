import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.closest('[inert]') &&
      !element.hasAttribute('hidden') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      (element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement),
  );
}

interface FocusTrapOptions {
  /**
   * Element to focus on activation (a wrapper focuses its first focusable
   * descendant); defaults to the first focusable element, then the container.
   */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Return focus to the previously focused element on deactivation (default true). */
  restoreFocus?: boolean;
}

/** Keeps Tab / Shift+Tab inside `ref` while `active`, and restores focus afterwards. */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {},
): void {
  const { initialFocusRef, restoreFocus = true } = options;

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const target = initialFocusRef?.current ?? null;
    // A target that is not focusable itself (a wrapper) focuses its first focusable descendant.
    const initial =
      (target &&
        (target.hasAttribute('tabindex') || target.matches(FOCUSABLE)
          ? target
          : (getFocusableElements(target)[0] ?? null))) ??
      getFocusableElements(container)[0] ??
      container;
    if (!container.contains(document.activeElement)) {
      initial.focus({ preventScroll: true });
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (!restoreFocus || !previouslyFocused || !previouslyFocused.isConnected) return;
      // The opener may still be inert for a moment (overlay stack updates in the same commit).
      const restore = () => previouslyFocused.focus({ preventScroll: true });
      restore();
      if (document.activeElement !== previouslyFocused) {
        window.requestAnimationFrame(restore);
      }
    };
  }, [active, ref, initialFocusRef, restoreFocus]);
}
