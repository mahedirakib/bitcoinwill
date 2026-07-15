import { PlanInput, PlanOutput, AddressType, type KeyOrigin } from './types';
import type { SSSConfig } from './sss';
import { calculateTime } from './utils';
import { buildPlan } from './planEngine';
import { bytesToHex, hexToBytes } from './hex';
import { buildLegacyRawDescriptor } from './descriptor';

const TAPROOT_NUMS_KEY = '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';

/** Constant-time equality check for two equal-length byte arrays. */
const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

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
  /** Address type — determines spending mechanics (P2WSH witness vs Taproot tapscript) */
  addressType: AddressType;
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
  /** Taproot control block required for script-path spends */
  taprootControlBlock?: string;
  /** Tapscript leaf version */
  taprootLeafVersion?: number;
  /** Owner signer origin for hardware-wallet identification */
  ownerKeyOrigin?: KeyOrigin;
  /** Beneficiary signer origin for hardware-wallet identification */
  beneficiaryKeyOrigin?: KeyOrigin;
  /** Social-recovery threshold loaded from the verified Recovery Kit. */
  sssConfig?: SSSConfig;
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
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Cryptographic digest is not available in this environment. Use a secure HTTPS connection.');
  }

  const data = JSON.stringify({
    plan: {
      network: plan.network,
      inheritance_type: plan.inheritance_type,
      owner_pubkey: plan.owner_pubkey,
      beneficiary_pubkey: plan.beneficiary_pubkey,
      locktime_blocks: plan.locktime_blocks,
      address_type: plan.address_type,
      recovery_method: plan.recovery_method,
      sss_config: plan.sss_config,
      plan_label: plan.plan_label,
      owner_key_origin: plan.owner_key_origin,
      beneficiary_key_origin: plan.beneficiary_key_origin,
    },
    result: {
      address: result.address,
      script_hex: result.script_hex,
      descriptor: result.descriptor,
      network: result.network,
      address_type: result.address_type,
      taproot_control_block: result.taproot_control_block,
      taproot_leaf_version: result.taproot_leaf_version,
    },
  });

  const encoder = new TextEncoder();
  // TextEncoder.encode() always returns a Uint8Array backed by a plain
  // ArrayBuffer (never SharedArrayBuffer); narrow the generic so it satisfies
  // SubtleCrypto's BufferSource parameter type.
  const dataBuffer = encoder.encode(data) as Uint8Array<ArrayBuffer>;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
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
    // Constant-time comparison: the checksum itself is derived from non-secret
    // plan data, so timing leakage is not directly dangerous here, but using a
    // constant-time comparison defends against copy-paste reuse of this helper
    // for authenticated (HMAC-style) checks in the future.
    return constantTimeEqual(hexToBytes(actualChecksum), hexToBytes(expectedChecksum));
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

  if (!isObjectRecord(raw.plan) || !isObjectRecord(raw.result)) {
    throw new Error('Invalid Recovery Kit: plan and result must be objects.');
  }

  const plan = raw.plan as unknown as PlanInput;
  const result = raw.result as unknown as PlanOutput;

  // buildPlan validates all input fields and yields canonical result values.
  const canonicalResult = buildPlan(plan);

  const descriptorMatches =
    result.descriptor === canonicalResult.descriptor ||
    result.descriptor === buildLegacyRawDescriptor(plan, canonicalResult.script_hex, TAPROOT_NUMS_KEY);
  const taprootMetadataMatches =
    canonicalResult.address_type !== 'p2tr' ||
    ((result.taproot_control_block === undefined ||
      result.taproot_control_block === canonicalResult.taproot_control_block) &&
      (result.taproot_leaf_version === undefined ||
        result.taproot_leaf_version === canonicalResult.taproot_leaf_version));
  const matchesCanonical =
    result.address === canonicalResult.address &&
    result.script_hex === canonicalResult.script_hex &&
    result.witness_script === canonicalResult.witness_script &&
    descriptorMatches &&
    result.network === canonicalResult.network &&
    result.address_type === canonicalResult.address_type &&
    taprootMetadataMatches;

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
    addressType: result.address_type,
    ownerPubkey: plan.owner_pubkey,
    beneficiaryPubkey: plan.beneficiary_pubkey,
    locktimeBlocks: plan.locktime_blocks,
    locktimeApprox: calculateTime(plan.locktime_blocks),
    witnessScriptHex: result.witness_script,
    witnessScriptAsm: result.script_asm,
    descriptor: result.descriptor,
    taprootControlBlock: result.taproot_control_block,
    taprootLeafVersion: result.taproot_leaf_version,
    ownerKeyOrigin: plan.owner_key_origin,
    beneficiaryKeyOrigin: plan.beneficiary_key_origin,
    sssConfig: plan.sss_config,
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
  const walletNote =
    m.addressType === 'p2tr'
      ? 'An Advanced Tool: Software that supports Taproot script-path spends. The descriptor below is watch-only; spending requires the tapscript recovery data.'
      : 'An Advanced Tool: Software that supports custom P2WSH spends. The descriptor below is watch-only; spending requires the witness script.';
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
2. This Instruction Set: Specifically the witness/tapscript data. The descriptor is for watch-only monitoring.
3. ${walletNote}

WHEN YOU CAN CLAIM
Delay: ${m.locktimeBlocks} blocks (Approx. ${m.locktimeApprox})
Condition: Every unspent output has an independent CSV timer. You can
claim a specific output only after that output has at least ${m.locktimeBlocks}
confirmations. Deposits made at different times mature separately.

TECHNICAL DETAILS
Network: ${m.network}
Vault Address: ${m.address}
Beneficiary Pubkey: ${m.beneficiaryPubkey}
${m.ownerKeyOrigin ? `Owner Signer Origin: ${m.ownerKeyOrigin.fingerprint ? `[${m.ownerKeyOrigin.fingerprint}]` : ''}${m.ownerKeyOrigin.derivation_path} (${m.ownerKeyOrigin.device})` : ''}
${m.beneficiaryKeyOrigin ? `Beneficiary Signer Origin: ${m.beneficiaryKeyOrigin.fingerprint ? `[${m.beneficiaryKeyOrigin.fingerprint}]` : ''}${m.beneficiaryKeyOrigin.derivation_path} (${m.beneficiaryKeyOrigin.device})` : ''}
Witness Script (Hex): ${m.witnessScriptHex}
Watch-only Descriptor: ${m.descriptor}
${m.addressType === 'p2tr' ? `Taproot Control Block: ${m.taprootControlBlock}
Taproot Leaf Version: 0x${m.taprootLeafVersion?.toString(16)}` : ''}

RECOVERY STEPS
1. Confirm the vault address has a balance using a blockchain explorer.
2. Inspect every UTXO you intend to spend and ensure each has at least ${m.locktimeBlocks} confirmations.
3. Construct a version 2 transaction. For each beneficiary input, set nSequence to ${m.locktimeBlocks}.
4. ${m.addressType === 'p2tr'
  ? 'Use witness stack [signature, empty branch selector, tapscript, control block].'
  : 'Use witness stack [signature, empty branch selector, witness script].'}
5. Send the funds to a standard address you control.

WARNINGS
- Mistakes are irreversible.
- Never share your private keys with anyone.
- Test this process on Testnet before using significant amounts.
--------------------------------------------------
  `.trim();
};
