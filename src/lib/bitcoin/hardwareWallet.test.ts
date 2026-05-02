import { describe, it, expect } from 'vitest';
import * as ecc from 'tiny-secp256k1';
import { parseLedgerPublicKeyResponse } from './hardwareWallet';
import { validatePubkey } from './validation';
import { hexToBytes } from './hex';

const COMPRESSED_PUBKEY =
  '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

describe('parseLedgerPublicKeyResponse', () => {
  it('compresses an uncompressed 65-byte pubkey returned by Ledger', () => {
    const compressed = hexToBytes(COMPRESSED_PUBKEY);
    const uncompressed = ecc.pointCompress(compressed, false);
    expect(uncompressed.length).toBe(65);
    expect(uncompressed[0]).toBe(0x04);

    const response = new Uint8Array(1 + uncompressed.length + 1);
    response[0] = uncompressed.length;
    response.set(uncompressed, 1);
    response[1 + uncompressed.length] = 0;

    const result = parseLedgerPublicKeyResponse(response);

    expect(result).toBe(COMPRESSED_PUBKEY);
    expect(validatePubkey(result)).toBe(true);
  });

  it('passes through a compressed 33-byte pubkey unchanged', () => {
    const compressed = hexToBytes(COMPRESSED_PUBKEY);
    const response = new Uint8Array(1 + compressed.length);
    response[0] = compressed.length;
    response.set(compressed, 1);

    const result = parseLedgerPublicKeyResponse(response);

    expect(result).toBe(COMPRESSED_PUBKEY);
    expect(validatePubkey(result)).toBe(true);
  });
});
