import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /**
   * Selector or function to choose the element to focus when the trap activates.
   * Defaults to the first focusable element within the container.
   */
  initialFocus?: string | ((container: HTMLElement) => HTMLElement | null);
  /**
   * Whether to restore focus to the previously focused element on close.
   * @default true
   */
  restoreFocus?: boolean;
  /**
   * Whether to lock the body scroll while the trap is active.
   * @default true
   */
  lockScroll?: boolean;
  /**
   * Whether to call onEscape when the user presses Escape.
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Called when the user presses Escape (and closeOnEscape is true).
   */
  onEscape?: () => void;
  /**
   * Whether the trap is currently active.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Traps keyboard focus within a container element while enabled.
 *
 * Handles:
 * - Tab/Shift+Tab cycling between focusable elements
 * - Escape key (optional, calls `onEscape`)
 * - Body scroll lock (optional)
 * - Restoring focus to the previously focused element on disable/unmount
 *
 * @example
 * const containerRef = useFocusTrap<HTMLDivElement>({
 *   onEscape: closeModal,
 * });
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions = {}
): RefObject<T> {
  const {
    initialFocus,
    restoreFocus = true,
    lockScroll = true,
    closeOnEscape = true,
    onEscape,
    enabled = true,
  } = options;

  const containerRef = useRef<T>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Keep callbacks/selectors in refs so the activating effect doesn't depend on
  // their identity. Parent re-renders (e.g. a toast appearing) frequently
  // produce new function references for `onEscape`/`initialFocus`; depending on
  // them would tear the trap down and rebuild it, stealing focus mid-interaction.
  // Refs are updated in an effect (not during render) to stay lint-compliant.
  const onEscapeRef = useRef(onEscape);
  const initialFocusRef = useRef(initialFocus);
  useEffect(() => {
    onEscapeRef.current = onEscape;
    initialFocusRef.current = initialFocus;
  }, [onEscape, initialFocus]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const initialFocusSnapshot = initialFocusRef.current;

    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    let previousBodyOverflow: string | null = null;
    if (lockScroll) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const focusTimer = window.setTimeout(() => {
      let target: HTMLElement | null = null;
      if (typeof initialFocusSnapshot === 'function') {
        target = initialFocusSnapshot(container);
      } else if (typeof initialFocusSnapshot === 'string') {
        target = container.querySelector<HTMLElement>(initialFocusSnapshot);
      }
      if (!target) {
        target = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      }
      target?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.stopPropagation();
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (lockScroll && previousBodyOverflow !== null) {
        document.body.style.overflow = previousBodyOverflow;
      }
      if (restoreFocus) {
        lastFocusedRef.current?.focus();
      }
    };
  }, [restoreFocus, lockScroll, closeOnEscape, enabled]);

  return containerRef;
}
