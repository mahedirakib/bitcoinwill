import { CheckCircle2, Copy, Download, FileText, Printer, QrCode, Users, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { PlanOutput } from '@/lib/bitcoin/types';

interface ResultStepProps {
  result: PlanOutput;
  onOpenDownloadChecklist: () => void;
  onViewInstructions: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
  onPrintShares: (result: PlanOutput) => void;
  onDownloadShares: (result: PlanOutput) => void;
}

export const ResultStep = ({
  result,
  onOpenDownloadChecklist,
  onViewInstructions,
  onCopyToClipboard,
  onPrintShares,
  onDownloadShares,
}: ResultStepProps) => {
  return (
    <div className="space-y-12 animate-in zoom-in-95 duration-1000">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
          <CheckCircle2 className="text-primary w-20 h-20 relative drop-shadow-lg" />
        </div>
        <h2 className="text-5xl font-black tracking-tight">Plan Secured</h2>
        <p className="text-foreground/70 text-lg font-medium">Your Vault Address is ready for funding.</p>
        {result.network === 'mainnet' && (
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-black uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" /> Mainnet Address
          </p>
        )}
        {result.address_type === 'p2tr' && (
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            Modern Format
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-6">
          <div className="glass p-8 space-y-5">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Vault Address ({result.network})</h4>
            <div className="flex gap-3">
              <div className="flex-1 p-5 bg-muted border border-border rounded-2xl font-mono text-xs break-all leading-relaxed shadow-inner">
                {result.address}
              </div>
              <button
                type="button"
                aria-label="Copy vault address"
                onClick={() => onCopyToClipboard(result.address, 'Address')}
                className="p-4 bg-white border border-border rounded-2xl hover:bg-muted transition-colors group shadow-sm"
              >
                <Copy className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          <div className="glass p-8 space-y-4">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Witness Script</h4>
            <div className="flex gap-3">
              <pre className="flex-1 p-5 bg-muted border border-border rounded-2xl text-[10px] font-mono overflow-x-auto opacity-80 leading-relaxed shadow-inner">
                {result.script_asm}
              </pre>
              <button
                type="button"
                aria-label="Copy witness script hex"
                onClick={() => onCopyToClipboard(result.script_hex, 'Script')}
                className="p-4 bg-white border border-border rounded-2xl h-fit hover:bg-muted transition-colors group shadow-sm"
              >
                <Copy className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {result.social_recovery_kit && (
            <div className="glass p-8 space-y-6 border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Social Recovery Shares</h4>
              </div>
              
              <div className="p-4 rounded-xl bg-orange-500/10 text-sm text-orange-700 space-y-2">
                <p className="font-bold">
                  {result.social_recovery_kit.config.threshold}-of-{result.social_recovery_kit.config.total} Configuration
                </p>
                <p className="text-xs">
                  Distribute these shares to trusted people. Any {result.social_recovery_kit.config.threshold} shares can reconstruct the beneficiary key.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.social_recovery_kit.shares.map((share) => (
                  <div key={share.index} className="space-y-3 p-4 bg-white rounded-xl border border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Share {share.index}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onCopyToClipboard(share.share, `Share ${share.index}`)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Copy share"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-border inline-block">
                      <QRCodeSVG
                        value={share.share}
                        size={120}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                      />
                    </div>
                    
                    <div className="p-2 bg-muted rounded-lg font-mono text-[9px] break-all text-foreground/60">
                      {share.share.slice(0, 32)}...{share.share.slice(-32)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onPrintShares(result)}
                  className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Share Cards
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadShares(result)}
                  className="flex-1 py-3 px-4 bg-muted text-foreground rounded-xl text-sm font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 text-xs space-y-2">
                <p className="font-bold text-foreground/70">Distribution Tips:</p>
                <ul className="space-y-1 text-foreground/50 list-disc list-inside">
                  <li>Print cards and give to different trusted people</li>
                  <li>Or scan QR codes to share via Signal/WhatsApp</li>
                  <li>Never store all shares in one location</li>
                  <li>Consider geographic distribution</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4 pt-4">
          <div className="glass p-6 space-y-4">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
              <QrCode className="w-3 h-3" /> Scan to Fund
            </h4>
            <div className="bg-white p-4 rounded-xl inline-block">
              <QRCodeSVG
                value={result.address}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-[10px] text-foreground/60 text-center">
              Scan with your mobile wallet
            </p>
          </div>

          <button type="button" onClick={onOpenDownloadChecklist} className="w-full btn-primary !bg-foreground !text-background flex items-center justify-center gap-3">
            <Download className="w-6 h-6" /> Download Recovery Kit
          </button>
          <button type="button" onClick={onViewInstructions} className="w-full btn-secondary flex items-center justify-center gap-3 shadow-sm">
            <FileText className="w-6 h-6 text-primary" /> View Instructions
          </button>
        </div>
      </div>
    </div>
  );
};
