import { calculateTime } from '@/lib/bitcoin/utils';
import type { PlanInput } from '@/lib/bitcoin/types';

interface TimelockStepProps {
  input: PlanInput;
  dispatch: React.Dispatch<{ type: 'UPDATE_INPUT'; payload: Partial<PlanInput> }>;
  onBack: () => void;
  onNext: () => void;
}

export const TimelockStep = ({ input, dispatch, onBack, onNext }: TimelockStepProps) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-3">
        <h3 className="text-2xl font-bold">Set the Delay</h3>
        <p className="text-foreground/60 font-medium">How long should the network wait before allowing your heir to claim funds?</p>
      </div>

      <div className="glass p-12 space-y-12">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-6xl font-black text-primary">{input.locktime_blocks}</span>
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Network Blocks</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/60">Approx. Delay</p>
            <p className="text-4xl font-black">~{calculateTime(input.locktime_blocks)}</p>
          </div>
        </div>

        <div className="relative py-4">
          <label htmlFor="timelock-range" className="sr-only">
            Timelock blocks
          </label>
          <input 
            id="timelock-range"
            aria-label="Timelock blocks"
            type="range" min="1" max="52560" step="1"
            value={input.locktime_blocks}
            onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { locktime_blocks: parseInt(e.target.value) }})}
            className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-xs text-orange-600/70 space-y-3 font-medium leading-relaxed">
        <p>• The timer resets every time you move the funds.</p>
        <p>• The delay starts <strong>only after</strong> the funding transaction confirms on-chain.</p>
      </div>

      <div className="flex justify-between items-center pt-6">
        <button type="button" onClick={onBack} className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors">Back</button>
        <button type="button" onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};
