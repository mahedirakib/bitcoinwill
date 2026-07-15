import { describe, expect, it, vi } from 'vitest';
import { address as bitcoinAddress, networks, Transaction } from 'bitcoinjs-lib';
import {
  broadcastTransaction,
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  fetchAddressSummary,
  sanitizeAddress,
  supportsPublicExplorerNetwork,
} from './explorer';

const makeJsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

const createRawTransaction = (): string => {
  const transaction = new Transaction();
  transaction.version = 2;
  transaction.addInput(Uint8Array.from({ length: 32 }, () => 1), 0);
  transaction.addOutput(Uint8Array.of(0x51), 1_000n);
  return transaction.toHex();
};

describe('explorer helpers', () => {
  const address = 'tb1qwh9gn7qyw323gzxc83xaj97aamsenwpx4jyuuf8cg0sqstz9q6xqsf6zdl';
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

  describe('sanitizeAddress', () => {
    it('lowercases bech32 addresses so funding-event matching stays reliable', () => {
      expect(sanitizeAddress(address.toUpperCase(), 'testnet')).toBe(
        address,
      );
    });

    it('does not alter legacy Base58Check addresses (case-sensitive)', () => {
      const legacy = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
      expect(sanitizeAddress(legacy, 'mainnet')).toBe(legacy);
    });

    it('trims surrounding whitespace', () => {
      expect(sanitizeAddress(`  ${address}  `, 'testnet')).toBe(
        address,
      );
    });

    it('rejects addresses that are too short', () => {
      expect(() => sanitizeAddress('tb1qshort', 'testnet')).toThrow('Address is too short');
    });

    it('rejects invalid checksums and cross-network addresses', () => {
      expect(() => sanitizeAddress(`${address.slice(0, -1)}q`, 'testnet')).toThrow(
        'Address is not valid for testnet',
      );
      expect(() => sanitizeAddress(address, 'mainnet')).toThrow(
        'Address is not valid for mainnet',
      );
    });
  });

  it('fetches and normalizes address summary data', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith(`/address/${address}`)) {
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 10_000, spent_txo_sum: 2_000, tx_count: 4 },
          mempool_stats: { funded_txo_sum: 400, spent_txo_sum: 100, tx_count: 1 },
        });
      }
      if (url.endsWith(`/address/${address}/txs`)) {
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
      if (url.endsWith(`/address/${address}/utxo`)) {
        return makeJsonResponse([
          { txid: txidA, vout: 0, value: 5_000, status: { confirmed: true, block_height: 100 } },
          { txid: txidB, vout: 1, value: 3_000, status: { confirmed: true, block_height: 119 } },
          { txid: txidC, vout: 0, value: 300, status: { confirmed: false } },
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
    expect(summary.utxos).toEqual([
      expect.objectContaining({ txid: txidA, valueSats: 5_000, confirmations: 21 }),
      expect.objectContaining({ txid: txidB, valueSats: 3_000, confirmations: 2 }),
      expect.objectContaining({ txid: txidC, valueSats: 300, confirmations: undefined }),
    ]);
  });

  it('keeps total consistent with confirmed + unconfirmed when spent exceeds funded', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith(`/address/${address}`)) {
        // chain spent > funded (explorer inconsistency); mempool positive.
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 1_000, spent_txo_sum: 1_500, tx_count: 2 },
          mempool_stats: { funded_txo_sum: 800, spent_txo_sum: 100, tx_count: 1 },
        });
      }
      if (url.endsWith(`/address/${address}/txs`)) {
        return makeJsonResponse([]);
      }
      if (url.endsWith(`/address/${address}/utxo`)) {
        return makeJsonResponse([]);
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

    expect(summary.confirmedBalanceSats).toBe(0);
    expect(summary.unconfirmedBalanceSats).toBe(700);
    // total must equal confirmed + unconfirmed, not the raw (negative) sum.
    expect(summary.totalBalanceSats).toBe(700);
    expect(summary.totalBalanceSats).toBe(
      summary.confirmedBalanceSats + summary.unconfirmedBalanceSats,
    );
  });

  it('falls back to alternate provider when primary fails', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('mempool.space/testnet/api')) {
        return new Response('upstream unavailable', { status: 503 });
      }
      if (url.includes('/address/')) {
        if (url.endsWith('/txs') || url.endsWith('/utxo')) {
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
      retryConfig: { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
    });

    expect(summary.providerUsed).toBe('blockstream');
    expect(summary.usedFallbackProvider).toBe(true);
  });

  it('scans older chain pages when initial tx page has no funding event', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith(`/address/${address}`)) {
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 10_000, spent_txo_sum: 4_000, tx_count: 40 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
        });
      }
      if (url.endsWith(`/address/${address}/txs`)) {
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
      if (url.endsWith(`/address/${address}/utxo`)) {
        return makeJsonResponse([]);
      }
      if (url.endsWith(`/address/${address}/txs/chain/${txidB}`)) {
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
      if (url.endsWith(`/address/${address}`)) {
        return makeJsonResponse({
          chain_stats: { funded_txo_sum: 8_000, spent_txo_sum: 0, tx_count: 1 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0, tx_count: 0 },
        });
      }
      if (url.endsWith(`/address/${address}/txs`)) {
        return makeJsonResponse([
          {
            txid: txidA,
            status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
            vout: [{ scriptpubkey_address: address, value: 8_000 }],
          },
        ]);
      }
      if (url.endsWith(`/address/${address}/utxo`)) {
        return makeJsonResponse([
          { txid: txidA, vout: 0, value: 8_000, status: { confirmed: true, block_height: 100 } },
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
    expect(summary.utxos[0].confirmations).toBeUndefined();
  });

  it('broadcasts transactions and falls back on provider error', async () => {
    const rawTxHex = createRawTransaction();
    const expectedTxid = Transaction.fromHex(rawTxHex).getId();

    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('mempool.space/testnet/api/tx')) {
        return new Response('temporarily unavailable', { status: 503 });
      }
      if (url.includes('blockstream.info/testnet/api/tx')) {
        expect(init?.method).toBe('POST');
        return new Response(expectedTxid, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await broadcastTransaction({
      network: 'testnet',
      provider: 'mempool',
      rawTxHex,
      fallbackToOtherProvider: true,
      fetcher,
      retryConfig: { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
    });

    expect(result.txid).toBe(expectedTxid);
    expect(result.providerUsed).toBe('blockstream');
    expect(result.usedFallbackProvider).toBe(true);
    expect(result.explorerTxUrl).toContain('/tx/');
  });

  it('rejects a txid from the explorer that does not match the broadcast tx', async () => {
    const rawTxHex = createRawTransaction();
    const expectedTxid = Transaction.fromHex(rawTxHex).getId();
    // A different valid-looking 64-hex txid.
    const wrongTxid = 'f'.repeat(64);
    expect(wrongTxid).not.toBe(expectedTxid);

    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('mempool.space/testnet/api/tx')) {
        expect(init?.method).toBe('POST');
        return new Response(wrongTxid, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    await expect(
      broadcastTransaction({
        network: 'testnet',
        rawTxHex,
        provider: 'mempool',
        fallbackToOtherProvider: false,
        fetcher,
        retryConfig: { maxRetries: 0, baseDelayMs: 0, maxDelayMs: 0 },
      }),
    ).rejects.toThrow('does not match the broadcast transaction');
  });

  it('rejects structurally invalid transaction hex', async () => {
    // Valid hex, even length, long enough — but not parseable as a Bitcoin tx.
    await expect(
      broadcastTransaction({
        network: 'testnet',
        rawTxHex: 'ab'.repeat(20),
      }),
    ).rejects.toThrow('valid Bitcoin transaction with at least one input and one output');
  });

  it('rejects transactions with no inputs or outputs', async () => {
    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: '02000000000000000000',
    })).rejects.toThrow('at least one input and one output');
  });

  it('validates that a recovery transaction spends the loaded vault', async () => {
    const previousTxid = '1'.repeat(64);
    const vaultAddress = address;
    const transaction = new Transaction();
    transaction.version = 2;
    transaction.addInput(Uint8Array.from(Buffer.from(previousTxid, 'hex')).reverse(), 0, 144);
    transaction.addOutput(bitcoinAddress.toOutputScript(vaultAddress, networks.testnet), 9_000n);
    transaction.setWitness(0, [Uint8Array.of(1), new Uint8Array(), Uint8Array.of(0x51)]);
    const rawTxHex = transaction.toHex();
    const expectedTxid = transaction.getId();

    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith(`/tx/${previousTxid}`)) {
        return makeJsonResponse({
          txid: previousTxid,
          vout: [{ scriptpubkey_address: vaultAddress, value: 10_000 }],
        });
      }
      if (url.endsWith('/tx') && init?.method === 'POST') {
        return new Response(expectedTxid, { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as unknown as typeof fetch;

    const result = await broadcastTransaction({
      network: 'testnet',
      rawTxHex,
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault: {
        address: vaultAddress,
        addressType: 'p2wsh',
        witnessScriptHex: '51',
        locktimeBlocks: 144,
        destinationAddress: vaultAddress,
      },
    });

    expect(result.vaultInputCount).toBe(1);
    expect(result.feeSats).toBe(1_000);
    expect(result.feeRateSatsPerVbyte).toBeGreaterThan(0);
  });

  it('rejects unrelated and CSV-invalid recovery transactions before POST', async () => {
    const previousTxid = '2'.repeat(64);
    const transaction = new Transaction();
    transaction.version = 2;
    transaction.addInput(Uint8Array.from(Buffer.from(previousTxid, 'hex')).reverse(), 0, 143);
    transaction.addOutput(bitcoinAddress.toOutputScript(address, networks.testnet), 9_000n);
    transaction.setWitness(0, [Uint8Array.of(1), new Uint8Array(), Uint8Array.of(0x51)]);

    let postCalled = false;
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'POST') postCalled = true;
      if (url.endsWith(`/tx/${previousTxid}`)) {
        return makeJsonResponse({
          txid: previousTxid,
          vout: [{ scriptpubkey_address: address, value: 10_000 }],
        });
      }
      return new Response('unexpected POST', { status: 500 });
    }) as unknown as typeof fetch;

    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: transaction.toHex(),
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault: {
        address,
        addressType: 'p2wsh',
        witnessScriptHex: '51',
        locktimeBlocks: 144,
        destinationAddress: address,
      },
    })).rejects.toThrow('required CSV sequence');

    expect(postCalled).toBe(false);
  });

  it('rejects recovery transactions that do not spend the loaded vault', async () => {
    const previousTxid = '3'.repeat(64);
    const transaction = new Transaction();
    transaction.version = 2;
    transaction.addInput(Uint8Array.from(Buffer.from(previousTxid, 'hex')).reverse(), 0, 144);
    transaction.addOutput(bitcoinAddress.toOutputScript(address, networks.testnet), 9_000n);
    transaction.setWitness(0, [Uint8Array.of(1), new Uint8Array(), Uint8Array.of(0x51)]);

    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith(`/tx/${previousTxid}`)) {
        return makeJsonResponse({
          txid: previousTxid,
          vout: [{ scriptpubkey_address: 'tb1qnot-the-loaded-vault', value: 10_000 }],
        });
      }
      return new Response('unexpected POST', { status: 500 });
    }) as unknown as typeof fetch;

    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: transaction.toHex(),
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault: {
        address,
        addressType: 'p2wsh',
        witnessScriptHex: '51',
        locktimeBlocks: 144,
        destinationAddress: address,
      },
    })).rejects.toThrow('does not spend any output from the loaded vault');
  });

  it('rejects an unconfirmed destination and an excessive fee before POST', async () => {
    const previousTxid = '4'.repeat(64);
    const makeSpend = (outputScript: Uint8Array, outputValue: bigint): Transaction => {
      const transaction = new Transaction();
      transaction.version = 2;
      transaction.addInput(Uint8Array.from(Buffer.from(previousTxid, 'hex')).reverse(), 0, 144);
      transaction.addOutput(outputScript, outputValue);
      transaction.setWitness(0, [Uint8Array.of(1), new Uint8Array(), Uint8Array.of(0x51)]);
      return transaction;
    };
    let inputValue = 10_000;
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith(`/tx/${previousTxid}`)) {
        return makeJsonResponse({
          txid: previousTxid,
          vout: [{ scriptpubkey_address: address, value: inputValue }],
        });
      }
      return new Response('unexpected POST', { status: 500 });
    }) as unknown as typeof fetch;
    const vault = {
      address,
      addressType: 'p2wsh' as const,
      witnessScriptHex: '51',
      locktimeBlocks: 144,
      destinationAddress: address,
    };

    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: makeSpend(Uint8Array.of(0x51), 9_000n).toHex(),
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault,
    })).rejects.toThrow('Every transaction output must pay the confirmed destination address');

    const splitSpend = makeSpend(bitcoinAddress.toOutputScript(address, networks.testnet), 1n);
    splitSpend.addOutput(Uint8Array.of(0x51), 8_999n);
    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: splitSpend.toHex(),
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault,
    })).rejects.toThrow('Every transaction output must pay the confirmed destination address');

    inputValue = 2_000_000;
    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: makeSpend(bitcoinAddress.toOutputScript(address, networks.testnet), 1n).toHex(),
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault,
    })).rejects.toThrow('Transaction fee is too high');

    inputValue = 10_000;
    await expect(broadcastTransaction({
      network: 'testnet',
      rawTxHex: makeSpend(bitcoinAddress.toOutputScript(address, networks.testnet), 8_000n).toHex(),
      provider: 'mempool',
      fallbackToOtherProvider: false,
      fetcher,
      vault,
    })).rejects.toThrow('Transaction fee is too high');
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
