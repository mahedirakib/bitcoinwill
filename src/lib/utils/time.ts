const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/**
 * Formats a past date as a short relative time string (e.g. "3 days ago",
 * "just now", "in 2 hours"). Returns "never" for null/undefined input.
 */
export const formatRelativeTime = (input: string | number | Date | null | undefined): string => {
  if (input === null || input === undefined) return 'never';

  const date = input instanceof Date ? input : new Date(input);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return 'never';

  const diff = Date.now() - timestamp;
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;

  if (absDiff < MINUTE_MS) {
    return isFuture ? 'in a moment' : 'just now';
  }

  if (absDiff < HOUR_MS) {
    const value = Math.round(absDiff / MINUTE_MS);
    const unit = value === 1 ? 'minute' : 'minutes';
    return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
  }

  if (absDiff < DAY_MS) {
    const value = Math.round(absDiff / HOUR_MS);
    const unit = value === 1 ? 'hour' : 'hours';
    return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
  }

  if (absDiff < WEEK_MS) {
    const value = Math.round(absDiff / DAY_MS);
    const unit = value === 1 ? 'day' : 'days';
    return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
  }

  if (absDiff < MONTH_MS) {
    const value = Math.round(absDiff / WEEK_MS);
    const unit = value === 1 ? 'week' : 'weeks';
    return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
  }

  if (absDiff < YEAR_MS) {
    const value = Math.round(absDiff / MONTH_MS);
    const unit = value === 1 ? 'month' : 'months';
    return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
  }

  const value = Math.round(absDiff / YEAR_MS);
  const unit = value === 1 ? 'year' : 'years';
  return isFuture ? `in ${value} ${unit}` : `${value} ${unit} ago`;
};
