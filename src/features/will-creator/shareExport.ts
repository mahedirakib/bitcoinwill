import type { PlanOutput } from '@/lib/bitcoin/types';

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);

const requireSocialRecoveryKit = (result: PlanOutput) => {
  if (!result.social_recovery_kit) {
    throw new Error('Social recovery kit is required for share export');
  }

  return result.social_recovery_kit;
};

export const buildSharePrintHtml = (result: PlanOutput, shareIndex: number): string => {
  const { shares, config } = requireSocialRecoveryKit(result);
  const share = shares.find((candidate) => candidate.index === shareIndex);
  if (!share) throw new Error('Social recovery share was not found');
  const vaultPreview = `${result.address.slice(0, 20)}...${result.address.slice(-10)}`;

  return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bitcoin Will - Social Recovery Shares</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; background: #f5f5f5; }
            .card { background: white; border: 2px solid #f97316; border-radius: 12px; padding: 24px; margin-bottom: 20px; page-break-inside: avoid; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: #f97316; color: white; padding: 12px 24px; margin: -24px -24px 20px -24px; border-radius: 10px 10px 0 0; font-weight: bold; font-size: 18px; }
            .share-number { font-size: 48px; font-weight: bold; color: #f97316; }
            .share-data { font-family: monospace; font-size: 11px; background: #f5f5f5; padding: 12px; border-radius: 8px; word-break: break-all; margin: 16px 0; }
            .info { font-size: 12px; color: #666; margin-top: 16px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 16px; font-size: 12px; }
            @media print { body { background: white; } .card { box-shadow: none; break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0;">Bitcoin Will - Social Recovery Share</h1>
            <p style="color: #666; margin: 8px 0;">Vault: ${escapeHtml(vaultPreview)}</p>
            <p style="color: #f97316; font-weight: bold;">${config.threshold}-of-${config.total} Configuration</p>
          </div>
          <div class="card">
            <div class="header">Social Recovery Share #${escapeHtml(String(share.index))}</div>
            <div class="share-number">${escapeHtml(String(share.index))}</div>
            <div class="share-data">${escapeHtml(share.share)}</div>
            <div class="info"><strong>This is Share ${escapeHtml(String(share.index))} of ${config.total}</strong><br>Store this card in a safe place. Any ${config.threshold} shares can recover the funds.</div>
            <div class="warning"><strong>Important:</strong> Do not store multiple shares in the same location. Give this card to a trusted person who understands what it is for.</div>
          </div>
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
            <strong>Recovery Instructions:</strong><br>To claim funds, the beneficiary needs:<br>1. This share (or ${config.threshold - 1} other shares)<br>2. The Recovery Kit file<br>3. Access to the Bitcoin Will app
          </div>
        </body>
        </html>
      `;
};

export const buildShareText = (result: PlanOutput, shareIndex: number): string => {
  const { shares, config } = requireSocialRecoveryKit(result);
  const share = shares.find((candidate) => candidate.index === shareIndex);
  if (!share) throw new Error('Social recovery share was not found');

  return `BITCOIN WILL - SOCIAL RECOVERY SHARE ${share.index}
========================================
Vault Address: ${result.address}
Configuration: ${config.threshold}-of-${config.total}
Generated: ${new Date().toISOString()}

INSTRUCTIONS:
- Store this share separately from every other share
- Any ${config.threshold} shares can reconstruct the beneficiary key
- Never store all shares in one location

--- SHARE ${share.index} OF ${config.total} ---
${share.share}

RECOVERY PROCESS:
To claim funds, the beneficiary needs:
1. ${config.threshold} shares (including this one or others)
2. The Recovery Kit JSON file
3. Access to the Bitcoin Will app (self-host or use the maintainer-provided deployment)

For support, contact the Bitcoin Will maintainer.
`;
};
