import { describe, expect, it } from 'vitest';
import type { PlanOutput } from '@/lib/bitcoin/types';
import { buildSharePrintHtml, buildSharesText, escapeHtml } from './shareExport';

const socialRecoveryKit: NonNullable<PlanOutput['social_recovery_kit']> = {
  config: { threshold: 2, total: 3 },
  shares: [
    { index: 1, share: 'a'.repeat(80) },
    { index: 2, share: 'b'.repeat(80) },
    { index: 3, share: 'c'.repeat(80) },
  ],
  instructions: ['Distribute shares separately.'],
};

const resultWithShares: PlanOutput = {
  descriptor: 'tr(abc,{def})',
  script_asm: 'OP_IF OP_CHECKSIG OP_ENDIF',
  script_hex: '51ac68',
  address: 'tb1pexamplevaultaddress000000000000000000000000000000000000',
  witness_script: '51ac68',
  network: 'testnet',
  address_type: 'p2tr',
  social_recovery_kit: socialRecoveryKit,
  human_explanation: ['Vault Address: tb1pexamplevaultaddress000000000000000000000000000000000000'],
};

describe('share export helpers', () => {
  it('escapes HTML metacharacters', () => {
    expect(escapeHtml(`<share data="x">Tom & Bob's</share>`)).toBe(
      '&lt;share data=&quot;x&quot;&gt;Tom &amp; Bob&#39;s&lt;/share&gt;',
    );
  });

  it('builds print HTML with escaped share values', () => {
    const maliciousResult: PlanOutput = {
      ...resultWithShares,
      address: 'tb1p<address>&000000000000000000000000000000000000000000',
      social_recovery_kit: {
        ...socialRecoveryKit,
        shares: [{ index: 1, share: '<script>alert("x")</script>' }],
      },
    };

    const html = buildSharePrintHtml(maliciousResult);

    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain('tb1p&lt;address&gt;&amp;0');
  });

  it('builds plain text share export content', () => {
    const text = buildSharesText(resultWithShares);

    expect(text).toContain('BITCOIN WILL - SOCIAL RECOVERY SHARES');
    expect(text).toContain('Configuration: 2-of-3');
    expect(text).toContain('--- SHARE 1 OF 3 ---');
  });

  it('requires social recovery share material', () => {
    const resultWithoutShares: PlanOutput = {
      ...resultWithShares,
      social_recovery_kit: undefined,
    };

    expect(() => buildSharePrintHtml(resultWithoutShares)).toThrow('Social recovery kit is required');
    expect(() => buildSharesText(resultWithoutShares)).toThrow('Social recovery kit is required');
  });
});
