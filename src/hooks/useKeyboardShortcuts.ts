import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
};

export const COMMON_SHORTCUTS = {
  SUBMIT: { key: 'Enter', ctrlKey: true, description: 'Submit form / Continue' },
  CLOSE: { key: 'Escape', description: 'Close modal / Cancel' },
  HELP: { key: '?', description: 'Show keyboard shortcuts' },
  NEXT: { key: 'ArrowRight', description: 'Next step' },
  PREV: { key: 'ArrowLeft', description: 'Previous step' },
  COPY: { key: 'c', ctrlKey: true, description: 'Copy to clipboard' },
} as const;
