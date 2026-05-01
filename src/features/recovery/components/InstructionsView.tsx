import { AlertTriangle, ChevronLeft, Download, History, Info, Printer } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { DataRow } from '@/components/DataDisplay';
import type { InstructionsViewProps } from '../types';

export const InstructionsView = ({
  model,
  onDownloadTxt,
  onPrint,
  onBack,
  children,
}: InstructionsViewProps) => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to recovery
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onDownloadTxt} className="btn-secondary">
            <Download className="h-4 w-4" /> Download TXT
          </button>
          <button type="button" onClick={onPrint} className="btn-primary">
            <Printer className="h-4 w-4" /> Print PDF
          </button>
        </div>
      </div>

      <article className="panel space-y-8 px-6 py-7 print:border-none print:bg-white print:p-0 print:text-black md:px-10 md:py-10">
        <header className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="" className="mb-1 h-14 w-14 object-contain" />
          <h1 className="text-2xl font-semibold tracking-tight">Beneficiary instructions</h1>
          <p className="section-eyebrow print:text-gray-500">
            Bitcoin Will · Non-custodial inheritance vault
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 border-b border-border pb-2 text-base font-semibold print:border-gray-300">
            <Info className="h-4 w-4 text-foreground/70" /> What this is
          </h2>
          <p className="text-sm leading-relaxed text-foreground/80 print:text-gray-700">
            This document provides the technical instructions required to claim Bitcoin from a Dead Man's Switch vault. These funds were intended for you (the beneficiary) if the owner becomes inactive for a defined period.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 border-b border-border pb-2 text-base font-semibold print:border-gray-300">
            <History className="h-4 w-4 text-foreground/70" /> When you can claim
          </h2>
          <div className="rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/80 print:border-gray-300 print:bg-gray-50">
            <strong className="font-semibold">Condition:</strong> You can claim these funds ONLY if they have remained unmoved at the vault address for at least <strong className="font-semibold">{model.locktimeBlocks} blocks</strong> (approximately <strong className="font-semibold">{model.locktimeApprox}</strong>) since the last funding transaction was confirmed.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="border-b border-border pb-2 text-base font-semibold print:border-gray-300">Recovery steps</h2>
          <ol className="space-y-3">
            {[
              { title: 'Confirm funds', desc: 'Check the vault address on a blockchain explorer to ensure it still holds a balance.' },
              { title: 'Verify confirmation', desc: `Find the last funding transaction. Ensure it has at least ${model.locktimeBlocks} confirmations before attempting to claim.` },
              {
                title: 'Prepare wallet',
                desc:
                  model.addressType === 'p2tr'
                    ? 'Use an advanced Bitcoin wallet (e.g., Sparrow Wallet) that supports Taproot script-path spends and custom descriptors.'
                    : 'Use an advanced Bitcoin wallet (e.g., Sparrow Wallet) that supports P2WSH scripts and custom descriptors.',
              },
              { title: 'Construct spend', desc: 'Construct a transaction spending from the vault address. You must provide your signature and the witness script listed below.' },
              { title: 'Broadcast', desc: 'Once signed and valid, broadcast the transaction to the network to move the funds to an address you control.' },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-foreground print:border-gray-300">
                  {i + 1}
                </span>
                <div>
                  <h4 className="text-sm font-semibold">{step.title}</h4>
                  <p className="text-sm text-foreground/70 print:text-gray-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-base font-semibold print:border-gray-300">Technical details</h2>
          <div className="grid gap-4">
            <DataRow label="Network" value={model.network} />
            <DataRow label="Address format" value={model.addressType === 'p2tr' ? 'P2TR (Taproot)' : 'P2WSH (SegWit v0)'} />
            <DataRow label="Vault address" value={model.address} copyable />
            <DataRow label="Beneficiary pubkey" value={model.beneficiaryPubkey} />
            <DataRow label="Witness script (hex)" value={model.witnessScriptHex} copyable mono />
            <DataRow label="Descriptor" value={model.descriptor} copyable mono />
          </div>
        </section>

        <section className="rounded-md border border-warning/30 bg-warning-bg p-4 text-sm space-y-2 print:border-gray-300 print:bg-gray-50">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
            <AlertTriangle className="h-3.5 w-3.5" /> Strong warnings
          </div>
          <ul className="space-y-1.5 text-xs text-foreground/80 print:text-gray-700">
            <li>• <strong className="font-semibold">Mistakes are permanent:</strong> if you send funds to the wrong address, they cannot be recovered.</li>
            <li>• <strong className="font-semibold">Never share your private keys:</strong> this document does NOT contain your keys, but you need them to claim.</li>
            <li>• <strong className="font-semibold">Verify everything:</strong> on Mainnet, confirm the scripts with a second tool first.</li>
          </ul>
        </section>

        {children}
      </article>

      <footer className="border-t border-border pt-4 text-center text-xs text-muted-foreground print:hidden">
        Generated by Bitcoin Will · Decentralized inheritance
      </footer>
    </div>
  );
};
