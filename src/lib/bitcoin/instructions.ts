import { PlanInput, PlanOutput } from './types';
import { calculateTime } from './utils';
import { buildPlan } from './planEngine';
import { bytesToHex } from './hex';

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
 * Recovery Kit JSON export schema.
 */
export interface RecoveryKitData {
  version?: string;
  created_at?: string;
  plan: PlanInput;
  result: PlanOutput;
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Generates a SHA-256 checksum for recovery kit data.
 *
 * Creates a cryptographic hash of the plan and result data to detect
 * any tampering or corruption of the recovery kit file.
 *
 * @param plan - The plan input data
 * @param result - The plan result data
 * @returns Hex-encoded SHA-256 checksum
 */
export const generateRecoveryKitChecksum = async (
  plan: PlanInput,
  result: PlanOutput
): Promise<string> => {
  const data = JSON.stringify({
    plan: {
      network: plan.network,
      inheritance_type: plan.inheritance_type,
      owner_pubkey: plan.owner_pubkey,
      beneficiary_pubkey: plan.beneficiary_pubkey,
      locktime_blocks: plan.locktime_blocks,
      address_type: plan.address_type,
    },
    result: {
      address: result.address,
      script_hex: result.script_hex,
      descriptor: result.descriptor,
      network: result.network,
      address_type: result.address_type,
    },
  });

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer.buffer as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);

  return bytesToHex(hashArray);
};

/**
 * Verifies the checksum of a recovery kit.
 *
 * @param plan - The plan input data
 * @param result - The plan result data
 * @param expectedChecksum - The expected checksum to verify against
 * @returns True if checksum matches, false otherwise
 */
export const verifyRecoveryKitChecksum = async (
  plan: PlanInput,
  result: PlanOutput,
  expectedChecksum: string
): Promise<boolean> => {
  try {
    const actualChecksum = await generateRecoveryKitChecksum(plan, result);
    return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
  } catch {
    return false;
  }
};

/**
 * Validates Recovery Kit JSON and normalizes the result using canonical script generation.
 *
 * This protects against tampered or malformed JSON by rebuilding the plan and requiring
 * core result fields to match exactly.
 */
export const validateAndNormalizeRecoveryKit = (raw: unknown): RecoveryKitData => {
  if (!isObjectRecord(raw)) {
    throw new Error('Invalid Recovery Kit: expected a JSON object.');
  }

  const plan = raw.plan as PlanInput | undefined;
  const result = raw.result as PlanOutput | undefined;

  if (!plan || !result) {
    throw new Error('Invalid Recovery Kit: missing plan or result.');
  }

  // buildPlan validates all input fields and yields canonical result values.
  const canonicalResult = buildPlan(plan);

  const matchesCanonical =
    result.address === canonicalResult.address &&
    result.script_hex === canonicalResult.script_hex &&
    result.witness_script === canonicalResult.witness_script &&
    result.descriptor === canonicalResult.descriptor &&
    result.network === canonicalResult.network;

  if (!matchesCanonical) {
    throw new Error('Recovery Kit failed integrity check. The plan does not match the included result.');
  }

  return {
    version: typeof raw.version === 'string' ? raw.version : undefined,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : undefined,
    plan,
    result: canonicalResult,
  };
};

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
