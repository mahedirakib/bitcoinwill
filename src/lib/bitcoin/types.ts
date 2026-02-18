/**
 * @fileoverview Type definitions for the Bitcoin Will protocol.
 * 
 * These types define the data structures used throughout the application
 * for creating and managing time-locked Bitcoin inheritance plans.
 * 
 * @module types
 */

/**
 * Supported Bitcoin networks.
 * - 'mainnet': Production Bitcoin network (real BTC)
 * - 'testnet': Public test network (test BTC)
 * - 'regtest': Local regression test network (for development)
 */
export type BitcoinNetwork = 'testnet' | 'regtest' | 'mainnet';
export const BITCOIN_NETWORKS: readonly BitcoinNetwork[] = ['testnet', 'regtest', 'mainnet'];
export const isBitcoinNetwork = (value: unknown): value is BitcoinNetwork =>
  typeof value === 'string' && BITCOIN_NETWORKS.includes(value as BitcoinNetwork);

import { SSSConfig, SocialRecoveryKit } from './sss';

/**
 * Recovery method for the inheritance plan.
 * - 'single': One beneficiary with a single private key
 * - 'social': Multiple shares distributed to trusted parties
 */
export type RecoveryMethod = 'single' | 'social';

/**
 * Supported Bitcoin address types for vault creation.
 * - 'p2wsh': Pay-to-Witness-Script-Hash (SegWit v0) - starts with bc1/tb1/bcrt1
 * - 'p2tr': Pay-to-Taproot (SegWit v1) - starts with bc1p/tb1p/bcrt1p
 */
export type AddressType = 'p2wsh' | 'p2tr';
export const ADDRESS_TYPES: readonly AddressType[] = ['p2wsh', 'p2tr'];
export const isAddressType = (value: unknown): value is AddressType =>
  typeof value === 'string' && ADDRESS_TYPES.includes(value as AddressType);

/**
 * Input parameters for creating a Bitcoin Will plan.
 * 
 * @interface PlanInput
 * @property {BitcoinNetwork} network - The Bitcoin network to use
 * @property {'timelock_recovery'} inheritance_type - The inheritance strategy type (currently only timelock)
 * @property {string} owner_pubkey - Owner's compressed public key in hex format (66 characters, starts with 02 or 03)
 * @property {string} beneficiary_pubkey - Beneficiary's compressed public key in hex format
 * @property {number} locktime_blocks - Relative locktime in blocks (1-52560, approx 1 block = 10 minutes)
 * @property {AddressType} [address_type] - Address type for vault (default: 'p2wsh' for backward compatibility)
 * @property {string} [plan_label] - Optional human-readable label for the plan
 * 
 * @example
 * const planInput: PlanInput = {
 *   network: 'testnet',
 *   inheritance_type: 'timelock_recovery',
 *   owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
 *   beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
 *   locktime_blocks: 144, // ~1 day
 *   address_type: 'p2tr', // Use Taproot
 *   plan_label: 'My Inheritance Plan'
 * };
 */
export interface PlanInput {
  network: BitcoinNetwork;
  inheritance_type: 'timelock_recovery';
  /** Compressed hex public key (33 bytes / 66 hex chars, starts with 02 or 03) */
  owner_pubkey: string;
  /** Compressed hex public key (33 bytes / 66 hex chars, starts with 02 or 03) */
  beneficiary_pubkey: string;
  /** Relative locktime in blocks (1-52560). Approximately 10 minutes per block. */
  locktime_blocks: number;
  /** Address type for vault (default: 'p2tr' for new users) */
  address_type?: AddressType;
  /** Recovery method: single key or social recovery with shares */
  recovery_method?: RecoveryMethod;
  /** SSS configuration (required if recovery_method is 'social') */
  sss_config?: SSSConfig;
  /** Optional label for identifying this plan */
  plan_label?: string;
}

export const INHERITANCE_TYPE = 'timelock_recovery' as const;

/**
 * Output data generated from a Bitcoin Will plan.
 * 
 * Contains all the technical details needed to interact with the vault,
 * including the address, scripts, and human-readable explanations.
 * 
 * @interface PlanOutput
 * @property {string} descriptor - Bitcoin descriptor for wallet import (e.g., "wsh(bitcoincore_script(...))")
 * @property {string} script_asm - Human-readable assembly representation of the witness script
 * @property {string} script_hex - Hexadecimal representation of the witness script
 * @property {string} address - The P2WSH vault address where funds should be sent
 * @property {string} witness_script - The witness script (redundant with script_hex, for compatibility)
 * @property {BitcoinNetwork} network - The network this plan was created for
 * @property {string[]} human_explanation - Array of human-readable explanations of the plan rules
 * 
 * @example
 * const planOutput: PlanOutput = {
 *   descriptor: 'wsh(bitcoincore_script(6376a914...88ac))',
 *   script_asm: 'OP_IF 02e963... OP_CHECKSIG OP_ELSE 144 ...',
 *   script_hex: '6376a914...88ac',
 *   address: 'tb1q...',
 *   witness_script: '6376a914...88ac',
 *   network: 'testnet',
 *   human_explanation: [
 *     'Vault Address: tb1q...',
 *     '1. The Owner can spend these funds at any time.',
 *     ...
 *   ]
 * };
 */
export interface PlanOutput {
  /** Bitcoin descriptor for importing into compatible wallets (e.g., Sparrow) */
  descriptor: string;
  /** Assembly representation of the witness script for human readability */
  script_asm: string;
  /** Hex representation of the compiled witness script */
  script_hex: string;
  /** The vault address where funds should be deposited (P2WSH or P2TR) */
  address: string;
  /** Witness script (hex) - same as script_hex, provided for clarity */
  witness_script: string;
  /** Network this plan targets */
  network: BitcoinNetwork;
  /** Address type used for this plan */
  address_type: AddressType;
  /** Optional social recovery kit with Shamir shares */
  social_recovery_kit?: SocialRecoveryKit;
  /** Human-readable explanation of the plan's spending conditions */
  human_explanation: string[];
}
