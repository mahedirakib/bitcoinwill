import { AlertTriangle } from 'lucide-react';
import { calculateTime } from '@/lib/bitcoin/utils';
import type { PlanInput } from '@/lib/bitcoin/types';
import { BLOCKS_PER_DAY, BLOCKS_PER_WEEK, BLOCKS_PER_MONTH, MAX_LOCKTIME_BLOCKS } from '@/lib/bitcoin/types';

interface TimelockStepProps {
  input: PlanInput;
  dispatch: React.Dispatch<{ type: 'UPDATE_INPUT'; payload: Partial<PlanInput> }>;
  onBack: () => void;
  onNext: () => void;
}

const TIMELOCK_PRESETS = [
  { label: '1 day', blocks: BLOCKS_PER_DAY },
  { label: '1 week', blocks: BLOCKS_PER_WEEK },
  { label: '1 month', blocks: BLOCKS_PER_MONTH },
  { label: '3 months', blocks: BLOCKS_PER_MONTH * 3 },
];

export const TimelockStep = ({ input, dispatch, onBack, onNext }: TimelockStepProps) => {
  const updateLocktime = (locktimeBlocks: number) => {
    const bounded = Math.min(MAX_LOCKTIME_BLOCKS, Math.max(1, locktimeBlocks));
    dispatch({ type: 'UPDATE_INPUT', payload: { locktime_blocks: bounded } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Set the delay</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how long the network should wait before the beneficiary path can be used. A block is roughly ten minutes.
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-5 space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">Network blocks</p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{input.locktime_blocks.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="section-eyebrow">Approx. delay</p>
            <p className="mt-1 text-2xl font-semibold">~{calculateTime(input.locktime_blocks)}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {TIMELOCK_PRESETS.map((preset) => {
            const selected = input.locktime_blocks === preset.blocks;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateLocktime(preset.blocks)}
                className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? 'border-foreground bg-white'
                    : 'border-border bg-white hover:border-border-strong'
                }`}
              >
                <p className="text-sm font-semibold">{preset.label}</p>
                <p className="text-xs text-muted-foreground">{preset.blocks.toLocaleString()} blocks</p>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-end">
          <div>
            <label htmlFor="timelock-range" className="sr-only">Timelock blocks</label>
            <input
              id="timelock-range"
              type="range"
              min={1}
              max={52560}
              step={1}
              value={input.locktime_blocks}
              onChange={(e) => updateLocktime(parseInt(e.target.value, 10))}
              className="w-full accent-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="timelock-exact" className="field-label">Exact blocks</label>
            <input
              id="timelock-exact"
              type="number"
              min={1}
              max={MAX_LOCKTIME_BLOCKS}
              inputMode="numeric"
              value={input.locktime_blocks}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value, 10);
                if (Number.isNaN(next)) return;
                updateLocktime(next);
              }}
              className="field-input"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground space-y-1">
        <p>• The timer resets every time you spend from the vault.</p>
        <p>• The delay starts <strong className="font-semibold text-foreground">only after</strong> the funding transaction confirms on-chain.</p>
      </div>

      {input.locktime_blocks > BLOCKS_PER_MONTH && (
        <div className="flex gap-2 rounded-md border border-warning/30 bg-warning-bg p-3 text-xs leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            You have selected a delay of approximately <strong className="font-semibold">{calculateTime(input.locktime_blocks)}</strong>.
            If you lose access to the owner key, funds stay locked for that entire period before the beneficiary can claim them.
            Most users are better served by 1 day to 1 week.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};
