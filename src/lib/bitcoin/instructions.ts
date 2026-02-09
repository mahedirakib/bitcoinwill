import { PlanInput, PlanOutput } from './types';

/**
 * Data model for beneficiary-facing instructions.
 *
 * This interface structures all the information needed for a beneficiary
 * to successfully claim funds from a vault after the timelock expires.
 *
 * @interface InstructionModel
 */
export interface InstructionModel {
  /** Network name in uppercase (e.g., "TESTNET", "MAINNET") */
  network: string;
  /** The vault address where funds are held */
  address: string;
  /** Owner's public key (for reference) */
  ownerPubkey: string;
  /** Beneficiary's public key (required for claiming) */
  beneficiaryPubkey: string;
  /** Locktime duration in blocks */
  locktimeBlocks: number;
  /** Human-readable approximation of the locktime duration */
  locktimeApprox: string;
  /** Witness script in hexadecimal format */
  witnessScriptHex: string;
  /** Witness script in assembly format (human-readable) */
  witnessScriptAsm: string;
  /** Bitcoin descriptor for wallet import */
  descriptor: string;
  /** ISO 8601 timestamp of when instructions were generated */
  createdAt?: string;
}

/**
 * Builds an instruction model from a completed plan.
 *
 * Transforms the internal plan data structures into a format optimized
 * for beneficiary consumption and instruction generation.
 *
 * @param {PlanInput} plan - The original plan input with configuration
 * @param {PlanOutput} result - The generated plan output with addresses and scripts
 * @param {string} [createdAt] - Optional ISO timestamp (defaults to current time)
 * @returns {InstructionModel} Structured instruction data
 *
 * @example
 * const instructions = buildInstructions(planInput, planOutput, '2026-02-08T10:30:00Z');
 * console.log(instructions.address);        // Vault address
 * console.log(instructions.locktimeApprox); // "~1 day"
 */
export const buildInstructions = (plan: PlanInput, result: PlanOutput, createdAt?: string): InstructionModel => {
  return {
    network: plan.network.toUpperCase(),
    address: result.address,
    ownerPubkey: plan.owner_pubkey,
    beneficiaryPubkey: plan.beneficiary_pubkey,
    locktimeBlocks: plan.locktime_blocks,
    locktimeApprox: calculateTime(plan.locktime_blocks),
    witnessScriptHex: result.witness_script,
    witnessScriptAsm: result.script_asm,
    descriptor: result.descriptor,
    createdAt: createdAt || new Date().toISOString(),
  };
};

/**
 * Converts block count to human-readable time approximation.
 *
 * Assumes average block time of 10 minutes per block.
 * Returns the most appropriate unit (hours, days, months, or years).
 *
 * @param {number} blocks - Number of Bitcoin blocks
 * @returns {string} Human-readable time approximation
 *
 * @example
 * calculateTime(144)   // "~1 days" (approx 1 day)
 * calculateTime(4320)  // "~1 months" (approx 1 month)
 * calculateTime(52560) // "~1.0 years" (approx 1 year)
 *
 * @private
 */
function calculateTime(blocks: number): string {
  const minutes = blocks * 10;
  const days = minutes / 1440;
  if (days < 1) return `${Math.round(minutes / 60)} hours`;
  if (days < 30) return `${Math.round(days)} days`;
  const months = days / 30.44;
  if (Math.round(months) < 12) return `${Math.round(months)} months`;
  return `${(days / 365.25).toFixed(1)} years`;
}

/**
 * Generates plain-text beneficiary instructions.
 *
 * Creates a comprehensive text document containing all the information
 * a beneficiary needs to claim funds from the vault, including:
 * - What they need (private key, witness script)
 * - When they can claim (timelock conditions)
 * - Technical details (address, script, descriptor)
 * - Step-by-step recovery process
 * - Safety warnings
 *
 * @param {InstructionModel} m - The instruction model with all vault details
 * @returns {string} Formatted plain-text instructions
 *
 * @example
 * const txt = generateInstructionTxt(instructionModel);
 * downloadTxt('beneficiary-instructions.txt', txt);
 */
export const generateInstructionTxt = (m: InstructionModel): string => {
  return `
BENEFICIARY INSTRUCTIONS (BITCOIN WILL)
Generated on: ${m.createdAt}
--------------------------------------------------

WHAT THIS IS
This document contains the technical details required to claim funds 
from a Bitcoin Will "Dead Man's Switch" vault.

WHAT YOU NEED
1. Your Private Key: You must hold the private key corresponding to 
   the Beneficiary Public Key listed below.
2. This Instruction Set: Specifically the Witness Script or Descriptor.
3. An Advanced Wallet: Tools like Sparrow Wallet or Electrum that 
   support "Custom Scripts" or "P2WSH" spending.

WHEN YOU CAN CLAIM
Delay: ${m.locktimeBlocks} blocks (Approx. ${m.locktimeApprox})
Condition: You can only claim these funds if they have remained 
unmoved at the vault address for longer than the delay period 
since the last funding transaction confirmed.

TECHNICAL DETAILS
Network: ${m.network}
Vault Address: ${m.address}
Beneficiary Pubkey: ${m.beneficiaryPubkey}
Witness Script (Hex): ${m.witnessScriptHex}
Descriptor: ${m.descriptor}

RECOVERY STEPS
1. Confirm the vault address has a balance using a blockchain explorer.
2. Identify the funding transaction and wait for ${m.locktimeBlocks} blocks to pass.
3. Construct a "Sweep" transaction using a compatible wallet.
4. Provide your signature and the "Witness Script" to unlock the funds.
5. Send the funds to a standard address you control.

WARNINGS
- Mistakes are irreversible.
- Never share your private keys with anyone.
- Test this process on Testnet before using significant amounts.
--------------------------------------------------
  `.trim();
};
