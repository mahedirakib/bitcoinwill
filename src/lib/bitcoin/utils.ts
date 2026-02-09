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
  const minutes = blocks * 10;
  const days = minutes / 1440;
  
  if (days < 1) {
    const hours = Math.round(minutes / 60);
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
