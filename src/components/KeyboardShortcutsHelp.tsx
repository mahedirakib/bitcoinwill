import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'Enter'], description: 'Submit form / Continue' },
  { keys: ['Esc'], description: 'Close modal / Go back' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['←', '→'], description: 'Navigate steps' },
];

export const KeyboardShortcutsHelp = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsVisible((prev) => !prev);
        }
      }

      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/30 p-6">
      <div className="panel w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-foreground/70" />
          <h3 className="text-base font-semibold">Keyboard shortcuts</h3>
        </div>

        <div className="divide-y divide-border">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between py-2.5 first:pt-0"
            >
              <span className="text-sm text-foreground/80">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={`${shortcut.description}-${key}`}
                    className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="btn-secondary w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};
