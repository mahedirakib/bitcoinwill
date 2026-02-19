import { useEffect, useRef } from 'react';
import type { ChecklistItemId } from '../types';
import { CHECKLIST_ITEMS } from '../types';

interface DownloadChecklistModalProps {
  checklist: Record<ChecklistItemId, boolean>;
  onUpdateChecklist: (item: ChecklistItemId) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const DownloadChecklistModal = ({
  checklist,
  onUpdateChecklist,
  onConfirm,
  onClose,
}: DownloadChecklistModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      const firstCheckbox = modalRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      firstCheckbox?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      lastFocusedRef.current?.focus();
    };
  }, [onClose]);

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-background/85 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-checklist-title"
        aria-describedby="download-checklist-description"
        className="glass max-w-2xl w-full p-8 space-y-8 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-300"
      >
        <div className="space-y-3">
          <h3 id="download-checklist-title" className="text-3xl font-black tracking-tight">
            Checklist for Success
          </h3>
          <p id="download-checklist-description" className="text-sm text-foreground/70 font-medium">
            Confirm each safety item before downloading your Recovery Kit.
          </p>
        </div>

        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              htmlFor={`checklist-${item.id}`}
              className="flex items-start gap-3 p-4 rounded-2xl border border-border bg-muted/50 hover:border-primary/20 transition-colors cursor-pointer"
            >
              <input
                id={`checklist-${item.id}`}
                type="checkbox"
                checked={checklist[item.id]}
                onChange={() => onUpdateChecklist(item.id)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="block text-xs text-foreground/60">{item.detail}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChecked}
            className="flex-1 py-4 rounded-xl text-sm font-bold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Confirm & Download
          </button>
        </div>
      </div>
    </div>
  );
};
