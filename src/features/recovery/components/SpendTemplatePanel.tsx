import { useMemo, useState } from 'react';
import { FileCode2, Download, AlertTriangle } from 'lucide-react';
import { buildSpendTemplate, type SpendPath, type SpendTemplateResult } from '@/lib/bitcoin/spendTemplate';
import { downloadTxt } from '@/lib/utils/download';
import { CopyButton } from '@/components/CopyButton';
import { useToast } from '@/components/Toast';
import type { SpendTemplatePanelProps } from '../types';
import type { BitcoinNetwork } from '@/lib/bitcoin/types';

const PATH_OPTIONS: Array<{ value: SpendPath; label: string; help: string }> = [
  {
    value: 'owner',
    label: 'Owner spend',
    help: 'Immediate owner path. Sign with the owner key in an external wallet.',
  },
  {
    value: 'beneficiary',
    label: 'Beneficiary claim',
    help: 'CSV path after the relative delay. nSequence is set automatically.',
  },
  {
    value: 'checkin',
    label: 'Owner check-in',
    help: 'Spend selected UTXOs back to the vault address to reset CSV timers.',
  },
];

export const SpendTemplatePanel = ({
  model,
  plan,
  result,
  vaultStatus,
}: SpendTemplatePanelProps) => {
  const { showToast } = useToast();
  const [path, setPath] = useState<SpendPath>('owner');
  const [destination, setDestination] = useState('');
  const [feeRate, setFeeRate] = useState('5');
  const [template, setTemplate] = useState<SpendTemplateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmedUtxos = useMemo(
    () => (vaultStatus?.utxos ?? []).filter((u) => u.confirmed && u.valueSats > 0),
    [vaultStatus],
  );

  const handleBuild = () => {
    setError(null);
    setTemplate(null);
    const feeRateSatsPerVbyte = Number(feeRate);
    try {
      const built = buildSpendTemplate({
        network: model.network.toLowerCase() as BitcoinNetwork,
        plan,
        result,
        utxos: vaultStatus?.utxos ?? [],
        destinationAddress: path === 'checkin' ? undefined : destination,
        feeRateSatsPerVbyte,
        path,
      });
      setTemplate(built);
      showToast('Unsigned PSBT ready');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied`);
      return true;
    } catch {
      showToast(`Could not copy ${label}`, 'error');
      return false;
    }
  };

  const handleDownload = () => {
    if (!template) return;
    downloadTxt(
      `vault-spend-${path}-${model.address.slice(0, 8)}.psbt`,
      template.psbtBase64,
    );
    showToast('PSBT downloaded');
  };

  return (
    <section className="space-y-4 print:hidden">
      <h2 className="flex items-center gap-2 border-b border-border pb-2 text-base font-semibold">
        <FileCode2 className="h-4 w-4 text-foreground/70" /> Unsigned spend template (PSBT)
      </h2>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Build an unsigned PSBT from live UTXOs. Sign in Sparrow or another wallet, then paste the
        signed hex into Broadcast below. Private keys never enter this step.
      </p>

      {confirmedUtxos.length === 0 ? (
        <div className="rounded-md border border-warning/30 bg-warning-bg p-3 text-sm text-warning">
          Refresh vault status first. Confirmed UTXOs are required to build a spend template.
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Using {confirmedUtxos.length} confirmed UTXO
          {confirmedUtxos.length === 1 ? '' : 's'} (
          {confirmedUtxos.reduce((s, u) => s + u.valueSats, 0).toLocaleString()} sats).
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="spend-path" className="field-label">
          Spend path
        </label>
        <select
          id="spend-path"
          value={path}
          onChange={(e) => {
            setPath(e.target.value as SpendPath);
            setTemplate(null);
            setError(null);
          }}
          className="field-input"
        >
          {PATH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {PATH_OPTIONS.find((o) => o.value === path)?.help}
        </p>
      </div>

      {path !== 'checkin' && (
        <div className="space-y-1.5">
          <label htmlFor="spend-destination" className="field-label">
            Destination address
          </label>
          <input
            id="spend-destination"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={model.network.toLowerCase() === 'mainnet' ? 'bc1…' : 'tb1…'}
            className="field-input font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="spend-fee-rate" className="field-label">
          Fee rate (sat/vB)
        </label>
        <input
          id="spend-fee-rate"
          type="number"
          min={1}
          max={500}
          step={1}
          value={feeRate}
          onChange={(e) => setFeeRate(e.target.value)}
          className="field-input w-32"
        />
      </div>

      <button
        type="button"
        onClick={handleBuild}
        disabled={confirmedUtxos.length === 0}
        className="btn-secondary"
      >
        <FileCode2 className="h-4 w-4" /> Build unsigned PSBT
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {template && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Inputs</span>
              <div className="font-mono text-foreground">{template.inputCount}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Est. vsize</span>
              <div className="font-mono text-foreground">{template.estimatedVsize} vB</div>
            </div>
            <div>
              <span className="text-muted-foreground">Fee</span>
              <div className="font-mono text-foreground">{template.feeSats.toLocaleString()} sats</div>
            </div>
            <div>
              <span className="text-muted-foreground">Output</span>
              <div className="font-mono text-foreground">{template.outputSats.toLocaleString()} sats</div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">PSBT (base64)</span>
              <div className="flex items-center gap-1">
                <CopyButton
                  text={template.psbtBase64}
                  label="PSBT"
                  onCopy={handleCopy}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                />
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Download PSBT"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={template.psbtBase64}
              className="field-input h-28 resize-none font-mono text-[11px]"
            />
          </div>

          <ul className="space-y-1 text-xs text-muted-foreground">
            {template.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
