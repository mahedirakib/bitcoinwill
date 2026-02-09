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
import { InstructionModel, buildInstructions, generateInstructionTxt } from '@/lib/bitcoin/instructions';
import { downloadTxt } from '@/lib/utils/download';
import type { PlanInput, PlanOutput } from '@/lib/bitcoin/types';

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

  useEffect(() => {
    if (initialData?.plan && initialData?.result) {
      const m = buildInstructions(initialData.plan, initialData.result, initialData.created_at);
      setModel(m);
    }
  }, [initialData]);

  const handleJsonUpload = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (data.plan && data.result) {
        const m = buildInstructions(data.plan, data.result, data.created_at);
        setModel(m);
      } else {
        alert("Invalid JSON: Missing plan or result data.");
      }
    } catch {
      alert("Invalid JSON: Please check the format.");
    }
  };

  if (!model) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 space-y-8 animate-in fade-in">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground/40 hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-primary/20 mx-auto" />
          <h1 className="text-3xl font-bold">View Beneficiary Instructions</h1>
          <p className="text-foreground/60">Paste your Recovery Kit JSON below to view the claim instructions.</p>
        </div>
        <textarea 
          className="w-full h-48 bg-zinc-900 border border-white/10 rounded-xl p-4 font-mono text-xs"
          placeholder='{"version": "0.1.0", "plan": {...}, "result": {...}}'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <button 
          onClick={handleJsonUpload}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold"
        >
          Load Instructions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12">
      {/* Header - Hidden on Print */}
      <div className="flex justify-between items-center print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground/60 hover:text-primary">
          <ChevronLeft className="w-4 h-4" /> Back to App
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => downloadTxt('beneficiary-instructions.txt', generateInstructionTxt(model))}
            className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800"
          >
            <Download className="w-4 h-4" /> Download TXT
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200"
          >
            <Printer className="w-4 h-4" /> Print PDF
          </button>
        </div>
      </div>

      <article className="space-y-12 print:text-black print:space-y-8">
        <header className="space-y-4 text-center flex flex-col items-center">
          <img src="/logo.png" alt="Bitcoin Will Logo" className="w-16 h-16 object-contain mb-2 print:invert print:brightness-0" />
          <h1 className="text-4xl font-extrabold tracking-tight">Beneficiary Instructions</h1>
          <p className="text-foreground/60 print:text-gray-500 uppercase tracking-widest text-xs font-bold">
            Bitcoin Will • Non-Custodial Inheritance Vault
          </p>
        </header>

        {/* Section: What this is */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-white/10 pb-2 flex items-center gap-2 print:border-gray-300">
            <Info className="w-5 h-5 text-primary" /> What this is
          </h2>
          <p className="text-foreground/70 print:text-gray-700">
            This document provides the technical instructions required to claim Bitcoin from a "Dead Man's Switch" vault. 
            These funds were intended for you (the Beneficiary) if the Owner becomes inactive for a defined period.
          </p>
        </section>

        {/* Section: When to claim */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold border-b border-white/10 pb-2 flex items-center gap-2 print:border-gray-300">
             <History className="w-5 h-5 text-primary" /> When you can claim
          </h2>
          <div className="glass p-6 bg-primary/5 border-primary/20 print:bg-gray-100 print:border-gray-300">
            <p className="text-sm leading-relaxed">
              <strong>Condition:</strong> You can claim these funds ONLY if they have remained unmoved at the vault address for at least <strong>{model.locktimeBlocks} blocks</strong> (approximately <strong>{model.locktimeApprox}</strong>) since the last funding transaction was confirmed.
            </p>
          </div>
        </section>

        {/* Section: Recovery Steps */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-white/10 pb-2 print:border-gray-300">Recovery Steps</h2>
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
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs print:bg-gray-200 print:text-black">
                  {i + 1}
                </span>
                <div>
                  <h4 className="font-bold text-sm">{step.title}</h4>
                  <p className="text-sm text-foreground/60 print:text-gray-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Section: Technical Data */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold border-b border-white/10 pb-2 print:border-gray-300">Technical Details</h2>
          
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
          <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase">
            <AlertTriangle className="w-4 h-4" /> Strong Warnings
          </div>
          <ul className="text-xs text-foreground/60 space-y-2 print:text-gray-600">
            <li>• <strong>Mistakes are permanent:</strong> If you send funds to the wrong address, they cannot be recovered.</li>
            <li>• <strong>Never share your private keys:</strong> This document does NOT contain your keys, but you need them to claim.</li>
            <li>• <strong>Verify everything:</strong> If using a real Bitcoin (Mainnet), verify the scripts with a second tool first.</li>
          </ul>
        </section>
      </article>

      <footer className="text-center pt-8 border-t border-white/5 print:hidden">
        <p className="text-xs text-foreground/30">Generated by Bitcoin Will • Decentralized Inheritance</p>
      </footer>
    </div>
  );
};

const DataRow = ({ label, value, copyable, mono }: { label: string, value: string, copyable?: boolean, mono?: boolean }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/40 print:text-gray-500">{label}</p>
      <div className="flex gap-2">
        <div className={`flex-1 p-3 bg-zinc-900 border border-white/5 rounded-lg text-sm break-all print:bg-transparent print:border-none print:p-0 ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </div>
        {copyable && (
          <button 
            onClick={handleCopy}
            className="p-3 bg-zinc-900 border border-white/5 rounded-lg hover:bg-zinc-800 print:hidden"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 opacity-40" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Instructions;
