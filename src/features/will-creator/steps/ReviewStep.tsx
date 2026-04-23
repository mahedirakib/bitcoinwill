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

const summarizePubkey = (value: string): string => (
  value ? `${value.slice(0, 8)}...${value.slice(-8)}` : 'Generated during export'
);

const formatRecoveryMethod = (input: PlanInput): string => {
  if (input.recovery_method !== 'social') return 'Single beneficiary key';
  if (!input.sss_config) return 'Social recovery';
  return `Social recovery (${input.sss_config.threshold}-of-${input.sss_config.total})`;
};

export const ReviewStep = ({ input, errors, network, onBack, onGenerate }: ReviewStepProps) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 md:space-y-10">
      <div className="space-y-3">
        <h3 className="text-3xl font-black tracking-tight">Final Review</h3>
        <p className="max-w-2xl font-medium text-foreground/58">
          Check the essential details now so the generated recovery kit matches the people and timing you expect.
        </p>
      </div>

      <div className="glass space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-foreground/55">Network</p>
            <p className="mt-2 text-3xl font-black tracking-tight">{network}</p>
          </div>
          <span className="w-fit rounded-xl bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary">
            {input.address_type === 'p2tr' ? 'Taproot' : 'P2WSH'}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 rounded-2xl border border-border bg-muted/35 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/50">Delay</p>
            <p className="text-xl font-black [font-variant-numeric:tabular-nums]">
              {input.locktime_blocks.toLocaleString()} blocks
            </p>
            <p className="text-sm text-foreground/62">Approximately {calculateTime(input.locktime_blocks)}</p>
          </div>

          <div className="space-y-1 rounded-2xl border border-border bg-muted/35 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/50">Recovery Method</p>
            <p className="text-xl font-black">{formatRecoveryMethod(input)}</p>
            <p className="text-sm text-foreground/62">
              {input.recovery_method === 'social'
                ? 'The beneficiary key is generated when you confirm and then split into recovery shares.'
                : 'A single beneficiary public key can spend after the delay passes.'}
            </p>
          </div>

          <div className="space-y-1 rounded-2xl border border-border bg-muted/35 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/50">Owner Public Key</p>
            <p className="font-mono text-sm font-semibold text-foreground/78">{summarizePubkey(input.owner_pubkey)}</p>
            <p className="text-sm text-foreground/62">This key can spend immediately.</p>
          </div>

          <div className="space-y-1 rounded-2xl border border-border bg-muted/35 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-foreground/50">
              {input.recovery_method === 'social' ? 'Beneficiary Setup' : 'Beneficiary Public Key'}
            </p>
            <p className="font-mono text-sm font-semibold text-foreground/78">
              {input.recovery_method === 'social'
                ? formatRecoveryMethod(input)
                : summarizePubkey(input.beneficiary_pubkey)}
            </p>
            <p className="text-sm text-foreground/62">
              {input.recovery_method === 'social'
                ? 'Any configured threshold of shares can reconstruct the beneficiary key later.'
                : 'This key becomes usable only after the delay passes.'}
            </p>
          </div>
        </div>
      </div>

      {network === 'mainnet' && (
        <div className="flex gap-4 rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-sm font-medium text-red-600">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <p><strong>CAUTION:</strong> You are creating a plan on Mainnet. This involves real Bitcoin. Verify all keys carefully.</p>
        </div>
      )}

      {errors.global && (
        <div role="alert" className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500 text-sm font-bold">
          <p>Error: {errors.global}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className="text-left font-bold text-foreground/60 transition-colors hover:text-foreground/80">Back</button>
        <button type="button" onClick={onGenerate} className="btn-primary w-full sm:w-auto sm:px-12">Generate Plan</button>
      </div>
    </div>
  );
};
