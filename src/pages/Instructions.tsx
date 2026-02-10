import { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  ChevronLeft, 
  AlertTriangle, 
  Info, 
  FileText,
  Copy,
  Check,
  History
} from 'lucide-react';
import {
  InstructionModel,
  buildInstructions,
  generateInstructionTxt,
  validateAndNormalizeRecoveryKit,
} from '@/lib/bitcoin/instructions';
import { downloadTxt } from '@/lib/utils/download';
import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';
import logo from '@/assets/logo.png';
import { useToast } from '@/components/Toast';

interface InstructionsProps {
  initialData?: {
    plan: PlanInput;
    result: PlanOutput;
    created_at?: string;
  };
  onBack: () => void;
}

const Instructions = ({ initialData, onBack }: InstructionsProps) => {
  const [model, setModel] = useState<InstructionModel | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData?.plan && initialData?.result) {
      try {
        const normalized = validateAndNormalizeRecoveryKit(initialData);
        const m = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
        setModel(m);
      } catch (error) {
        showToast((error as Error).message || 'Invalid Recovery Kit');
      }
    }
  }, [initialData, showToast]);

  const handleJsonUpload = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = validateAndNormalizeRecoveryKit(parsed);
      const m = buildInstructions(normalized.plan, normalized.result, normalized.created_at);
      setModel(m);
      showToast("Instructions Loaded Successfully");
    } catch (error) {
      const message = (error as Error).message;
      showToast(message || "Error parsing JSON");
    }
  };

  if (!model) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 space-y-8 animate-in fade-in">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-foreground/60 hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-primary/20 mx-auto" />
          <h1 className="text-3xl font-bold">View Beneficiary Instructions</h1>
          <p className="text-foreground/70">Paste your Recovery Kit JSON below to view the claim instructions.</p>
        </div>
        <label htmlFor="recovery-kit-json" className="sr-only">Recovery kit JSON</label>
        <textarea
          id="recovery-kit-json"
          className="w-full h-48 bg-muted border border-border rounded-xl p-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder='{"version": "0.1.0", "plan": {...}, "result": {...}}'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <button 
          type="button"
          onClick={handleJsonUpload}
          className="btn-primary w-full"
        >
          Load Instructions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col gap-4 items-start sm:flex-row sm:justify-between sm:items-center print:hidden">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-semibold">
          <ChevronLeft className="w-4 h-4" /> Back to App
        </button>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
          <button 
            type="button"
            onClick={() => downloadTxt('beneficiary-instructions.txt', generateInstructionTxt(model))}
            className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-lg text-sm font-bold hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" /> Download TXT
          </button>
          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      <article className="space-y-12 print:text-black print:space-y-8 bg-white p-8 md:p-12 rounded-3xl border border-border shadow-sm print:border-none print:shadow-none print:p-0">
        <header className="space-y-4 text-center flex flex-col items-center">
          <img src={logo} alt="Bitcoin Will Logo" className="w-20 h-20 object-contain mb-2" />
          <h1 className="text-4xl font-black tracking-tight">Beneficiary Instructions</h1>
          <p className="text-foreground/60 print:text-gray-500 uppercase tracking-widest text-[10px] font-bold">
            Bitcoin Will • Non-Custodial Inheritance Vault
          </p>
        </header>

        {/* Section: What this is */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
            <Info className="w-5 h-5 text-primary" /> What this is
          </h2>
          <p className="text-foreground/80 print:text-gray-700 leading-relaxed">
            This document provides the technical instructions required to claim Bitcoin from a "Dead Man's Switch" vault. 
            These funds were intended for you (the Beneficiary) if the Owner becomes inactive for a defined period.
          </p>
        </section>

        {/* Section: When to claim */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2 print:border-gray-300">
             <History className="w-5 h-5 text-primary" /> When you can claim
          </h2>
          <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl print:bg-gray-50 print:border-gray-300">
            <p className="text-sm leading-relaxed text-foreground/80">
              <strong>Condition:</strong> You can claim these funds ONLY if they have remained unmoved at the vault address for at least <strong>{model.locktimeBlocks} blocks</strong> (approximately <strong>{model.locktimeApprox}</strong>) since the last funding transaction was confirmed.
            </p>
          </div>
        </section>

        {/* Section: Recovery Steps */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-2 print:border-gray-300">Recovery Steps</h2>
          <ol className="space-y-4">
            {[
              {
                title: "Confirm Funds",
                desc: "Check the Vault Address on a blockchain explorer to ensure it still holds a balance."
              },
              {
                title: "Verify Confirmation",
                desc: `Find the last funding transaction. Ensure it has at least ${model.locktimeBlocks} confirmations before attempting to claim.`
              },
              {
                title: "Prepare Wallet",
                desc: "Use an advanced Bitcoin wallet (e.g., Sparrow Wallet) that supports P2WSH scripts and custom descriptors."
              },
              {
                title: "Construct Spend",
                desc: "Construct a transaction spending from the vault address. You must provide your signature and the Witness Script listed below."
              },
              {
                title: "Broadcast",
                desc: "Once signed and valid, broadcast the transaction to the network to move the funds to an address you control."
              }
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs print:bg-gray-100 print:text-black print:border print:border-gray-200">
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm">{step.title}</h4>
                  <p className="text-sm text-foreground/70 print:text-gray-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Section: Technical Data */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-border pb-2 print:border-gray-300">Technical Details</h2>
          
          <div className="grid gap-6">
            <DataRow label="Network" value={model.network} />
            <DataRow label="Vault Address" value={model.address} copyable />
            <DataRow label="Beneficiary Pubkey" value={model.beneficiaryPubkey} />
            <DataRow label="Witness Script (Hex)" value={model.witnessScriptHex} copyable mono />
            <DataRow label="Descriptor" value={model.descriptor} copyable mono />
          </div>
        </section>

        {/* Section: Warnings */}
        <section className="p-6 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl space-y-3 print:bg-gray-50 print:border-gray-200">
          <div className="flex items-center gap-2 text-yellow-600 font-bold text-[10px] uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Strong Warnings
          </div>
          <ul className="text-xs text-foreground/70 space-y-2 print:text-gray-600">
            <li>• <strong>Mistakes are permanent:</strong> If you send funds to the wrong address, they cannot be recovered.</li>
            <li>• <strong>Never share your private keys:</strong> This document does NOT contain your keys, but you need them to claim.</li>
            <li>• <strong>Verify everything:</strong> If using a real Bitcoin (Mainnet), verify the scripts with a second tool first.</li>
          </ul>
        </section>
      </article>

      <footer className="text-center pt-8 border-t border-border print:hidden">
        <p className="text-xs text-foreground/60">Generated by Bitcoin Will • Decentralized Inheritance</p>
      </footer>
    </div>
  );
};

const DataRow = ({ label, value, copyable, mono }: { label: string, value: string, copyable?: boolean, mono?: boolean }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 print:text-gray-500">{label}</p>
      <div className="flex gap-2">
        <div className={`flex-1 p-3 bg-muted border border-border rounded-lg text-sm break-all print:bg-transparent print:border-none print:p-0 ${mono ? 'font-mono text-[11px]' : ''}`}>
          {value}
        </div>
        {copyable && (
          <button 
            type="button"
            aria-label={`Copy ${label}`}
            onClick={handleCopy}
            className="p-3 bg-white border border-border rounded-lg hover:bg-muted transition-colors print:hidden"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 opacity-40" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Instructions;
