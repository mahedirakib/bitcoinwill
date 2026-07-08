import { AVG_BLOCK_TIME_MINUTES } from './types';
import type { PlanInput } from './types';

/**
 * Converts block count to human-readable time approximation.
 *
 * Assumes average block time of 10 minutes per block.
 * Returns the most appropriate unit (hours, days, months, or years).
 *
 * @param {number} blocks - Number of Bitcoin blocks
 * @returns {string} Human-readable time approximation
 */
export function calculateTime(blocks: number): string {
  if (!Number.isFinite(blocks) || blocks <= 0) {
    return '0 hours';
  }

  const minutes = blocks * AVG_BLOCK_TIME_MINUTES;
  const days = minutes / 1440;

  if (days < 1) {
    const hours = Math.max(1, Math.round(minutes / 60));
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  if (days < 30) {
    const roundedDays = Math.round(days);
    return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'}`;
  }

  const months = days / 30.44;
  if (Math.round(months) < 12) {
    const roundedMonths = Math.round(months);
    return `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'}`;
  }

  const years = (days / 365.25).toFixed(1);
  return `${years} years`;
}

/**
 * Generates the human-readable explanation of a vault's spending conditions.
 *
 * Shared by the P2WSH and Taproot plan builders so the wording cannot drift
 * between the two address types.
 *
 * @param input - The plan input containing keys and locktime
 * @param address - The generated vault address
 * @returns Array of explanation strings for UI display
 */
export const generatePlanExplanation = (input: PlanInput, address: string): string[] => [
  `Vault Address: ${address}`,
  `1. The Owner (${input.owner_pubkey.substring(0, 8)}...) can spend these funds at any time.`,
  `2. The Beneficiary (${input.beneficiary_pubkey.substring(0, 8)}...) can claim the funds ONLY if they have remained unmoved for at least ${input.locktime_blocks} blocks (approx. ${calculateTime(input.locktime_blocks)}).`,
  `3. Every time the Owner moves the funds to a new vault, the timer resets.`,
];
