import { describe, it, expect } from 'vitest';
import * as ecc from 'tiny-secp256k1';
import { formatMasterFingerprint, formatPublicKey, parseLedgerPublicKeyResponse } from './hardwareWallet';
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

  it('rejects an empty Ledger response', () => {
    expect(() => parseLedgerPublicKeyResponse(new Uint8Array())).toThrow('missing public key length');
  });

  it('rejects a truncated Ledger response', () => {
    const response = new Uint8Array([33, 0x02]);
    expect(() => parseLedgerPublicKeyResponse(response)).toThrow('truncated public key');
  });

  it('rejects invalid public key bytes', () => {
    const response = new Uint8Array(34);
    response[0] = 33;
    response[1] = 0x02;

    expect(() => parseLedgerPublicKeyResponse(response)).toThrow('Invalid public key format');
  });
});

describe('formatPublicKey', () => {
  it('normalizes valid hardware wallet public keys', () => {
    expect(formatPublicKey(` ${COMPRESSED_PUBKEY.toUpperCase()} `)).toBe(COMPRESSED_PUBKEY);
  });

  it('rejects malformed hardware wallet public keys', () => {
    expect(() => formatPublicKey('02'.padEnd(66, '0'))).toThrow('Invalid public key format');
  });
});

describe('formatMasterFingerprint', () => {
  it('normalizes and zero-pads device fingerprints', () => {
    expect(formatMasterFingerprint(0x12ab)).toBe('000012ab');
    expect(formatMasterFingerprint('0xA1B2C3D4')).toBe('a1b2c3d4');
  });

  it('rejects malformed device fingerprints', () => {
    expect(() => formatMasterFingerprint('not-hex')).toThrow('Invalid hardware wallet master fingerprint');
  });
});
