import { AlertTriangle, ShieldCheck } from 'lucide-react';
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

const summarizePubkey = (value: string): string =>
  value ? `${value.slice(0, 8)}…${value.slice(-8)}` : 'Generated during export';

const formatRecoveryMethod = (input: PlanInput): string => {
  if (input.recovery_method !== 'social') return 'Single beneficiary key';
  if (!input.sss_config) return 'Social recovery';
  return `Social recovery (${input.sss_config.threshold}-of-${input.sss_config.total})`;
};

const Row = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="grid grid-cols-[160px_1fr] gap-4 border-t border-border py-3 first:border-t-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className={`text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</div>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="section-eyebrow pt-4 first:pt-0 pb-1">{children}</div>
);

export const ReviewStep = ({ input, errors, network, onBack, onGenerate }: ReviewStepProps) => {
  const dot =
    network === 'mainnet' ? 'bg-danger' : network === 'testnet' ? 'bg-success' : 'bg-muted-foreground';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Review and generate</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm everything below. After you generate, you will get a vault address, recovery kit, and beneficiary instructions.
        </p>
      </div>

      <div className="rounded-md border border-border bg-white px-5 py-4">
        <SectionLabel>Strategy</SectionLabel>
        <Row label="Recovery type" value="Timelock" />
        <Row
          label="Address format"
          value={input.address_type === 'p2tr' ? 'Taproot (bc1p…)' : 'P2WSH (bc1q…)'}
        />
        <Row
          label="Network"
          value={
            <span className="inline-flex items-center gap-2 capitalize">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
              {network}
            </span>
          }
        />

        <SectionLabel>Keys</SectionLabel>
        <Row label="Owner key" value={summarizePubkey(input.owner_pubkey)} mono />
        {input.owner_key_origin && (
          <Row
            label="Owner signer origin"
            value={`${input.owner_key_origin.fingerprint ? `[${input.owner_key_origin.fingerprint}]` : ''}${input.owner_key_origin.derivation_path} (${input.owner_key_origin.device})`}
            mono
          />
        )}
        <Row
          label={input.recovery_method === 'social' ? 'Beneficiary' : 'Beneficiary key'}
          value={
            input.recovery_method === 'social'
              ? formatRecoveryMethod(input)
              : summarizePubkey(input.beneficiary_pubkey)
          }
          mono={input.recovery_method !== 'social'}
        />

        <SectionLabel>Delay</SectionLabel>
        <Row
          label="Inactivity period"
          value={`${input.locktime_blocks.toLocaleString()} blocks (≈ ${calculateTime(input.locktime_blocks)})`}
        />
        <Row label="Beneficiary may claim" value="If no spend occurs within the period" />
      </div>

      <div className="flex gap-2 rounded-md border border-warning/30 bg-warning-bg p-3 text-xs text-warning">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        <p>
          After generating, download the recovery kit and store it offline. Without it, recovery is significantly harder.
        </p>
      </div>

      {input.owner_key_origin && (
        <div className="flex gap-2 rounded-md border border-warning/30 bg-warning-bg p-3 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p>
            Hardware key origin saved. Confirm the {input.owner_key_origin.device} and your signing wallet support this custom script policy before depositing funds.
          </p>
        </div>
      )}

      {network === 'mainnet' && (
        <div className="flex gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p>
            <strong className="font-semibold">CAUTION:</strong> You are creating a plan on Mainnet. This involves real Bitcoin. Verify all keys carefully.
          </p>
        </div>
      )}

      {errors.global && (
        <div role="alert" className="rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <p>Error: {errors.global}</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={onGenerate} className="btn-accent">Generate plan</button>
      </div>
    </div>
  );
};
