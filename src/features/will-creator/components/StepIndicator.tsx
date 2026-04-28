import { Check } from 'lucide-react';
import type { Step } from '../types';

const STEPS: { id: Exclude<Step, 'RESULT'>; label: string }[] = [
  { id: 'TYPE', label: 'Strategy' },
  { id: 'KEYS', label: 'Keys' },
  { id: 'TIMELOCK', label: 'Delay' },
  { id: 'REVIEW', label: 'Review' },
];

export const StepIndicator = ({ current }: { current: Step }) => {
  if (current === 'RESULT') return null;
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex w-full items-center gap-0 overflow-x-auto" aria-label="Wizard progress">
      {STEPS.map((step, i) => {
        const state: 'done' | 'active' | 'todo' =
          i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'todo';
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2 min-w-0">
            <div className="flex items-center gap-2">
              <span
                aria-current={state === 'active' ? 'step' : undefined}
                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  state === 'done'
                    ? 'border-foreground bg-foreground text-white'
                    : state === 'active'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-strong bg-white text-muted-foreground'
                }`}
              >
                {state === 'done' ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-xs ${
                  state === 'todo' ? 'text-muted-foreground' : 'font-semibold text-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 ${state === 'done' ? 'bg-foreground' : 'bg-border'}`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};
