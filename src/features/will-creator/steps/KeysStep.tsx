import { useState } from 'react';
import { HelpCircle, Info, Shield, Users, Wallet, X } from 'lucide-react';
import type { PlanInput } from '@/lib/bitcoin/types';
import { SAMPLE_KEYS, normalizePubkeyHex } from '../safety';
import type { HardwareWalletType } from '@/lib/bitcoin/hardwareWallet';

interface KeysStepProps {
  input: PlanInput;
  errors: Record<string, string>;
  hardwareWalletConnected: HardwareWalletType | null;
  dispatch: React.Dispatch<{ type: 'UPDATE_INPUT'; payload: Partial<PlanInput> }>;
  setShowHardwareWallet: (show: boolean) => void;
  clearHardwareWalletKey: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const KeysStep = ({
  input,
  errors,
  hardwareWalletConnected,
  dispatch,
  setShowHardwareWallet,
  clearHardwareWalletKey,
  onBack,
  onNext,
}: KeysStepProps) => {
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const isSocial = input.recovery_method === 'social';
  const sampleAllowed = input.network !== 'mainnet';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">
          {isSocial ? 'Add owner public key' : 'Add public keys'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSocial
            ? 'Provide your public key. The beneficiary key will be generated for you and split into shares.'
            : 'Paste the owner and beneficiary public keys. Private keys are never collected.'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowKeyHelp((v) => !v)}
        aria-expanded={showKeyHelp}
        aria-controls="public-key-help"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground"
      >
        <HelpCircle className="h-3.5 w-3.5" /> What is a public key?
      </button>

      {showKeyHelp && (
        <div
          id="public-key-help"
          className="rounded-md border border-border bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground"
        >
          A <strong className="font-semibold text-foreground">public key</strong> can receive funds and form scripts. It is not a private key and cannot be used alone to spend money.
        </div>
      )}

      {isSocial && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
          <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p><strong className="font-semibold text-foreground">Social recovery enabled.</strong> The beneficiary key will be generated automatically and split into shares.</p>
        </div>
      )}

      {/* Owner key */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="owner-pubkey" className="field-label">Owner public key</label>
          <span className="field-hint">66 hex characters</span>
        </div>
        <input
          id="owner-pubkey"
          type="text"
          value={input.owner_pubkey}
          onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: normalizePubkeyHex(e.target.value) } })}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="owner_pubkey"
          aria-invalid={Boolean(errors.owner)}
          aria-describedby={errors.owner ? 'owner-pubkey-error' : undefined}
          className={`field-input ${errors.owner ? 'border-danger focus:border-danger' : ''}`}
          placeholder="02…"
        />
        {sampleAllowed && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: SAMPLE_KEYS.owner } })}
            className="text-xs font-medium text-foreground/60 underline-offset-4 hover:underline"
          >
            Use sample key
          </button>
        )}
        {errors.owner && <p id="owner-pubkey-error" className="text-xs text-danger">{errors.owner}</p>}
      </div>

      {/* Hardware wallet row */}
      <div className="rounded-md border border-border bg-muted/40 p-3">
        {hardwareWalletConnected ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-success" />
              <span className="font-medium capitalize">{hardwareWalletConnected} connected</span>
            </div>
            <button
              type="button"
              onClick={clearHardwareWalletKey}
              aria-label="Disconnect hardware wallet"
              className="rounded p-1 text-muted-foreground hover:bg-white hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowHardwareWallet(true)}
            className="flex w-full items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 font-medium">
              <Wallet className="h-4 w-4" /> Connect hardware wallet
            </span>
            <span className="text-xs text-muted-foreground">Ledger · Trezor</span>
          </button>
        )}
      </div>

      {/* Beneficiary key */}
      {!isSocial && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="beneficiary-pubkey" className="field-label">Beneficiary public key</label>
            <span className="field-hint">66 hex characters</span>
          </div>
          <input
            id="beneficiary-pubkey"
            type="text"
            value={input.beneficiary_pubkey}
            onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: normalizePubkeyHex(e.target.value) } })}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            name="beneficiary_pubkey"
            aria-invalid={Boolean(errors.beneficiary)}
            aria-describedby={errors.beneficiary ? 'beneficiary-pubkey-error' : undefined}
            className={`field-input ${errors.beneficiary ? 'border-danger focus:border-danger' : ''}`}
            placeholder="03…"
          />
          {sampleAllowed && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: SAMPLE_KEYS.beneficiary } })}
              className="text-xs font-medium text-foreground/60 underline-offset-4 hover:underline"
            >
              Use sample key
            </button>
          )}
          {errors.beneficiary && <p id="beneficiary-pubkey-error" className="text-xs text-danger">{errors.beneficiary}</p>}
        </div>
      )}

      {input.network === 'mainnet' && (
        <div className="flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-xs text-danger">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p>Sample keys are disabled on Mainnet for safety.</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};
