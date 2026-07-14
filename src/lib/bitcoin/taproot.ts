import { script, payments } from 'bitcoinjs-lib';
import './init';
import { PlanInput, PlanOutput, AddressType } from './types';
import { getNetworkParams } from './network';
import { validatePlanInput } from './validation';
import { generatePlanExplanation } from './utils';
import { bytesToHex, hexToBytes } from './hex';
import { buildAddressDescriptor } from './descriptor';

// NUMS (Nothing Up My Sleeve) public key for unspendable internal key
// This is the standard BIP341 NUMS point (32-byte x-only pubkey)
// Source: https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki
const NUMS_KEY_HEX = '50929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0';

export const buildTaprootPlan = (input: PlanInput): PlanOutput => {
  validatePlanInput({ ...input, address_type: 'p2tr' });
  
  const network = getNetworkParams(input.network);
  // BIP342 tapscript pubkeys must be 32-byte x-only. Strip the parity prefix
  // from the compressed (33-byte) form. A 33-byte push would be treated as an
  // "unknown public key type" by OP_CHECKSIG, which returns success without
  // verifying the signature — making the vault spendable by anyone.
  const ownerPub = hexToBytes(input.owner_pubkey).slice(1);
  const beneficiaryPub = hexToBytes(input.beneficiary_pubkey).slice(1);

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

  const internalPubkey = hexToBytes(NUMS_KEY_HEX);

  const p2tr = payments.p2tr({
    internalPubkey,
    scriptTree,
    redeem: { output: tapscript, redeemVersion: 0xc0 },
    network,
  });

  if (!p2tr.address) {
    throw new Error('Failed to generate Taproot address');
  }

  const scriptHex = bytesToHex(tapscript);
  const controlBlock = p2tr.witness?.[p2tr.witness.length - 1];
  if (!controlBlock) {
    throw new Error('Failed to generate Taproot control block');
  }

  return {
    descriptor: buildAddressDescriptor(p2tr.address),
    script_asm: script.toASM(tapscript),
    script_hex: scriptHex,
    address: p2tr.address,
    witness_script: scriptHex,
    network: input.network,
    address_type: 'p2tr' as AddressType,
    taproot_control_block: bytesToHex(controlBlock),
    taproot_leaf_version: 0xc0,
    human_explanation: generatePlanExplanation(input, p2tr.address),
  };
};
