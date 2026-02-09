import { PlanInput, PlanOutput } from './types';

export interface InstructionModel {
  network: string;
  address: string;
  ownerPubkey: string;
  beneficiaryPubkey: string;
  locktimeBlocks: number;
  locktimeApprox: string;
  witnessScriptHex: string;
  witnessScriptAsm: string;
  descriptor: string;
  createdAt?: string;
}

export const buildInstructions = (plan: PlanInput, result: PlanOutput, createdAt?: string): InstructionModel => {
  return {
    network: plan.network.toUpperCase(),
    address: result.address,
    ownerPubkey: plan.owner_pubkey,
    beneficiaryPubkey: plan.beneficiary_pubkey,
    locktimeBlocks: plan.locktime_blocks,
    locktimeApprox: calculateTime(plan.locktime_blocks),
    witnessScriptHex: result.witness_script,
    witnessScriptAsm: result.script_asm,
    descriptor: result.descriptor,
    createdAt: createdAt || new Date().toISOString(),
  };
};

function calculateTime(blocks: number): string {
  const minutes = blocks * 10;
  const days = minutes / 1440;
  if (days < 1) return `${Math.round(minutes / 60)} hours`;
  if (days < 30) return `${Math.round(days)} days`;
  const months = days / 30.44;
  if (months < 12) return `${Math.round(months)} months`;
  return `${(days / 365.25).toFixed(1)} years`;
}

export const generateInstructionTxt = (m: InstructionModel): string => {
  return `
BENEFICIARY INSTRUCTIONS (BITCOIN WILL)
Generated on: ${m.createdAt}
--------------------------------------------------

WHAT THIS IS
This document contains the technical details required to claim funds 
from a Bitcoin Will "Dead Man's Switch" vault.

WHAT YOU NEED
1. Your Private Key: You must hold the private key corresponding to 
   the Beneficiary Public Key listed below.
2. This Instruction Set: Specifically the Witness Script or Descriptor.
3. An Advanced Wallet: Tools like Sparrow Wallet or Electrum that 
   support "Custom Scripts" or "P2WSH" spending.

WHEN YOU CAN CLAIM
Delay: ${m.locktimeBlocks} blocks (Approx. ${m.locktimeApprox})
Condition: You can only claim these funds if they have remained 
unmoved at the vault address for longer than the delay period 
since the last funding transaction confirmed.

TECHNICAL DETAILS
Network: ${m.network}
Vault Address: ${m.address}
Beneficiary Pubkey: ${m.beneficiaryPubkey}
Witness Script (Hex): ${m.witnessScriptHex}
Descriptor: ${m.descriptor}

RECOVERY STEPS
1. Confirm the vault address has a balance using a blockchain explorer.
2. Identify the funding transaction and wait for ${m.locktimeBlocks} blocks to pass.
3. Use a compatible wallet to construct a "Sweep" transaction.
4. Provide your signature and the "Witness Script" to unlock the funds.
5. Send the funds to a standard address you control.

WARNINGS
- Mistakes are irreversible.
- Never share your private keys with anyone.
- Test this process on Testnet before using significant amounts.
--------------------------------------------------
  `.trim();
};
