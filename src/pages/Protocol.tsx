import React from 'react';
import { ChevronLeft, FileCode, Shield, Zap, AlertCircle } from 'lucide-react';
import diagram from '@/assets/diagram.svg';

const Protocol = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-foreground/60 hover:text-primary transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to App
      </button>

      <header className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Protocol v1 Specification</h1>
        <p className="text-xl text-foreground/60">
          A transparent look at how Bitcoin Will works under the hood.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="text-primary w-6 h-6" /> Logic Flow
        </h2>
        <div className="glass p-8 flex justify-center bg-white/5">
          <img src={diagram} alt="Bitcoin Will Logic Diagram" className="max-w-full h-auto" />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="glass p-6 space-y-4 border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileCode className="text-primary w-5 h-5" /> The Script
          </h3>
          <pre className="bg-black/40 p-4 rounded-xl text-[10px] font-mono text-foreground/70 overflow-x-auto leading-relaxed">
{`OP_IF
  <owner_pubkey> OP_CHECKSIG
OP_ELSE
  <locktime_blocks> OP_CHECKSEQUENCEVERIFY
  OP_DROP
  <beneficiary_pubkey> OP_CHECKSIG
OP_ENDIF`}
          </pre>
          <p className="text-xs text-foreground/50 italic">
            Compatible with SegWit P2WSH (v0) outputs.
          </p>
        </section>

        <section className="glass p-6 space-y-4 border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="text-primary w-5 h-5" /> Security Model
          </h3>
          <ul className="space-y-3 text-sm text-foreground/70">
            <li>• <strong>Non-Custodial:</strong> No private keys are ever requested or generated.</li>
            <li>• <strong>Stateless:</strong> No user data is stored on any server.</li>
            <li>• <strong>Deterministic:</strong> Fixed inputs yield a fixed, auditable output.</li>
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="text-yellow-500 w-6 h-6" /> Key Limitations
        </h2>
        <div className="grid gap-4 text-sm text-foreground/70">
          <p><strong>1. No Monitoring:</strong> The app does not watch the blockchain for you. Your heir must use the Recovery Kit manually.</p>
          <p><strong>2. Not a Legal Will:</strong> This is a technical primitive. It does not replace legal inheritance laws.</p>
          <p><strong>3. Irreversibility:</strong> Bitcoin scripts are final. Test with small amounts on Testnet first.</p>
        </div>
      </section>

      <footer className="pt-8 border-t border-white/5 text-center">
        <p className="text-xs text-foreground/30">Protocol v1.0.0 • Last Updated Feb 2026</p>
      </footer>
    </div>
  );
};

export default Protocol;
