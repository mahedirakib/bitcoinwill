import { describe, it, expect } from 'vitest';
import { hexToBytes, bytesToHex } from './hex';

describe('hex', () => {
  describe('hexToBytes', () => {
    it('converts valid hex string to bytes', () => {
      const result = hexToBytes('deadbeef');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
      expect(result[0]).toBe(0xde);
      expect(result[1]).toBe(0xad);
      expect(result[2]).toBe(0xbe);
      expect(result[3]).toBe(0xef);
    });

    it('handles uppercase hex strings', () => {
      const result = hexToBytes('DEADBEEF');
      expect(result.length).toBe(4);
      expect(result[0]).toBe(0xde);
    });

    it('handles mixed case hex strings', () => {
      const result = hexToBytes('DeAdBeEf');
      expect(result.length).toBe(4);
      expect(result[0]).toBe(0xde);
    });

    it('trims whitespace from hex strings', () => {
      const result = hexToBytes('  deadbeef  ');
      expect(result.length).toBe(4);
      expect(result[0]).toBe(0xde);
    });

    it('handles single byte', () => {
      const result = hexToBytes('ff');
      expect(result.length).toBe(1);
      expect(result[0]).toBe(255);
    });

    it('handles empty string', () => {
      const result = hexToBytes('');
      expect(result.length).toBe(0);
    });

    it('handles long hex strings (public key size)', () => {
      const hexKey = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      const result = hexToBytes(hexKey);
      expect(result.length).toBe(33);
    });

    it('handles 32-byte private key', () => {
      const hexKey = '0000000000000000000000000000000000000000000000000000000000000001';
      const result = hexToBytes(hexKey);
      expect(result.length).toBe(32);
    });

    it('throws error on odd-length hex string', () => {
      expect(() => hexToBytes('abc')).toThrow('Hex string must have an even length.');
    });

    it('throws error on invalid hex characters', () => {
      expect(() => hexToBytes('gggg')).toThrow('Invalid hex string.');
    });



    it('throws error on empty invalid hex in middle', () => {
      expect(() => hexToBytes('de  ad')).toThrow('Invalid hex string.');
    });

    it('handles all valid hex characters', () => {
      const allHex = '0123456789abcdef';
      const result = hexToBytes(allHex);
      expect(result.length).toBe(8);
      expect(result[0]).toBe(0x01);
      expect(result[7]).toBe(0xef);
    });

    it('converts zero bytes correctly', () => {
      const result = hexToBytes('0000');
      expect(result.length).toBe(2);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(0);
    });

    it('handles maximum byte value', () => {
      const result = hexToBytes('ffff');
      expect(result[0]).toBe(255);
      expect(result[1]).toBe(255);
    });
  });

  describe('bytesToHex', () => {
    it('converts bytes to lowercase hex string', () => {
      const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      expect(bytesToHex(bytes)).toBe('deadbeef');
    });

    it('handles empty array', () => {
      expect(bytesToHex(new Uint8Array([]))).toBe('');
    });

    it('handles single byte', () => {
      expect(bytesToHex(new Uint8Array([0xff]))).toBe('ff');
    });

    it('pads single-digit hex values with zero', () => {
      const bytes = new Uint8Array([0x01, 0x0a, 0x0f]);
      expect(bytesToHex(bytes)).toBe('010a0f');
    });

    it('handles zero bytes', () => {
      expect(bytesToHex(new Uint8Array([0x00, 0x00]))).toBe('0000');
    });

    it('round-trips correctly with hexToBytes', () => {
      const original = '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474';
      const bytes = hexToBytes(original);
      const backToHex = bytesToHex(bytes);
      expect(backToHex).toBe(original.toLowerCase());
    });

    it('handles 33-byte public key', () => {
      const bytes = new Uint8Array(33).fill(0xab);
      const hex = bytesToHex(bytes);
      expect(hex.length).toBe(66);
      expect(hex).toBe('ab'.repeat(33));
    });

    it('handles 32-byte private key', () => {
      const bytes = new Uint8Array(32).fill(0xcd);
      const hex = bytesToHex(bytes);
      expect(hex.length).toBe(64);
      expect(hex).toBe('cd'.repeat(32));
    });

    it('handles all byte values 0-255', () => {
      const bytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        bytes[i] = i;
      }
      const hex = bytesToHex(bytes);
      expect(hex.length).toBe(512);
      expect(hex.startsWith('00010203')).toBe(true);
      expect(hex.endsWith('fcfdfeff')).toBe(true);
    });
  });

  describe('round-trip conversion', () => {
    it('preserves data through hexToBytes then bytesToHex', () => {
      const testCases = [
        '',
        '00',
        'ff',
        'deadbeef',
        '00000000000000000000000000000000',
        'ffffffffffffffffffffffffffffffff',
        '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
      ];

      testCases.forEach((hex) => {
        const bytes = hexToBytes(hex);
        const recovered = bytesToHex(bytes);
        expect(recovered).toBe(hex.toLowerCase());
      });
    });

    it('preserves data through bytesToHex then hexToBytes', () => {
      const testCases = [
        new Uint8Array([]),
        new Uint8Array([0]),
        new Uint8Array([255]),
        new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
        new Uint8Array(32).fill(0xab),
        new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      ];

      testCases.forEach((bytes) => {
        const hex = bytesToHex(bytes);
        const recovered = hexToBytes(hex);
        expect(recovered).toEqual(bytes);
      });
    });
  });
});
