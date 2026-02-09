import { PlanInput } from './types';

export const validatePubkey = (pubkey: string): boolean => {
  // Simple hex validation for compressed pubkeys (33 bytes / 66 chars)
  const hexRegex = /^(02|03)[a-fA-F0-9]{64}$/;
  return hexRegex.test(pubkey);
};

export const validatePlanInput = (input: PlanInput): void => {
  if (!validatePubkey(input.owner_pubkey)) {
    throw new Error('Invalid Owner Public Key. Must be a 33-byte compressed hex string (66 characters starting with 02 or 03).');
  }
  if (!validatePubkey(input.beneficiary_pubkey)) {
    throw new Error('Invalid Beneficiary Public Key. Must be a 33-byte compressed hex string.');
  }
  if (input.owner_pubkey === input.beneficiary_pubkey) {
    throw new Error('Owner and Beneficiary public keys must be different.');
  }
  
  // Max 52560 blocks is ~1 year. Minimum 1 block.
  if (input.locktime_blocks < 1 || input.locktime_blocks > 52560) {
    throw new Error('Delay must be between 1 and 52,560 blocks (approx. 1 year).');
  }
};