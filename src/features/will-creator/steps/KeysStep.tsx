import { useState } from 'react';
import { HelpCircle, Shield, Wallet, X, Users } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PlanInput } from '@/lib/bitcoin/types';
import { SAMPLE_KEYS, normalizePubkeyHex } from '../safety';
import type { HardwareWalletType } from '@/lib/bitcoin/hardwareWallet';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-3">
        <h3 className="text-2xl font-bold">
          {input.recovery_method === 'social' ? 'Owner Identification' : 'Identify the players'}
        </h3>
        <p className="text-foreground/50 font-medium">
          {input.recovery_method === 'social' 
            ? 'Provide your public key. The beneficiary key will be generated automatically for social recovery.' 
            : 'Provide the 66-character compressed public keys.'}
        </p>
      </div>

      <button 
        type="button"
        onClick={() => setShowKeyHelp(!showKeyHelp)}
        aria-expanded={showKeyHelp}
        aria-controls="public-key-help"
        className="flex items-center gap-2 text-primary text-sm font-bold hover:opacity-80 transition-opacity"
      >
        <HelpCircle className="w-4 h-4" /> What is a Public Key?
      </button>

      {showKeyHelp && (
        <div id="public-key-help" className="p-6 bg-muted rounded-2xl text-sm text-foreground/60 border border-border space-y-3 font-medium leading-relaxed animate-in fade-in zoom-in-95">
          <p>A <strong>Public Key</strong> allows you to receive funds and create scripts. It is <strong>NOT</strong> a private key and cannot be used alone to spend your money.</p>
        </div>
      )}

      {input.recovery_method === 'social' && (
        <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-sm text-orange-600/80">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" />
            <span className="font-bold">Social Recovery Enabled</span>
          </div>
          <p>The beneficiary's key will be automatically generated and split into shares for distribution.</p>
        </div>
      )}

      <div className="space-y-10">
        <div className="space-y-3">
          <label htmlFor="owner-pubkey" className="text-sm font-bold tracking-tight flex justify-between">
            Owner Public Key
            {input.network !== 'mainnet' ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: SAMPLE_KEYS.owner }})}
                className="text-[10px] text-primary hover:underline uppercase tracking-widest font-black"
              >
                Use Sample
              </button>
            ) : (
              <span className="text-[10px] uppercase tracking-widest font-black text-red-500/70">Sample Disabled</span>
            )}
          </label>
          <input 
            id="owner-pubkey"
            type="text" 
            value={input.owner_pubkey}
            onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { owner_pubkey: normalizePubkeyHex(e.target.value) }})}
            aria-invalid={Boolean(errors.owner)}
            aria-describedby={errors.owner ? 'owner-pubkey-error' : undefined}
            className={cn("w-full bg-muted border p-5 rounded-2xl font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20", errors.owner ? "border-red-500/50 shadow-sm" : "border-border hover:border-primary/20 focus:border-primary/50")}
            placeholder="02..."
          />
          
          <div className="flex items-center justify-between pt-2">
            {hardwareWalletConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  {hardwareWalletConnected.charAt(0).toUpperCase() + hardwareWalletConnected.slice(1)} Connected
                </div>
                <button
                  type="button"
                  onClick={clearHardwareWalletKey}
                  className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Clear key"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHardwareWallet(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Hardware Wallet
              </button>
            )}
            
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-foreground/40">
              <Shield className="w-3 h-3" />
              <span>Hardware wallets are the gold standard</span>
            </div>
          </div>
          
          {errors.owner && <p id="owner-pubkey-error" className="text-xs text-red-500 font-bold">{errors.owner}</p>}
        </div>

        {input.recovery_method !== 'social' && (
          <div className="space-y-3">
            <label htmlFor="beneficiary-pubkey" className="text-sm font-bold tracking-tight flex justify-between">
              Beneficiary Public Key
              {input.network !== 'mainnet' ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: SAMPLE_KEYS.beneficiary }})}
                  className="text-[10px] text-primary hover:underline uppercase tracking-widest font-black"
                >
                  Use Sample
                </button>
              ) : (
                <span className="text-[10px] uppercase tracking-widest font-black text-red-500/70">Sample Disabled</span>
              )}
            </label>
            <input 
              id="beneficiary-pubkey"
              type="text" 
              value={input.beneficiary_pubkey}
              onChange={(e) => dispatch({ type: 'UPDATE_INPUT', payload: { beneficiary_pubkey: normalizePubkeyHex(e.target.value) }})}
              aria-invalid={Boolean(errors.beneficiary)}
              aria-describedby={errors.beneficiary ? 'beneficiary-pubkey-error' : undefined}
              className={cn("w-full bg-muted border p-5 rounded-2xl font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20", errors.beneficiary ? "border-red-500/50 shadow-sm" : "border-border hover:border-primary/20 focus:border-primary/50")}
              placeholder="03..."
            />
            {errors.beneficiary && <p id="beneficiary-pubkey-error" className="text-xs text-red-500 font-bold">{errors.beneficiary}</p>}
          </div>
        )}
      </div>

      {input.network === 'mainnet' && (
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs text-red-600/80 font-semibold">
          Sample keys are disabled on Mainnet for safety.
        </div>
      )}

      <div className="flex justify-between items-center pt-6">
        <button type="button" onClick={onBack} className="text-foreground/60 font-bold hover:text-foreground/80 transition-colors">Back</button>
        <button type="button" onClick={onNext} className="btn-primary">Continue</button>
      </div>
    </div>
  );
};
