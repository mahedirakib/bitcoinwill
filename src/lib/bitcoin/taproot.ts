import { script, payments, initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { PlanInput, PlanOutput, AddressType } from './types';
import { getNetworkParams } from './network';
import { validatePlanInput } from './validation';
import { calculateTime } from './utils';
import { bytesToHex, hexToBytes } from './hex';

initEccLib(ecc);

// NUMS (Nothing Up My Sleeve) public key for unspendable internal key
// This is the standard BIP341 NUMS point (32-byte x-only pubkey)
// Source: https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
const NUMS_KEY_HEX = '50929b74c1a04954b78f4e4c2e56070430ca16dd8bb3856f8e0cb3d38f7d03aec';

export const buildTaprootPlan = (input: PlanInput): PlanOutput => {
  validatePlanInput(input);
  
  const network = getNetworkParams(input.network);
  const ownerPub = hexToBytes(input.owner_pubkey);
  const beneficiaryPub = hexToBytes(input.beneficiary_pubkey);
  
  // Build the tapscript (same logic as P2WSH but for Taproot leaf)
  const tapscript = script.compile([
    script.OPS.OP_IF,
      ownerPub,
      script.OPS.OP_CHECKSIG,
    script.OPS.OP_ELSE,
      script.number.encode(input.locktime_blocks),
      script.OPS.OP_CHECKSEQUENCEVERIFY,
      script.OPS.OP_DROP,
      beneficiaryPub,
      script.OPS.OP_CHECKSIG,
    script.OPS.OP_ENDIF,
  ]);

  // Create script tree with single leaf (the timelock script)
  const scriptTree = {
    output: tapscript,
    version: 0xc0 as const,
  };

  // Convert NUMS key to Buffer for internal pubkey
  const internalPubkey = Buffer.from(NUMS_KEY_HEX, 'hex');

  const p2tr = payments.p2tr({
    internalPubkey,
    scriptTree,
    network,
  });

  if (!p2tr.address) {
    throw new Error('Failed to generate Taproot address');
  }

  const scriptHex = bytesToHex(tapscript);

  return {
    descriptor: `tr(${NUMS_KEY_HEX}, {${scriptHex}})`,
    script_asm: script.toASM(tapscript),
    script_hex: scriptHex,
    address: p2tr.address,
    witness_script: scriptHex,
    network: input.network,
    address_type: 'p2tr' as AddressType,
    human_explanation: generateTaprootExplanation(input, p2tr.address),
  };
};

const generateTaprootExplanation = (input: PlanInput, address: string): string[] => {
  return [
    `Vault Address: ${address}`,
    `1. The Owner (${input.owner_pubkey.substring(0, 8)}...) can spend these funds at any time.`,
    `2. The Beneficiary (${input.beneficiary_pubkey.substring(0, 8)}...) can claim the funds ONLY if they have remained unmoved for at least ${input.locktime_blocks} blocks (approx. ${calculateTime(input.locktime_blocks)}).`,
    `3. Every time the Owner moves the funds to a new vault, the timer resets.`
  ];
};
