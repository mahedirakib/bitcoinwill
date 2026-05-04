import { AlertTriangle, Check, Copy, Download, FileText, Printer, QrCode, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { PlanOutput } from '@/lib/bitcoin/types';
import { CopyButton } from '@/components/CopyButton';

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
    <div className="space-y-5">
      {/* Calm success banner */}
      <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success-bg px-3 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
          <Check className="h-3 w-3" />
        </span>
        <p className="text-sm font-medium text-success">
          Plan generated. The vault address is unfunded until you send Bitcoin to it.
        </p>
      </div>

      {result.network === 'mainnet' && (
        <div className="flex gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <p>This is a <strong className="font-semibold">Mainnet</strong> address. Verify everything before funding.</p>
        </div>
      )}

      {/* Vault address — primary artifact */}
      <div className="panel p-5">
        <div className="section-eyebrow mb-2">Vault address</div>
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-3">
          <div className="flex-1 break-all font-mono text-sm text-foreground">{result.address}</div>
          <CopyButton
            text={result.address}
            label="Address"
            onCopy={onCopyToClipboard}
            ariaLabel="Copy vault address"
            className="btn-secondary !px-3 !py-2"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <div><span className="text-foreground/40">Format:</span> {result.address_type === 'p2tr' ? 'P2TR (Taproot)' : 'P2WSH'}</div>
          <div><span className="text-foreground/40">Network:</span> <span className="capitalize">{result.network}</span></div>
        </div>
      </div>

      {/* Two-column: details + QR / actions */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* Witness Script */}
          <div className="panel p-5">
            <div className="section-eyebrow mb-2">Witness script</div>
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-3 py-3">
              <pre className="flex-1 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-foreground">
                {result.script_asm}
              </pre>
              <CopyButton
                text={result.script_hex}
                label="Script"
                onCopy={onCopyToClipboard}
                ariaLabel="Copy witness script hex"
                className="btn-secondary flex-shrink-0 !px-3 !py-2"
              />
            </div>
          </div>

          {/* Social recovery shares */}
          {result.social_recovery_kit && (
            <div className="panel p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="section-eyebrow">Social recovery shares</div>
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <p className="font-semibold">
                  {result.social_recovery_kit.config.threshold}-of-{result.social_recovery_kit.config.total} configuration
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Distribute these shares to trusted people. Any {result.social_recovery_kit.config.threshold} can reconstruct the beneficiary key.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  The Recovery Kit download does not include these shares. Print or download the share cards separately.
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.social_recovery_kit.shares.map((share) => (
                  <div key={share.index} className="rounded-md border border-border bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Share {share.index}</span>
                      <CopyButton
                        text={share.share}
                        label={`Share ${share.index}`}
                        onCopy={onCopyToClipboard}
                        className="btn-ghost !px-2 !py-1"
                      />
                    </div>
                    <div className="rounded border border-border bg-white p-2">
                      <QRCodeSVG value={share.share} size={108} bgColor="#ffffff" fgColor="#111111" level="H" title={`Share ${share.index} QR code`} />
                    </div>
                    <div className="rounded bg-muted px-2 py-1 font-mono text-[10px] break-all text-muted-foreground">
                      {share.share.slice(0, 28)}…{share.share.slice(-28)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onPrintShares(result)}
                  className="btn-secondary"
                >
                  <Printer className="h-4 w-4" /> Print share cards
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadShares(result)}
                  className="btn-secondary"
                >
                  <Download className="h-4 w-4" /> Download all
                </button>
              </div>

              <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Distribution tips:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Print cards and give to different trusted people.</li>
                  <li>Or scan QR codes to share via Signal / WhatsApp.</li>
                  <li>Never store all shares in one location.</li>
                  <li>Consider geographic distribution.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="panel p-5">
            <div className="section-eyebrow mb-2 flex items-center gap-1.5">
              <QrCode className="h-3 w-3" /> Scan to fund
            </div>
            <div className="flex justify-center rounded-md border border-border bg-white p-3">
              <QRCodeSVG value={result.address} size={160} bgColor="#ffffff" fgColor="#111111" level="M" title="Vault address QR code" />
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Scan with your mobile wallet.</p>
          </div>

          <button type="button" onClick={onOpenDownloadChecklist} className="btn-primary w-full">
            <Download className="h-4 w-4" /> Download recovery kit
          </button>
          <button type="button" onClick={onViewInstructions} className="btn-secondary w-full">
            <FileText className="h-4 w-4" /> View instructions
          </button>
          <button
            type="button"
            onClick={() => onCopyToClipboard(result.address, 'Address')}
            className="btn-ghost w-full"
          >
            <Copy className="h-4 w-4" /> Copy address
          </button>
        </div>
      </div>

      <div className="panel p-5">
        <div className="text-sm font-semibold">Next steps</div>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Verify the vault address on a second device or block explorer.</li>
          <li>• Send a small test amount before any real funding.</li>
          <li>• Store the recovery kit on durable offline media.</li>
          <li>• Share beneficiary instructions through a separate channel.</li>
        </ul>
      </div>
    </div>
  );
};
