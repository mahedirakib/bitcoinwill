import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { formatRelativeTime } from './time';

describe('formatRelativeTime', () => {
  const FIXED_NOW = new Date('2026-06-04T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "never" for null, undefined, and invalid input', () => {
    expect(formatRelativeTime(null)).toBe('never');
    expect(formatRelativeTime(undefined)).toBe('never');
    expect(formatRelativeTime('not a date')).toBe('never');
  });

  it('handles "just now" for sub-minute diffs', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 5_000))).toBe('just now');
  });

  it('handles future sub-minute diffs', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW + 5_000))).toBe('in a moment');
  });

  it('formats minutes', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 5 * 60_000))).toBe('5 minutes ago');
    expect(formatRelativeTime(new Date(FIXED_NOW - 60_000))).toBe('1 minute ago');
  });

  it('formats hours', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 2 * 3_600_000))).toBe('2 hours ago');
    expect(formatRelativeTime(new Date(FIXED_NOW - 3_600_000))).toBe('1 hour ago');
  });

  it('formats days', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 3 * 86_400_000))).toBe('3 days ago');
    expect(formatRelativeTime(new Date(FIXED_NOW - 86_400_000))).toBe('1 day ago');
  });

  it('formats weeks', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 14 * 86_400_000))).toBe('2 weeks ago');
    expect(formatRelativeTime(new Date(FIXED_NOW - 7 * 86_400_000))).toBe('1 week ago');
  });

  it('formats months', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 60 * 86_400_000))).toBe('2 months ago');
  });

  it('formats years', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 400 * 86_400_000))).toBe('1 year ago');
  });

  it('accepts string input', () => {
    expect(formatRelativeTime(new Date(FIXED_NOW - 3_600_000).toISOString())).toBe('1 hour ago');
  });

  it('accepts numeric timestamp input', () => {
    expect(formatRelativeTime(FIXED_NOW - 3_600_000)).toBe('1 hour ago');
  });
});
