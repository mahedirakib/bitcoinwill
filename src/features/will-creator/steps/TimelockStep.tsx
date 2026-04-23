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
    const boundedBlocks = Math.min(MAX_LOCKTIME_BLOCKS, Math.max(1, locktimeBlocks));
    dispatch({ type: 'UPDATE_INPUT', payload: { locktime_blocks: boundedBlocks } });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 md:space-y-10">
      <div className="space-y-3">
        <h3 className="text-3xl font-black tracking-tight">Set the Delay</h3>
        <p className="max-w-2xl font-medium text-foreground/60">
          Choose how long the network should wait before the beneficiary path can be used. Blocks are roughly ten minutes each.
        </p>
      </div>

      <div className="glass space-y-8 p-6 md:space-y-10 md:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="text-5xl font-black text-primary [font-variant-numeric:tabular-nums] md:text-6xl">{input.locktime_blocks}</span>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Network Blocks</p>
          </div>
          <div className="space-y-1 text-left sm:text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Approx. Delay</p>
            <p className="text-3xl font-black md:text-4xl">~{calculateTime(input.locktime_blocks)}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TIMELOCK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => updateLocktime(preset.blocks)}
              className={`rounded-xl border px-4 py-3 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 ${
                input.locktime_blocks === preset.blocks
                  ? 'border-primary/30 bg-primary/10'
                  : 'border-border bg-white/70 hover:border-primary/20'
              }`}
            >
              <p className="text-sm font-bold text-foreground">{preset.label}</p>
              <p className="text-xs text-foreground/55">{preset.blocks.toLocaleString()} blocks</p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div className="relative py-1">
          <label htmlFor="timelock-range" className="sr-only">
            Timelock blocks
          </label>
          <input 
            id="timelock-range"
            aria-label="Timelock blocks"
            type="range" min="1" max="52560" step="1"
            value={input.locktime_blocks}
            onChange={(e) => updateLocktime(parseInt(e.target.value, 10))}
            className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>

          <div className="space-y-2">
            <label htmlFor="timelock-exact" className="text-xs font-bold uppercase tracking-widest text-foreground/58">
              Exact Blocks
            </label>
            <input
              id="timelock-exact"
              type="number"
              min={1}
              max={MAX_LOCKTIME_BLOCKS}
              inputMode="numeric"
              value={input.locktime_blocks}
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(nextValue)) return;
                updateLocktime(nextValue);
              }}
              className="w-full rounded-2xl border border-border bg-muted px-4 py-3 font-mono text-sm transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-6 text-xs font-medium leading-relaxed text-orange-600/75">
        <p>• The timer resets every time you move the funds.</p>
        <p>• The delay starts <strong>only after</strong> the funding transaction confirms on-chain.</p>
      </div>

      {input.locktime_blocks > BLOCKS_PER_MONTH && (
        <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold">Extended Locktime Warning</span>
          </div>
          <p className="text-sm text-red-600/80 leading-relaxed">
            You have selected a locktime of approximately <strong>{calculateTime(input.locktime_blocks)}</strong>. 
            This means if you lose access to your owner key, your funds will be locked for this entire period 
            before the beneficiary can claim them. Consider a shorter locktime (1 day to 1 week) for most use cases.
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="text-left font-bold text-foreground/60 transition-colors hover:text-foreground/80">Back</button>
        <button type="button" onClick={onNext} className="btn-primary w-full sm:w-auto">Continue</button>
      </div>
    </div>
  );
};
