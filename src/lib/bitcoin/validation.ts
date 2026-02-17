import { PlanInput, isBitcoinNetwork, INHERITANCE_TYPE } from './types';
import * as ecc from 'tiny-secp256k1';
import { hexToBytes } from './hex';

/**
 * Validates a Bitcoin public key format and curve validity.
 * 
 * Checks if the provided string is a valid compressed public key:
 * - Must be exactly 66 hexadecimal characters
 * - Must start with "02" or "03" (compressed key prefix)
 * - Must contain only valid hex characters (0-9, a-f, A-F)
 * - MUST be a valid point on the secp256k1 curve
 * 
 * @param {string} pubkey - The public key string to validate
 * @returns {boolean} True if the key is valid and on the curve, false otherwise
 */
export const validatePubkey = (pubkey: string): boolean => {
  const hexRegex = /^(02|03)[a-fA-F0-9]{64}$/;
  if (!hexRegex.test(pubkey)) return false;

  try {
    const keyBytes = hexToBytes(pubkey);
    return ecc.isPoint(keyBytes);
  } catch {
    return false;
  }
};

/**
 * Validates all input parameters for creating a Bitcoin Will plan.
 * 
 * Performs comprehensive validation of the plan input:
 * - Owner public key format and validity
 * - Beneficiary public key format and validity
 * - Ensures owner and beneficiary keys are different
 * - Validates locktime is within acceptable range (1-52560 blocks)
 * 
 * Throws descriptive errors to help users correct input issues.
 * 
 * @param {PlanInput} input - The plan input object to validate
 * @throws {Error} If any validation check fails
 * 
 * @example
 * try {
 *   validatePlanInput({
 *     network: 'testnet',
 *     inheritance_type: 'timelock_recovery',
 *     owner_pubkey: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
 *     beneficiary_pubkey: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
 *     locktime_blocks: 144
 *   });
 *   // Validation passed
 * } catch (error) {
 *   // Handle validation error
 * }
 */
export const validatePlanInput = (input: PlanInput): void => {
  if (!isBitcoinNetwork(input.network)) {
    throw new Error('Invalid network. Supported values: testnet, regtest, mainnet.');
  }

  if (input.inheritance_type !== INHERITANCE_TYPE) {
    throw new Error(`Invalid inheritance type. Supported value: "${INHERITANCE_TYPE}".`);
  }

  if (!validatePubkey(input.owner_pubkey)) {
    throw new Error(
      'Invalid Owner Public Key.\n\n' +
      'Expected format: 66-character hexadecimal string starting with "02" or "03"\n' +
      'Example: 02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474\n\n' +
      'Common issues:\n' +
      '- Key is too short or too long (must be exactly 66 characters)\n' +
      '- Does not start with "02" or "03" (must be a compressed public key)\n' +
      '- Contains invalid characters (only 0-9 and a-f allowed)\n\n' +
      'How to find your public key:\n' +
      '- Sparrow Wallet: Settings > Show XPUB/Keys > copy "Master Public Key"\n' +
      '- Electrum: Wallet > Information > copy "Master Public Key"'
    );
  }
  if (!validatePubkey(input.beneficiary_pubkey)) {
    throw new Error(
      'Invalid Beneficiary Public Key.\n\n' +
      'Expected format: 66-character hexadecimal string starting with "02" or "03"\n' +
      'Example: 03a634f19b165239105436a5c17e3371901c5651581452a329978747474747474\n\n' +
      'Note: This must be the beneficiary\'s public key, not their address.\n' +
      'The beneficiary must provide their compressed public key (not private key).'
    );
  }
  if (
    input.owner_pubkey.trim().toLowerCase() ===
    input.beneficiary_pubkey.trim().toLowerCase()
  ) {
    throw new Error(
      'Owner and Beneficiary public keys must be different.\n\n' +
      'You cannot use the same key for both owner and beneficiary.\n' +
      'The beneficiary must have their own separate key pair.\n\n' +
      'Why this matters:\n' +
      '- Owner key: Used to spend funds at any time\n' +
      '- Beneficiary key: Used to claim funds only after the timelock expires\n' +
      'Having different keys ensures the inheritance mechanism works correctly.'
    );
  }
  
  if (!Number.isSafeInteger(input.locktime_blocks) || input.locktime_blocks < 1 || input.locktime_blocks > 52560) {
    throw new Error(
      'Invalid delay period.\n\n' +
      'Delay must be between 1 and 52,560 blocks (approximately 1 year).\n\n' +
      'Common examples:\n' +
      '- 144 blocks ≈ 1 day\n' +
      '- 1,008 blocks ≈ 1 week\n' +
      '- 4,320 blocks ≈ 1 month\n' +
      '- 52,560 blocks ≈ 1 year (maximum)\n\n' +
      'Note: Each block takes approximately 10 minutes on average.'
    );
  }
};
