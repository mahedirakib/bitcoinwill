import { describe, expect, it, vi } from 'vitest';
import {
  broadcastTransaction,
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  fetchAddressSummary,
  supportsPublicExplorerNetwork,
} from './explorer';

const makeJsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

describe('explorer helpers', () => {
  const address = 'tb1qexampleaddressexampleaddressexampleaddressexample0';
  const txidA = 'a'.repeat(64);
  const txidB = 'b'.repeat(64);
  const txidC = 'c'.repeat(64);
  const txidD = 'd'.repeat(64);

  it('builds explorer URLs for supported networks', () => {
    expect(buildExplorerAddressUrl('testnet', 'mempool', address)).toContain(
      'https://mempool.space/testnet/address/',
    );
    expect(buildExplorerTxUrl('mainnet', 'blockstream', txidA)).toContain(
      'https://blockstream.info/tx/',
    );
  });

  it('reports explorer support by network', () => {
    expect(supportsPublicExplorerNetwork('testnet')).toBe(true);
    expect(supportsPublicExplorerNetwork('mainnet')).toBe(true);
    expect(supportsPublicExplorerNetwork('regtest')).toBe(false);
  });

  it('fetches and normalizes address summary data', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/address/tb1qexampleaddressexampleaddressexampleaddressexample0')) {
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 10_000, spent_txo_sum: 2_000, tx_count: 4 },
          mempool_stats: { funded_txo_sum: 400, spent_txo_sum: 100, tx_count: 1 },
        });
      }
      if (url.endsWith('/address/tb1qexampleaddressexampleaddressexampleaddressexample0/txs')) {
        return makeJsonResponse([
          {
            txid: txidA,
            status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
            vout: [{ scriptpubkey_address: address, value: 5_000 }],
          },
          {
            txid: txidB,
            status: { confirmed: true, block_height: 90, block_time: 1_699_999_900 },
            vout: [{ scriptpubkey_address: address, value: 2_000 }],
          },
        ]);
      }
      if (url.endsWith('/blocks/tip/height')) {
        return new Response('120', { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const summary = await fetchAddressSummary({
      network: 'testnet',
      address,
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
    });

    expect(summary.confirmedBalanceSats).toBe(8_000);
    expect(summary.unconfirmedBalanceSats).toBe(300);
    expect(summary.totalBalanceSats).toBe(8_300);
    expect(summary.txCount).toBe(5);
    expect(summary.providerUsed).toBe('mempool');
    expect(summary.usedFallbackProvider).toBe(false);
    expect(summary.lastFundingTx?.txid).toBe(txidA);
    expect(summary.lastConfirmedFundingTx?.confirmations).toBe(21);
  });

  it('falls back to alternate provider when primary fails', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('mempool.space/testnet/api')) {
        return new Response('upstream unavailable', { status: 503 });
      }
      if (url.includes('/address/')) {
        if (url.endsWith('/txs')) {
          return makeJsonResponse([]);
        }
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
        });
      }
      if (url.endsWith('/blocks/tip/height')) {
        return new Response('500000', { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const summary = await fetchAddressSummary({
      network: 'testnet',
      address,
      provider: 'mempool',
      fallbackToOtherProvider: true,
      fetcher,
    });

    expect(summary.providerUsed).toBe('blockstream');
    expect(summary.usedFallbackProvider).toBe(true);
  });

  it('scans older chain pages when initial tx page has no funding event', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/address/tb1qexampleaddressexampleaddressexampleaddressexample0')) {
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 10_000, spent_txo_sum: 4_000, tx_count: 40 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
        });
      }
      if (url.endsWith('/address/tb1qexampleaddressexampleaddressexampleaddressexample0/txs')) {
        return makeJsonResponse([
          {
            txid: txidA,
            status: { confirmed: true, block_height: 140 },
            vout: [{ scriptpubkey_address: 'tb1qnotouraddressxxxxxxxxxxxxxxxxxxxxxxxxxxxx', value: 2_000 }],
          },
          {
            txid: txidB,
            status: { confirmed: true, block_height: 130 },
            vout: [{ scriptpubkey_address: 'tb1qnotouraddressxxxxxxxxxxxxxxxxxxxxxxxxxxxx', value: 2_000 }],
          },
        ]);
      }
      if (url.endsWith(`/address/tb1qexampleaddressexampleaddressexampleaddressexample0/txs/chain/${txidB}`)) {
        return makeJsonResponse([
          {
            txid: txidC,
            status: { confirmed: true, block_height: 120, block_time: 1_700_000_100 },
            vout: [{ scriptpubkey_address: address, value: 6_000 }],
          },
          {
            txid: txidD,
            status: { confirmed: true, block_height: 110 },
            vout: [{ scriptpubkey_address: 'tb1qnotouraddressxxxxxxxxxxxxxxxxxxxxxxxxxxxx', value: 1_000 }],
          },
        ]);
      }
      if (url.endsWith('/blocks/tip/height')) {
        return new Response('140', { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const summary = await fetchAddressSummary({
      network: 'testnet',
      address,
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
    });

    expect(summary.lastFundingTx?.txid).toBe(txidC);
    expect(summary.lastConfirmedFundingTx?.txid).toBe(txidC);
    expect(summary.lastConfirmedFundingTx?.confirmations).toBe(21);
  });

  it('leaves confirmations undefined when tip height is unavailable', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/address/tb1qexampleaddressexampleaddressexampleaddressexample0')) {
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 8_000, spent_txo_sum: 0, tx_count: 1 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
        });
      }
      if (url.endsWith('/address/tb1qexampleaddressexampleaddressexampleaddressexample0/txs')) {
        return makeJsonResponse([
          {
            txid: txidA,
            status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
            vout: [{ scriptpubkey_address: address, value: 8_000 }],
          },
        ]);
      }
      if (url.endsWith('/blocks/tip/height')) {
        return new Response('not-a-height', { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const summary = await fetchAddressSummary({
      network: 'testnet',
      address,
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
    });

    expect(summary.tipHeight).toBeUndefined();
    expect(summary.lastConfirmedFundingTx?.txid).toBe(txidA);
    expect(summary.lastConfirmedFundingTx?.confirmations).toBeUndefined();
  });

  it('broadcasts transactions and falls back on provider error', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('mempool.space/testnet/api/tx')) {
        return new Response('temporarily unavailable', { status: 503 });
      }
      if (url.includes('blockstream.info/testnet/api/tx')) {
        expect(init?.method).toBe('POST');
        return new Response(txidB, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await broadcastTransaction({
      network: 'testnet',
      provider: 'mempool',
      rawTxHex: '02000000000100000000',
      fallbackToOtherProvider: true,
      fetcher,
    });

    expect(result.txid).toBe(txidB);
    expect(result.providerUsed).toBe('blockstream');
    expect(result.usedFallbackProvider).toBe(true);
    expect(result.explorerTxUrl).toContain('/tx/');
  });

  it('rejects invalid transaction hex before network calls', async () => {
    await expect(
      broadcastTransaction({
        network: 'testnet',
        rawTxHex: 'zzz-not-hex',
      }),
    ).rejects.toThrow('Transaction hex must contain only hexadecimal characters');
  });
});
