import { describe, it, expect } from 'vitest';
import { networks } from 'bitcoinjs-lib';
import { getNetworkParams } from './network';

describe('network', () => {
  describe('getNetworkParams', () => {
    it('returns bitcoin network for mainnet', () => {
      const result = getNetworkParams('mainnet');
      expect(result).toBe(networks.bitcoin);
    });

    it('returns testnet network for testnet', () => {
      const result = getNetworkParams('testnet');
      expect(result).toBe(networks.testnet);
    });

    it('returns regtest network for regtest', () => {
      const result = getNetworkParams('regtest');
      expect(result).toBe(networks.regtest);
    });

    it('throws error for unsupported network', () => {
      expect(() => getNetworkParams('signet' as unknown as 'mainnet')).toThrow(
        'Unsupported Bitcoin network: signet'
      );
    });

    it('throws error for undefined network', () => {
      expect(() => getNetworkParams(undefined as unknown as 'mainnet')).toThrow(
        'Unsupported Bitcoin network: undefined'
      );
    });

    it('throws error for null network', () => {
      expect(() => getNetworkParams(null as unknown as 'mainnet')).toThrow(
        'Unsupported Bitcoin network: null'
      );
    });

    it('returns consistent network objects on multiple calls', () => {
      const result1 = getNetworkParams('mainnet');
      const result2 = getNetworkParams('mainnet');
      expect(result1).toBe(result2);
    });

    it('returns different objects for different networks', () => {
      const mainnet = getNetworkParams('mainnet');
      const testnet = getNetworkParams('testnet');
      const regtest = getNetworkParams('regtest');

      expect(mainnet).not.toBe(testnet);
      expect(mainnet).not.toBe(regtest);
      expect(testnet).not.toBe(regtest);
    });

    it('returns network with expected properties for mainnet', () => {
      const result = getNetworkParams('mainnet');
      expect(result).toHaveProperty('messagePrefix');
      expect(result).toHaveProperty('bech32');
      expect(result).toHaveProperty('bip32');
      expect(result).toHaveProperty('pubKeyHash');
      expect(result).toHaveProperty('scriptHash');
      expect(result).toHaveProperty('wif');
    });

    it('returns network with expected properties for testnet', () => {
      const result = getNetworkParams('testnet');
      expect(result).toHaveProperty('messagePrefix');
      expect(result).toHaveProperty('bech32');
      expect(result).toHaveProperty('bip32');
      expect(result).toHaveProperty('pubKeyHash');
      expect(result).toHaveProperty('scriptHash');
      expect(result).toHaveProperty('wif');
    });

    it('returns network with expected bech32 prefix for mainnet', () => {
      const result = getNetworkParams('mainnet');
      expect(result.bech32).toBe('bc');
    });

    it('returns network with expected bech32 prefix for testnet', () => {
      const result = getNetworkParams('testnet');
      expect(result.bech32).toBe('tb');
    });

    it('returns network with expected bech32 prefix for regtest', () => {
      const result = getNetworkParams('regtest');
      expect(result.bech32).toBe('bcrt');
    });

    it('handles empty string as unsupported network', () => {
      expect(() => getNetworkParams('' as unknown as 'mainnet')).toThrow(
        'Unsupported Bitcoin network: '
      );
    });

    it('handles number as unsupported network', () => {
      expect(() => getNetworkParams(123 as unknown as 'mainnet')).toThrow(
        'Unsupported Bitcoin network: 123'
      );
    });
  });
});
