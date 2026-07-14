import type { PlanInput } from './types';

const INPUT_CHARSET =
  "0123456789()[],'/*abcdefgh@:$%{}IJKLMNOPQRSTUVWXYZ&+-.;<=>?!^_|~ijklmnopqrstuvwxyzABCDEFGH`#\"\\ ";
const CHECKSUM_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const POLYMOD_GENERATORS = [
  0xf5dee51989n,
  0xa9fdca3312n,
  0x1bab10e32dn,
  0x3706b1677an,
  0x644d626ffdn,
] as const;

const descriptorPolymod = (checksum: bigint, value: number): bigint => {
  const top = checksum >> 35n;
  let next = ((checksum & 0x7ffffffffn) << 5n) ^ BigInt(value);
  for (let index = 0; index < POLYMOD_GENERATORS.length; index += 1) {
    if (((top >> BigInt(index)) & 1n) !== 0n) next ^= POLYMOD_GENERATORS[index];
  }
  return next;
};

export const addDescriptorChecksum = (descriptor: string): string => {
  let checksum = 1n;
  let group = 0;
  let groupSize = 0;

  for (const character of descriptor) {
    const position = INPUT_CHARSET.indexOf(character);
    if (position === -1) {
      throw new Error(`Descriptor contains an unsupported character: ${character}`);
    }
    checksum = descriptorPolymod(checksum, position & 31);
    group = group * 3 + (position >> 5);
    groupSize += 1;
    if (groupSize === 3) {
      checksum = descriptorPolymod(checksum, group);
      group = 0;
      groupSize = 0;
    }
  }

  if (groupSize > 0) checksum = descriptorPolymod(checksum, group);
  for (let index = 0; index < 8; index += 1) checksum = descriptorPolymod(checksum, 0);
  checksum ^= 1n;

  let encoded = '';
  for (let index = 0; index < 8; index += 1) {
    const shift = BigInt(5 * (7 - index));
    encoded += CHECKSUM_CHARSET[Number((checksum >> shift) & 31n)];
  }
  return `${descriptor}#${encoded}`;
};

export const buildAddressDescriptor = (address: string): string =>
  addDescriptorChecksum(`addr(${address})`);

export const buildLegacyRawDescriptor = (
  input: PlanInput,
  scriptHex: string,
  taprootInternalKey: string,
): string => input.address_type === 'p2tr'
  ? `tr(${taprootInternalKey}, raw(${scriptHex}))`
  : `wsh(raw(${scriptHex}))`;
