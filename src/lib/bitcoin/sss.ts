/**
 * Shamir's Secret Sharing Module
 * 
 * Implements social recovery by splitting the beneficiary's private key
 * into multiple shares using Shamir's Secret Sharing algorithm.
 * 
 * Security properties:
 * - Threshold shares required to reconstruct (e.g., 2-of-3, 3-of-5)
 * - Fewer than threshold shares reveal ZERO information about the secret
 * - Pure math, no trusted third parties
 * 
 * @module sss
 * @see {@link https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing}
 */

import { split, combine } from 'shamir-secret-sharing';
import { bytesToHex, hexToBytes } from './hex';

export type SSSThreshold = 2 | 3;
export type SSSTotal = 3 | 5;

export interface SSSConfig {
  /** Number of shares required to reconstruct (threshold) */
  threshold: SSSThreshold;
  /** Total number of shares generated */
  total: SSSTotal;
}

export interface SSShare {
  /** Share index (1-based for user-friendliness) */
  index: number;
  /** Hex-encoded share data */
  share: string;
}

export interface SocialRecoveryKit {
  /** Configuration used to generate shares */
  config: SSSConfig;
  /** Array of shares */
  shares: SSShare[];
  /** Human-readable instructions */
  instructions: string[];
}

/**
 * Get available SSS configurations for UI display.
 */
export const getSSSOptions = (): Array<{ id: string; label: string; description: string }> => [
  {
    id: '2-of-3',
    label: '2-of-3 Shares',
    description: 'Split among 3 trusted people, any 2 can recover',
  },
  {
    id: '3-of-5',
    label: '3-of-5 Shares',
    description: 'Split among 5 family members, any 3 can recover',
  },
];

/**
 * Split a private key into Shamir shares.
 * 
 * @param privateKeyHex - 32-byte private key in hex format
 * @param config - SSS configuration (threshold and total shares)
 * @returns SocialRecoveryKit with shares and instructions
 * @throws Error if private key is invalid or split fails
 */
export const splitPrivateKey = async (
  privateKeyHex: string,
  config: SSSConfig
): Promise<SocialRecoveryKit> => {
  // Validate private key
  if (!/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
    throw new Error('Invalid private key: must be 64 hex characters (32 bytes)');
  }

  const secret = hexToBytes(privateKeyHex);
  
  // Generate shares (library expects: secret, total_shares, threshold)
  const shares = await split(secret, config.total, config.threshold);
  
  // Format shares for display
  const formattedShares: SSShare[] = shares.map((share, idx) => ({
    index: idx + 1, // 1-based for user-friendliness
    share: bytesToHex(share),
  }));

  return {
    config,
    shares: formattedShares,
    instructions: generateInstructions(config),
  };
};

/**
 * Combine Shamir shares to reconstruct the private key.
 * 
 * @param shares - Array of shares (must meet threshold)
 * @returns Reconstructed private key in hex format
 * @throws Error if shares are invalid or insufficient
 */
export const combineShares = async (shares: string[]): Promise<string> => {
  if (shares.length < 2) {
    throw new Error('At least 2 shares required to reconstruct');
  }

  const shareBuffers = shares.map(hexToBytes);
  const secret = await combine(shareBuffers);
  
  return bytesToHex(secret);
};

/**
 * Generate human-readable instructions for distributing shares.
 */
const generateInstructions = (config: SSSConfig): string[] => {
  const { threshold, total } = config;
  
  return [
    `SOCIAL RECOVERY CONFIGURATION: ${threshold}-of-${total}`,
    '',
    `You have generated ${total} shares. Any ${threshold} of them can reconstruct the private key.`,
    '',
    'DISTRIBUTION STRATEGY:',
    `• Give each share to a different trusted person`,
    `• Never store all shares in the same location`,
    `• Inform each person what the share is for`,
    `• Consider geographic distribution (different cities/countries)`,
    '',
    'SECURITY NOTES:',
    `• ${threshold - 1} or fewer shares reveal NOTHING about the key`,
    `• Shares are useless without meeting the ${threshold}-share threshold`,
    `• If one share is lost, the remaining ${total - 1} are still sufficient`,
  ];
};

/**
 * Validate a share format.
 */
export const validateShare = (shareHex: string): boolean => {
  // Shares are typically longer than the secret (contain metadata)
  // Minimum: 64 hex chars, but typically 70-80+ chars
  return /^[0-9a-fA-F]{64,}$/.test(shareHex);
};
