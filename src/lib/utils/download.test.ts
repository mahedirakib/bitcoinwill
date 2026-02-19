import { describe, it, expect } from 'vitest';

describe('download', () => {
  it('downloadJson exists and is a function', async () => {
    const { downloadJson } = await import('./download');
    expect(typeof downloadJson).toBe('function');
  });

  it('downloadTxt exists and is a function', async () => {
    const { downloadTxt } = await import('./download');
    expect(typeof downloadTxt).toBe('function');
  });
});
