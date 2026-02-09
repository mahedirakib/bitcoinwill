import { script, payments, networks } from 'bitcoinjs-lib';
import { PlanInput, PlanOutput } from './types';
import { getNetworkParams } from './network';
import { validatePlanInput } from './validation';

/**
 * Bitcoin Construction (MVP):
 * 
 * Script Logic:
 * OP_IF
 *   <owner_pubkey> OP_CHECKSIG
 * OP_ELSE
 *   <locktime_blocks> OP_CHECKSEQUENCEVERIFY OP_DROP
 *   <beneficiary_pubkey> OP_CHECKSIG
 * OP_ENDIF
 * 
 * To spend as Owner: [signature, 1]
 * To spend as Beneficiary: [signature, 0] (after CSV time)
 */

export const buildPlan = (input: PlanInput): PlanOutput => {
  validatePlanInput(input);
  
  const network = input.network === 'mainnet' ? networks.bitcoin : getNetworkParams(input.network);
  const ownerPub = Buffer.from(input.owner_pubkey, 'hex');
  const beneficiaryPub = Buffer.from(input.beneficiary_pubkey, 'hex');
  
  // Build the script
  const witnessScript = script.compile([
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
  ]) as Buffer;

  const p2wsh = payments.p2wsh({
    redeem: { output: witnessScript, network },
    network,
  });

  if (!p2wsh.address) {
    throw new Error('Failed to generate SegWit address');
  }

  const scriptHex = witnessScript.toString('hex');

  return {
    descriptor: `wsh(bitcoincore_script(${scriptHex}))`,
    script_asm: script.toASM(witnessScript),
    script_hex: scriptHex,
    address: p2wsh.address,
    witness_script: scriptHex,
    network: input.network,
    human_explanation: generateExplanation(input, p2wsh.address),
  };
};

const generateExplanation = (input: PlanInput, address: string): string[] => {
  return [
    `Vault Address: ${address}`,
    `1. The Owner (${input.owner_pubkey.substring(0, 8)}...) can spend these funds at any time.`,
    `2. The Beneficiary (${input.beneficiary_pubkey.substring(0, 8)}...) can claim the funds ONLY if they have remained unmoved for at least ${input.locktime_blocks} blocks (approx. ${Math.round(input.locktime_blocks / 144)} days).`,
    `3. Every time the Owner moves the funds to a new vault, the timer resets.`
  ];
};
