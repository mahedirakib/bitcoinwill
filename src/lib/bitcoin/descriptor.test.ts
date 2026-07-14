import { describe, expect, it } from 'vitest';
import {
  addDescriptorChecksum,
  buildAddressDescriptor,
} from './descriptor';

describe('descriptor helpers', () => {
  it('matches the Bitcoin Core descriptor checksum test vector', () => {
    expect(addDescriptorChecksum('raw(deadbeef)')).toBe('raw(deadbeef)#89f8spxm');
  });

  it('builds a checksummed watch-only address descriptor', () => {
    const address = 'tb1q0ytd2adyf7f7hwzx847ak0mfhly0ulnx83auz9gjdvt5uu2h4wasmjy5xu';
    const descriptor = buildAddressDescriptor(address);

    expect(descriptor).toContain(`addr(${address})`);
    expect(descriptor).toMatch(/#[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{8}$/);
    expect(descriptor).not.toContain('raw(');
  });
});
