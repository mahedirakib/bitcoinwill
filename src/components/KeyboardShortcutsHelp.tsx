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
          setIsVisible(prev => !prev);
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background/90 backdrop-blur-sm">
      <div className="glass max-w-md w-full p-8 space-y-6 animate-in zoom-in-95">
        <div className="flex items-center gap-3">
          <Keyboard className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-black">Keyboard Shortcuts</h3>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground/70">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={`${shortcut.description}-${key}`}
                    className="px-2 py-1 bg-muted rounded text-xs font-mono font-bold border border-border"
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
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
};
