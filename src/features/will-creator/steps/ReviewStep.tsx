import { AlertTriangle } from 'lucide-react';
import { calculateTime } from '@/lib/bitcoin/utils';
import type { PlanInput } from '@/lib/bitcoin/types';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';

interface ReviewStepProps {
  input: PlanInput;
  errors: Record<string, string>;
  network: BitcoinNetwork;
  onBack: () => void;
  onGenerate: () => void;
}

export const ReviewStep = ({ input, errors, network, onBack, onGenerate }: ReviewStepProps) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h3 className="text-2xl font-bold">Final Review</h3>
      <div className="glass p-8 space-y-6">
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-60 font-bold uppercase tracking-widest">Network</span>
          <span className="font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-lg">{network}</span>
        </div>
        <div className="pt-6 border-t border-border space-y-2">
          <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Delay Settings</p>
          <p className="text-2xl font-black">{input.locktime_blocks} Blocks (~{calculateTime(input.locktime_blocks)})</p>
        </div>
      </div>

      {network === 'mainnet' && (
        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4 text-red-600 text-sm font-medium">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <p><strong>CAUTION:</strong> You are creating a plan on Mainnet. This involves real Bitcoin. Verify all keys carefully.</p>
        </div>
      )}

      {errors.global && (
        <div role="alert" className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-sm font-bold">
          <p>Error: {errors.global}</p>
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <button type="button" onClick={onBack} className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors">Back</button>
        <button type="button" onClick={onGenerate} className="btn-primary !px-16 !py-5">Generate Plan</button>
      </div>
    </div>
  );
};
