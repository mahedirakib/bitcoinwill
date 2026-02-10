import { script, payments, initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { PlanInput, PlanOutput } from './types';
import { getNetworkParams } from './network';
import { validatePlanInput } from './validation';

// Initialize ECC library for bitcoinjs-lib
initEccLib(ecc);

/**
 * Bitcoin Script Construction Module
 * 
 * This module implements the TimeLock Inheritance Protocol (TIP) using native
 * Bitcoin Script opcodes. It creates a P2WSH (Pay-to-Witness-Script-Hash) vault
 * with two spending paths:
 * 
 * **Script Logic:**
 * ```
 * OP_IF
 *   <owner_pubkey> OP_CHECKSIG          // Path 1: Owner immediate spend
 * OP_ELSE
 *   <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP  // Path 2: CSV time-lock
 *   <beneficiary_pubkey> OP_CHECKSIG    //        Beneficiary claim after delay
 * OP_ENDIF
 * ```
 * 
 * **Spending Methods:**
 * - Owner Path: [signature, 1] - Can spend immediately at any time
 * - Beneficiary Path: [signature, 0] - Can spend only after CSV delay expires
 * 
 * @module planEngine
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki|BIP-112 CSV}
 * @see {@link https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki|BIP-141 SegWit}
 */

/**
 * Builds a complete Bitcoin Will plan from user input.
 * 
 * This is the core function that creates the inheritance vault. It:
 * 1. Validates all input parameters
 * 2. Constructs the witness script with dual spending paths
 * 3. Generates the P2WSH SegWit address
 * 4. Creates a descriptor for wallet import
 * 5. Generates human-readable explanations
 * 
 * The resulting vault allows the owner to spend at any time, while enabling
 * the beneficiary to claim funds only after the specified delay period.
 * 
 * @param {PlanInput} input - The plan configuration with network, keys, and delay
 * @returns {PlanOutput} Complete plan with address, scripts, and instructions
 * @throws {Error} If validation fails or address generation fails
 * 
 * @example
 * const plan = buildPlan({
 *   network: 'testnet',
 *   inheritance_type: 'timelock_recovery',
 *   owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
 *   beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
 *   locktime_blocks: 144 // ~1 day
 * });
 * 
 * console.log(plan.address);     // tb1q... (vault address)
 * console.log(plan.descriptor);  // wsh(bitcoincore_script(...))
 * console.log(plan.script_asm);  // Human-readable script
 */
export const buildPlan = (input: PlanInput): PlanOutput => {
  validatePlanInput(input);
  
  const network = getNetworkParams(input.network);
  const ownerPub = Buffer.from(input.owner_pubkey, 'hex');
  const beneficiaryPub = Buffer.from(input.beneficiary_pubkey, 'hex');
  
  // Build the script
  const witnessScript = script.compile([
    script.OPS.OP_IF,
      ownerPub,
      script.OPS.OP_CHECKSIG,
    script.OPS.OP_ELSE,
      script.number.encode(input.locktime_blocks),
      script.OPS.OP_CHECKSEQUENCEVERIFY,
      script.OPS.OP_DROP,
      beneficiaryPub,
      script.OPS.OP_CHECKSIG,
    script.OPS.OP_ENDIF,
  ]);

  const p2wsh = payments.p2wsh({
    redeem: { output: witnessScript, network },
    network,
  });

  if (!p2wsh.address) {
    throw new Error('Failed to generate SegWit address');
  }

  const scriptHex = Buffer.from(witnessScript).toString('hex');

  return {
    descriptor: `wsh(raw(${scriptHex}))`,
    script_asm: script.toASM(witnessScript),
    script_hex: scriptHex,
    address: p2wsh.address,
    witness_script: scriptHex,
    network: input.network,
    human_explanation: generateExplanation(input, p2wsh.address),
  };
};

/**
 * Generates human-readable explanations of the plan's spending conditions.
 * 
 * Creates an array of strings that explain in plain English:
 * - The vault address
 * - Owner's immediate spending rights
 * - Beneficiary's conditional spending rights after CSV delay
 * - Timer reset behavior on owner activity
 * 
 * @param {PlanInput} input - The plan input containing keys and locktime
 * @param {string} address - The generated vault address
 * @returns {string[]} Array of explanation strings for UI display
 * 
 * @private This is an internal helper function, not exported
 */
const generateExplanation = (input: PlanInput, address: string): string[] => {
  return [
    `Vault Address: ${address}`,
    `1. The Owner (${input.owner_pubkey.substring(0, 8)}...) can spend these funds at any time.`,
    `2. The Beneficiary (${input.beneficiary_pubkey.substring(0, 8)}...) can claim the funds ONLY if they have remained unmoved for at least ${input.locktime_blocks} blocks (approx. ${Math.round(input.locktime_blocks / 144)} days).`,
    `3. Every time the Owner moves the funds to a new vault, the timer resets.`
  ];
};
