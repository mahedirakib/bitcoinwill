import type { ChecklistItemId } from '../types';
import { CHECKLIST_ITEMS } from '../types';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const modalRef = useFocusTrap<HTMLDivElement>({
    onEscape: onClose,
    initialFocus: 'input[type="checkbox"]',
  });

  const allChecked = Object.values(checklist).every(Boolean);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-foreground/30 p-6">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-checklist-title"
        aria-describedby="download-checklist-description"
        className="panel w-full max-w-xl p-6 space-y-5 shadow-xl"
      >
        <div>
          <h3 id="download-checklist-title" className="text-base font-semibold tracking-tight">
            Confirm before download
          </h3>
          <p id="download-checklist-description" className="mt-1 text-sm text-muted-foreground">
            Confirm each safety item before downloading your recovery kit.
          </p>
        </div>

        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              htmlFor={`checklist-${item.id}`}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-white p-3 transition-colors hover:border-border-strong"
            >
              <input
                id={`checklist-${item.id}`}
                type="checkbox"
                checked={checklist[item.id]}
                onChange={() => onUpdateChecklist(item.id)}
                className="mt-0.5 h-4 w-4 accent-foreground"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{item.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChecked}
            className="btn-primary"
          >
            Confirm and download
          </button>
        </div>
      </div>
    </div>
  );
};
