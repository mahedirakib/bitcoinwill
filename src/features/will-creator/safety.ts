export const SAMPLE_KEYS = {
  owner: '02e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
  beneficiary: '03e9634f19b165239105436a5c17e3371901c5651581452a329978747474747474',
};

export const normalizePubkeyHex = (value: string): string => value.trim().toLowerCase();

const SAMPLE_KEY_SET = new Set([
  normalizePubkeyHex(SAMPLE_KEYS.owner),
  normalizePubkeyHex(SAMPLE_KEYS.beneficiary),
]);

export const usesDisallowedSampleKey = (ownerPubkey: string, beneficiaryPubkey: string): boolean =>
  SAMPLE_KEY_SET.has(normalizePubkeyHex(ownerPubkey)) ||
  SAMPLE_KEY_SET.has(normalizePubkeyHex(beneficiaryPubkey));
